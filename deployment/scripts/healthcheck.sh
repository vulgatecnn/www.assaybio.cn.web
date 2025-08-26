#!/bin/bash
# AssayBio 健康检查脚本
# 用于Docker容器健康状态监控

set -euo pipefail

# ====================
# 配置参数
# ====================
HEALTH_CHECK_PORT="${HEALTH_CHECK_PORT:-80}"
HEALTH_CHECK_PATH="${HEALTH_CHECK_PATH:-/health}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-10}"
MAX_RETRIES="${MAX_RETRIES:-3}"
CHECK_INTERVAL="${CHECK_INTERVAL:-1}"

# 日志级别
LOG_LEVEL="${LOG_LEVEL:-INFO}"

# ====================
# 日志函数
# ====================
log() {
    if [ "$LOG_LEVEL" = "DEBUG" ] || [ "$1" != "DEBUG" ]; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$1] ${2}" >&2
    fi
}

# ====================
# 健康检查函数
# ====================

# 基础HTTP检查
check_http() {
    local url="http://localhost:${HEALTH_CHECK_PORT}${HEALTH_CHECK_PATH}"
    log "INFO" "Checking HTTP endpoint: $url"
    
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time "$HEALTH_CHECK_TIMEOUT" \
        --connect-timeout 5 \
        "$url" 2>/dev/null || echo "000")
    
    if [ "$response_code" = "200" ]; then
        log "DEBUG" "HTTP check passed (200 OK)"
        return 0
    else
        log "ERROR" "HTTP check failed (status: $response_code)"
        return 1
    fi
}

# 检查Nginx进程
check_nginx_process() {
    log "DEBUG" "Checking Nginx process"
    
    if pgrep nginx > /dev/null; then
        log "DEBUG" "Nginx process is running"
        return 0
    else
        log "ERROR" "Nginx process not found"
        return 1
    fi
}

# 检查端口监听
check_port_listening() {
    log "DEBUG" "Checking if port $HEALTH_CHECK_PORT is listening"
    
    if netstat -tuln 2>/dev/null | grep -q ":${HEALTH_CHECK_PORT} " || \
       ss -tuln 2>/dev/null | grep -q ":${HEALTH_CHECK_PORT} "; then
        log "DEBUG" "Port $HEALTH_CHECK_PORT is listening"
        return 0
    else
        log "ERROR" "Port $HEALTH_CHECK_PORT is not listening"
        return 1
    fi
}

# 检查文件系统空间
check_disk_space() {
    log "DEBUG" "Checking disk space"
    
    local usage
    usage=$(df /usr/share/nginx/html 2>/dev/null | awk 'NR==2 {print $5}' | sed 's/%//' || echo "100")
    
    if [ "$usage" -lt 90 ]; then
        log "DEBUG" "Disk space OK ($usage% used)"
        return 0
    else
        log "ERROR" "Disk space critical ($usage% used)"
        return 1
    fi
}

# 检查内存使用
check_memory() {
    log "DEBUG" "Checking memory usage"
    
    local mem_usage
    if command -v free > /dev/null; then
        mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    else
        # Alpine Linux fallback
        mem_usage=$(awk '/MemTotal|MemFree/{if($1=="MemTotal:") total=$2; if($1=="MemFree:") free=$2} END{printf "%.0f", (total-free)*100/total}' /proc/meminfo 2>/dev/null || echo "0")
    fi
    
    if [ "$mem_usage" -lt 90 ]; then
        log "DEBUG" "Memory usage OK ($mem_usage% used)"
        return 0
    else
        log "ERROR" "Memory usage high ($mem_usage% used)"
        return 1
    fi
}

# 检查关键文件存在性
check_critical_files() {
    log "DEBUG" "Checking critical files"
    
    local critical_files=(
        "/usr/share/nginx/html/index.html"
        "/etc/nginx/nginx.conf"
        "/etc/nginx/conf.d/default.conf"
    )
    
    for file in "${critical_files[@]}"; do
        if [ ! -f "$file" ]; then
            log "ERROR" "Critical file missing: $file"
            return 1
        fi
    done
    
    log "DEBUG" "All critical files present"
    return 0
}

# 检查Nginx配置语法
check_nginx_config() {
    log "DEBUG" "Checking Nginx configuration syntax"
    
    if nginx -t 2>/dev/null; then
        log "DEBUG" "Nginx configuration syntax OK"
        return 0
    else
        log "ERROR" "Nginx configuration syntax error"
        return 1
    fi
}

# 应用特定检查
check_application() {
    log "DEBUG" "Performing application-specific checks"
    
    # 检查主页内容
    local content
    content=$(curl -s --max-time 5 "http://localhost:${HEALTH_CHECK_PORT}/" 2>/dev/null || echo "")
    
    if echo "$content" | grep -q "AssayBio\|assaybio"; then
        log "DEBUG" "Application content check passed"
        return 0
    else
        log "ERROR" "Application content check failed"
        return 1
    fi
}

# 综合健康检查
comprehensive_check() {
    log "INFO" "Starting comprehensive health check"
    
    local checks=(
        "check_nginx_process"
        "check_port_listening"
        "check_critical_files"
        "check_nginx_config"
        "check_http"
        "check_application"
        "check_disk_space"
        "check_memory"
    )
    
    local failed_checks=()
    
    for check in "${checks[@]}"; do
        if ! $check; then
            failed_checks+=("$check")
        fi
    done
    
    if [ ${#failed_checks[@]} -eq 0 ]; then
        log "INFO" "All health checks passed"
        return 0
    else
        log "ERROR" "Failed checks: ${failed_checks[*]}"
        return 1
    fi
}

# ====================
# 带重试的健康检查
# ====================
health_check_with_retry() {
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log "INFO" "Health check attempt $attempt/$MAX_RETRIES"
        
        if comprehensive_check; then
            log "INFO" "Health check successful on attempt $attempt"
            return 0
        fi
        
        if [ $attempt -lt $MAX_RETRIES ]; then
            log "INFO" "Health check failed, retrying in ${CHECK_INTERVAL}s..."
            sleep $CHECK_INTERVAL
        fi
        
        ((attempt++))
    done
    
    log "ERROR" "Health check failed after $MAX_RETRIES attempts"
    return 1
}

# ====================
# 快速检查模式
# ====================
quick_check() {
    log "DEBUG" "Performing quick health check"
    
    # 只检查最关键的项目
    if check_http && check_nginx_process; then
        log "INFO" "Quick health check passed"
        return 0
    else
        log "ERROR" "Quick health check failed"
        return 1
    fi
}

# ====================
# 健康报告生成
# ====================
generate_health_report() {
    log "INFO" "Generating health report"
    
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    local report="/tmp/health-report.json"
    
    # 创建JSON格式的健康报告
    cat > "$report" << EOF
{
    "timestamp": "$timestamp",
    "status": "unknown",
    "checks": {
        "http": $(check_http && echo "true" || echo "false"),
        "nginx_process": $(check_nginx_process && echo "true" || echo "false"),
        "port_listening": $(check_port_listening && echo "true" || echo "false"),
        "critical_files": $(check_critical_files && echo "true" || echo "false"),
        "nginx_config": $(check_nginx_config && echo "true" || echo "false"),
        "application": $(check_application && echo "true" || echo "false"),
        "disk_space": $(check_disk_space && echo "true" || echo "false"),
        "memory": $(check_memory && echo "true" || echo "false")
    },
    "metadata": {
        "container_id": "${HOSTNAME:-unknown}",
        "environment": "${ENVIRONMENT:-unknown}",
        "version": "${IMAGE_TAG:-unknown}"
    }
}
EOF
    
    # 更新整体状态
    if comprehensive_check; then
        sed -i 's/"status": "unknown"/"status": "healthy"/' "$report"
    else
        sed -i 's/"status": "unknown"/"status": "unhealthy"/' "$report"
    fi
    
    cat "$report"
    return 0
}

# ====================
# 主函数
# ====================
main() {
    local mode="${1:-check}"
    
    case "$mode" in
        "check")
            health_check_with_retry
            ;;
        "quick")
            quick_check
            ;;
        "report")
            generate_health_report
            ;;
        "once")
            comprehensive_check
            ;;
        *)
            log "ERROR" "Unknown mode: $mode"
            log "INFO" "Usage: $0 [check|quick|report|once]"
            exit 1
            ;;
    esac
}

# 运行健康检查
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi