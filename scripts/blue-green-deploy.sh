#!/bin/bash
# AssayBio蓝绿部署脚本
# 实现零停机部署，确保服务连续性

set -euo pipefail

# 脚本配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="${PROJECT_ROOT}/deployment"
LOGS_DIR="${DEPLOY_DIR}/logs"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "${LOGS_DIR}/deploy.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "${LOGS_DIR}/deploy.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "${LOGS_DIR}/deploy.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "${LOGS_DIR}/deploy.log"
}

# 错误处理
error_handler() {
    local exit_code=$?
    local line_number=$1
    log_error "脚本在第 ${line_number} 行发生错误，退出码: ${exit_code}"
    cleanup_on_failure
    exit $exit_code
}

trap 'error_handler ${LINENO}' ERR

# 清理函数
cleanup_on_failure() {
    log_warning "开始清理失败的部署..."
    
    # 停止可能启动的新容器
    if docker-compose -f "${DEPLOY_DIR}/docker/docker-compose.yml" ps | grep -q "assaybio-website-green"; then
        docker-compose -f "${DEPLOY_DIR}/docker/docker-compose.yml" stop assaybio-website-green || true
        docker-compose -f "${DEPLOY_DIR}/docker/docker-compose.yml" rm -f assaybio-website-green || true
    fi
    
    log_info "清理完成"
}

# 检查依赖
check_dependencies() {
    log_info "检查部署依赖..."
    
    local deps=("docker" "docker-compose" "curl" "jq")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "缺少依赖: $dep"
            exit 1
        fi
    done
    
    # 检查Docker服务
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 读取配置
load_config() {
    log_info "加载部署配置..."
    
    # 加载环境变量
    if [[ -f "${PROJECT_ROOT}/.env" ]]; then
        set -a
        source "${PROJECT_ROOT}/.env"
        set +a
    fi
    
    # 设置默认值
    export IMAGE_TAG="${IMAGE_TAG:-latest}"
    export DEPLOY_TIMEOUT="${DEPLOY_TIMEOUT:-300}"
    export HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-30}"
    export HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-10}"
    
    log_info "配置加载完成 - 镜像标签: ${IMAGE_TAG}"
}

# 预部署检查
pre_deployment_check() {
    log_info "开始预部署检查..."
    
    # 检查镜像是否存在
    if ! docker pull "ghcr.io/assaybio/website:${IMAGE_TAG}"; then
        log_error "无法拉取镜像: ghcr.io/assaybio/website:${IMAGE_TAG}"
        exit 1
    fi
    
    # 检查当前服务状态
    if ! curl -f http://localhost/health &> /dev/null; then
        log_warning "当前服务健康检查失败，将执行首次部署"
        FIRST_DEPLOYMENT=true
    else
        log_info "当前服务运行正常"
        FIRST_DEPLOYMENT=false
    fi
    
    # 检查端口占用
    if ! $FIRST_DEPLOYMENT; then
        if netstat -tuln | grep -q ":8080 "; then
            log_error "蓝绿部署端口8080被占用"
            exit 1
        fi
    fi
    
    log_success "预部署检查完成"
}

# 启动绿色环境
start_green_environment() {
    log_info "启动绿色环境（新版本）..."
    
    cd "$DEPLOY_DIR"
    
    # 创建绿色环境的compose文件
    cat > docker/docker-compose-green.yml << EOF
version: '3.8'

services:
  assaybio-website-green:
    image: ghcr.io/assaybio/website:${IMAGE_TAG}
    container_name: assaybio-website-green
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
      - DEPLOY_ENV=green
    networks:
      - assaybio-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
    labels:
      - "com.docker.compose.service=assaybio-website-green"
      - "deploy.environment=green"
      - "deploy.version=${IMAGE_TAG}"

networks:
  assaybio-network:
    external: true
    name: assaybio-network
EOF

    # 启动绿色环境
    docker-compose -f docker/docker-compose-green.yml up -d
    
    log_info "绿色环境启动完成，等待健康检查..."
}

# 健康检查
health_check() {
    local environment=$1
    local port=$2
    local max_retries=${HEALTH_CHECK_RETRIES}
    local interval=${HEALTH_CHECK_INTERVAL}
    
    log_info "对${environment}环境进行健康检查 (端口: ${port})"
    
    for ((i=1; i<=max_retries; i++)); do
        log_info "健康检查尝试 ${i}/${max_retries}..."
        
        if curl -f "http://localhost:${port}/health" &> /dev/null; then
            log_success "${environment}环境健康检查通过"
            return 0
        fi
        
        if [[ $i -lt $max_retries ]]; then
            log_warning "健康检查失败，${interval}秒后重试..."
            sleep $interval
        fi
    done
    
    log_error "${environment}环境健康检查失败"
    return 1
}

# 冒烟测试
smoke_test() {
    local port=$1
    log_info "执行冒烟测试 (端口: ${port})"
    
    # 基本可用性测试
    local tests=(
        "http://localhost:${port}/"
        "http://localhost:${port}/health"
    )
    
    for test_url in "${tests[@]}"; do
        log_info "测试URL: ${test_url}"
        
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$test_url")
        if [[ "$response" != "200" ]]; then
            log_error "冒烟测试失败: ${test_url} 返回 ${response}"
            return 1
        fi
    done
    
    # 性能基线测试
    log_info "执行性能基线测试..."
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "http://localhost:${port}/")
    local threshold=2.0
    
    if (( $(echo "$response_time > $threshold" | bc -l) )); then
        log_warning "响应时间 ${response_time}s 超过阈值 ${threshold}s"
    else
        log_info "响应时间: ${response_time}s"
    fi
    
    log_success "冒烟测试通过"
}

# 流量切换
switch_traffic() {
    log_info "开始流量切换..."
    
    cd "$DEPLOY_DIR"
    
    if $FIRST_DEPLOYMENT; then
        # 首次部署：直接启动主服务
        log_info "首次部署，直接启动主服务..."
        
        # 重新配置绿色环境为主端口
        docker-compose -f docker/docker-compose-green.yml stop
        
        # 修改端口映射
        sed -i 's/8080:80/80:80/g' docker/docker-compose-green.yml
        sed -i 's/assaybio-website-green/assaybio-website/g' docker/docker-compose-green.yml
        
        docker-compose -f docker/docker-compose-green.yml up -d
        
    else
        # 蓝绿切换
        log_info "执行蓝绿流量切换..."
        
        # 更新nginx配置实现流量切换
        cat > docker/nginx-switch.conf << EOF
upstream assaybio_backend {
    server 127.0.0.1:8080;  # 绿色环境
}

server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://assaybio_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 连接超时配置
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
        
        # 健康检查
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
    }
}
EOF
        
        # 应用新的nginx配置
        if docker-compose ps | grep -q nginx-proxy; then
            docker-compose exec nginx-proxy nginx -t
            docker-compose exec nginx-proxy nginx -s reload
        fi
        
        # 验证切换成功
        sleep 5
        if ! health_check "切换后" "80"; then
            log_error "流量切换后健康检查失败"
            return 1
        fi
    fi
    
    log_success "流量切换完成"
}

# 清理旧环境
cleanup_old_environment() {
    if $FIRST_DEPLOYMENT; then
        log_info "首次部署，无需清理旧环境"
        return 0
    fi
    
    log_info "清理旧环境（蓝色环境）..."
    
    # 等待连接排空
    log_info "等待现有连接排空..."
    sleep 30
    
    # 停止旧服务
    if docker-compose ps | grep -q assaybio-website; then
        docker-compose stop assaybio-website || true
        docker-compose rm -f assaybio-website || true
    fi
    
    # 清理未使用的镜像
    docker image prune -f || true
    
    log_success "旧环境清理完成"
}

# 部署验证
post_deployment_verification() {
    log_info "执行部署后验证..."
    
    # 最终健康检查
    if ! health_check "生产" "80"; then
        log_error "部署后验证失败"
        return 1
    fi
    
    # 最终冒烟测试
    if ! smoke_test "80"; then
        log_error "部署后冒烟测试失败"
        return 1
    fi
    
    # 记录部署信息
    local deploy_info=$(cat << EOF
{
    "deployment_id": "$(date +%s)",
    "timestamp": "$(date -Iseconds)",
    "image_tag": "${IMAGE_TAG}",
    "git_commit": "${GIT_COMMIT:-unknown}",
    "deployed_by": "${USER:-system}",
    "environment": "production",
    "strategy": "blue-green"
}
EOF
)
    
    echo "$deploy_info" > "${LOGS_DIR}/last-deployment.json"
    
    log_success "部署后验证完成"
}

# 发送通知
send_notification() {
    local status=$1
    local message=$2
    
    # Slack通知
    if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"AssayBio部署通知\",
                \"attachments\": [{
                    \"color\": \"$([ "$status" = "success" ] && echo "good" || echo "danger")\",
                    \"fields\": [{
                        \"title\": \"状态\",
                        \"value\": \"$status\",
                        \"short\": true
                    }, {
                        \"title\": \"消息\",
                        \"value\": \"$message\",
                        \"short\": false
                    }, {
                        \"title\": \"镜像标签\",
                        \"value\": \"${IMAGE_TAG}\",
                        \"short\": true
                    }, {
                        \"title\": \"时间\",
                        \"value\": \"$(date)\",
                        \"short\": true
                    }]
                }]
            }" "$SLACK_WEBHOOK" || log_warning "Slack通知发送失败"
    fi
    
    # 邮件通知
    if [[ -n "${SMTP_SERVER:-}" ]]; then
        echo -e "Subject: AssayBio部署通知 - $status\n\n$message\n\n镜像标签: ${IMAGE_TAG}\n时间: $(date)" | \
            sendmail "${NOTIFICATION_EMAIL:-admin@assaybio.com}" || log_warning "邮件通知发送失败"
    fi
}

# 主函数
main() {
    log_info "=== AssayBio蓝绿部署开始 ==="
    log_info "镜像标签: ${IMAGE_TAG:-latest}"
    
    # 创建日志目录
    mkdir -p "$LOGS_DIR"
    
    # 执行部署流程
    check_dependencies
    load_config
    pre_deployment_check
    start_green_environment
    
    if health_check "绿色" "8080"; then
        if smoke_test "8080"; then
            switch_traffic
            cleanup_old_environment
            post_deployment_verification
            
            log_success "=== 部署成功完成 ==="
            send_notification "success" "AssayBio网站部署成功完成"
        else
            log_error "冒烟测试失败，停止部署"
            cleanup_on_failure
            exit 1
        fi
    else
        log_error "绿色环境健康检查失败，停止部署"
        cleanup_on_failure
        exit 1
    fi
}

# 显示帮助
show_help() {
    cat << EOF
AssayBio蓝绿部署脚本

用法: $0 [选项]

选项:
    -h, --help              显示此帮助信息
    -t, --tag TAG          指定Docker镜像标签 (默认: latest)
    -c, --check-only       仅执行预部署检查
    -v, --verbose          详细输出
    
环境变量:
    IMAGE_TAG              Docker镜像标签
    DEPLOY_TIMEOUT         部署超时时间（秒）
    HEALTH_CHECK_RETRIES   健康检查重试次数
    SLACK_WEBHOOK          Slack通知webhook URL
    
示例:
    $0 --tag v1.2.0
    IMAGE_TAG=v1.2.0 $0
    $0 --check-only

EOF
}

# 参数解析
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--tag)
            export IMAGE_TAG="$2"
            shift 2
            ;;
        -c|--check-only)
            CHECK_ONLY=true
            shift
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 执行主函数
if [[ "${CHECK_ONLY:-false}" == "true" ]]; then
    log_info "执行预部署检查..."
    check_dependencies
    load_config
    pre_deployment_check
    log_success "预部署检查完成"
else
    main
fi