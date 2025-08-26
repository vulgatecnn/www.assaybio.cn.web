#!/bin/bash
# AssayBio Docker容器入口点脚本
# 初始化容器环境并启动Web服务

set -euo pipefail

# ====================
# 环境变量默认值
# ====================
export NGINX_USER="${NGINX_USER:-nginx-app}"
export NGINX_GROUP="${NGINX_GROUP:-nginx-app}"
export NGINX_WORKER_PROCESSES="${NGINX_WORKER_PROCESSES:-auto}"
export NGINX_WORKER_CONNECTIONS="${NGINX_WORKER_CONNECTIONS:-1024}"
export NGINX_KEEPALIVE_TIMEOUT="${NGINX_KEEPALIVE_TIMEOUT:-30}"
export ENVIRONMENT="${ENVIRONMENT:-production}"

# ====================
# 日志函数
# ====================
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ENTRYPOINT] $1" >&2
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ENTRYPOINT] ERROR: $1" >&2
    exit 1
}

# ====================
# 初始化函数
# ====================

# 检查运行环境
check_environment() {
    log "Checking container environment"
    
    # 检查必需的目录
    local required_dirs=(
        "/usr/share/nginx/html"
        "/var/log/nginx"
        "/var/cache/nginx"
        "/etc/nginx"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            error "Required directory not found: $dir"
        fi
    done
    
    # 检查必需的文件
    local required_files=(
        "/etc/nginx/nginx.conf"
        "/usr/share/nginx/html/index.html"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            error "Required file not found: $file"
        fi
    done
    
    log "Environment check passed"
}

# 设置文件权限
setup_permissions() {
    log "Setting up file permissions"
    
    # 确保nginx用户存在
    if ! id "$NGINX_USER" &>/dev/null; then
        log "Creating nginx user: $NGINX_USER"
        adduser -D -S -G "$NGINX_GROUP" "$NGINX_USER" 2>/dev/null || true
    fi
    
    # 设置目录权限
    chown -R "$NGINX_USER:$NGINX_GROUP" /var/log/nginx /var/cache/nginx 2>/dev/null || true
    chown -R "$NGINX_USER:$NGINX_GROUP" /usr/share/nginx/html 2>/dev/null || true
    
    # 设置文件权限
    chmod -R 755 /usr/share/nginx/html
    find /usr/share/nginx/html -type f -name "*.html" -exec chmod 644 {} \; 2>/dev/null || true
    find /usr/share/nginx/html -type f -name "*.css" -exec chmod 644 {} \; 2>/dev/null || true
    find /usr/share/nginx/html -type f -name "*.js" -exec chmod 644 {} \; 2>/dev/null || true
    find /usr/share/nginx/html -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.gif" -o -name "*.svg" -o -name "*.ico" \) -exec chmod 644 {} \; 2>/dev/null || true
    
    log "Permissions setup completed"
}

# 配置Nginx
configure_nginx() {
    log "Configuring Nginx"
    
    # 创建临时配置目录
    local temp_conf="/tmp/nginx.conf"
    
    # 复制基础配置
    cp /etc/nginx/nginx.conf "$temp_conf"
    
    # 替换环境变量
    sed -i "s/worker_processes auto/worker_processes $NGINX_WORKER_PROCESSES/" "$temp_conf"
    sed -i "s/worker_connections 1024/worker_connections $NGINX_WORKER_CONNECTIONS/" "$temp_conf"
    sed -i "s/keepalive_timeout 30/keepalive_timeout $NGINX_KEEPALIVE_TIMEOUT/" "$temp_conf"
    
    # 验证配置
    if nginx -t -c "$temp_conf" 2>/dev/null; then
        cp "$temp_conf" /etc/nginx/nginx.conf
        log "Nginx configuration updated successfully"
    else
        log "Nginx configuration validation failed, using default config"
    fi
    
    rm -f "$temp_conf"
}

# 优化系统设置
optimize_system() {
    log "Optimizing system settings"
    
    # 设置时区
    if [ -n "${TZ:-}" ] && [ -f "/usr/share/zoneinfo/$TZ" ]; then
        cp "/usr/share/zoneinfo/$TZ" /etc/localtime
        echo "$TZ" > /etc/timezone
        log "Timezone set to $TZ"
    fi
    
    # 优化文件描述符限制（如果有权限）
    ulimit -n 65535 2>/dev/null || true
    
    # 创建PID目录
    mkdir -p /var/run/nginx
    chown "$NGINX_USER:$NGINX_GROUP" /var/run/nginx
    
    log "System optimization completed"
}

# 预热应用
warmup_application() {
    log "Warming up application"
    
    # 启动Nginx（后台）
    nginx -g "daemon off;" &
    local nginx_pid=$!
    
    # 等待Nginx启动
    sleep 5
    
    # 预热请求
    local warmup_urls=(
        "http://localhost/"
        "http://localhost/health"
    )
    
    for url in "${warmup_urls[@]}"; do
        curl -s "$url" > /dev/null 2>&1 || true
        log "Warmup request sent to: $url"
    done
    
    # 停止Nginx
    kill $nginx_pid 2>/dev/null || true
    wait $nginx_pid 2>/dev/null || true
    
    log "Application warmup completed"
}

# 创建健康检查端点
create_health_endpoint() {
    log "Creating health check endpoint"
    
    local health_file="/usr/share/nginx/html/health"
    
    cat > "$health_file" << EOF
{
    "status": "healthy",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "environment": "$ENVIRONMENT",
    "container_id": "${HOSTNAME:-unknown}",
    "version": "${IMAGE_TAG:-latest}",
    "nginx": {
        "worker_processes": "$NGINX_WORKER_PROCESSES",
        "worker_connections": "$NGINX_WORKER_CONNECTIONS"
    }
}
EOF
    
    chmod 644 "$health_file"
    chown "$NGINX_USER:$NGINX_GROUP" "$health_file"
    
    log "Health check endpoint created"
}

# 设置信号处理
setup_signal_handlers() {
    log "Setting up signal handlers"
    
    # 创建优雅关闭脚本
    cat > /usr/local/bin/graceful-shutdown.sh << 'EOF'
#!/bin/bash
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Received shutdown signal"

# 发送QUIT信号给Nginx进行优雅关闭
if [ -f /var/run/nginx.pid ]; then
    nginx_pid=$(cat /var/run/nginx.pid)
    if kill -0 $nginx_pid 2>/dev/null; then
        echo "Sending graceful shutdown signal to Nginx (PID: $nginx_pid)"
        kill -QUIT $nginx_pid
        
        # 等待Nginx优雅关闭
        for i in {1..30}; do
            if ! kill -0 $nginx_pid 2>/dev/null; then
                echo "Nginx gracefully shut down"
                exit 0
            fi
            sleep 1
        done
        
        echo "Forcing Nginx shutdown"
        kill -TERM $nginx_pid 2>/dev/null || true
    fi
fi

exit 0
EOF
    
    chmod +x /usr/local/bin/graceful-shutdown.sh
    
    # 设置信号陷阱
    trap '/usr/local/bin/graceful-shutdown.sh' SIGTERM SIGINT
    
    log "Signal handlers setup completed"
}

# 日志轮转设置
setup_log_rotation() {
    log "Setting up log rotation"
    
    # 启动日志轮转守护进程（后台）
    if command -v logrotate > /dev/null; then
        (
            while true; do
                logrotate -f /etc/logrotate.d/nginx 2>/dev/null || true
                sleep 3600  # 每小时检查一次
            done
        ) &
    fi
    
    log "Log rotation setup completed"
}

# 监控设置
setup_monitoring() {
    log "Setting up monitoring"
    
    # 创建监控脚本
    cat > /usr/local/bin/monitor.sh << 'EOF'
#!/bin/bash
while true; do
    # 检查Nginx进程
    if ! pgrep nginx > /dev/null; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: Nginx process not found" >&2
        exit 1
    fi
    
    # 检查磁盘空间
    usage=$(df /usr/share/nginx/html | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$usage" -gt 95 ]; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: Disk usage critical: $usage%" >&2
    fi
    
    sleep 30
done
EOF
    
    chmod +x /usr/local/bin/monitor.sh
    /usr/local/bin/monitor.sh &
    
    log "Monitoring setup completed"
}

# 显示启动信息
show_startup_info() {
    cat << EOF

=====================================
AssayBio Website Container Started
=====================================
Environment: $ENVIRONMENT
Nginx User: $NGINX_USER
Worker Processes: $NGINX_WORKER_PROCESSES
Worker Connections: $NGINX_WORKER_CONNECTIONS
Keepalive Timeout: ${NGINX_KEEPALIVE_TIMEOUT}s
Container ID: ${HOSTNAME:-unknown}
Startup Time: $(date)
=====================================

EOF
}

# ====================
# 主初始化流程
# ====================
initialize_container() {
    log "Initializing AssayBio container"
    
    check_environment
    setup_permissions
    configure_nginx
    optimize_system
    create_health_endpoint
    setup_signal_handlers
    setup_log_rotation
    setup_monitoring
    
    # 在生产环境中预热应用
    if [ "$ENVIRONMENT" = "production" ]; then
        warmup_application
    fi
    
    log "Container initialization completed"
    show_startup_info
}

# ====================
# 主入口点
# ====================
main() {
    log "Starting AssayBio container entrypoint"
    
    # 如果第一个参数是nginx命令，则执行初始化
    if [ "${1:-}" = "nginx" ]; then
        initialize_container
        
        # 执行传入的命令
        log "Starting Nginx with command: $*"
        exec "$@"
    else
        # 直接执行传入的命令
        log "Executing command: $*"
        exec "$@"
    fi
}

# 运行主函数
main "$@"