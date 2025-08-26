#!/bin/bash
# AssayBio 企业级部署脚本
# 支持蓝绿部署和零停机更新

set -euo pipefail

# ====================
# 配置和常量
# ====================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# 环境变量
ENVIRONMENT=${ENVIRONMENT:-production}
IMAGE_TAG=${IMAGE_TAG:-latest}
BLUE_GREEN_ENABLED=${BLUE_GREEN_ENABLED:-true}
HEALTH_CHECK_URL=${HEALTH_CHECK_URL:-http://localhost/health}
BACKUP_ENABLED=${BACKUP_ENABLED:-true}

# 容器配置
BLUE_CONTAINER="assaybio-blue"
GREEN_CONTAINER="assaybio-green"
BACKUP_CONTAINER="assaybio-backup"
NETWORK_NAME="assaybio-network"

# 端口配置
BLUE_PORT=8080
GREEN_PORT=8081
BACKUP_PORT=8082

# ====================
# 工具函数
# ====================

# 检查必需的工具
check_requirements() {
    local tools=("docker" "curl" "jq")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error "$tool is not installed or not in PATH"
        fi
    done
    
    info "All required tools are available"
}

# 检查Docker守护进程
check_docker() {
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
    fi
    
    info "Docker daemon is running"
}

# 创建网络
create_network() {
    if ! docker network inspect "$NETWORK_NAME" &> /dev/null; then
        log "Creating Docker network: $NETWORK_NAME"
        docker network create \
            --driver bridge \
            --subnet=172.20.0.0/16 \
            "$NETWORK_NAME"
    else
        info "Docker network $NETWORK_NAME already exists"
    fi
}

# 拉取最新镜像
pull_image() {
    local image="$1"
    log "Pulling Docker image: $image"
    
    if ! docker pull "$image"; then
        error "Failed to pull image: $image"
    fi
    
    info "Successfully pulled image: $image"
}

# 获取当前活跃环境
get_active_environment() {
    if docker ps --format "table {{.Names}}" | grep -q "$GREEN_CONTAINER"; then
        if docker ps --format "table {{.Names}}" | grep -q "$BLUE_CONTAINER"; then
            # 两个都在运行，检查哪个在接收流量
            if curl -sf "http://localhost:$GREEN_PORT/health" &> /dev/null; then
                echo "green"
            else
                echo "blue"
            fi
        else
            echo "green"
        fi
    elif docker ps --format "table {{.Names}}" | grep -q "$BLUE_CONTAINER"; then
        echo "blue"
    else
        echo "none"
    fi
}

# 获取目标环境
get_target_environment() {
    local active="$1"
    case "$active" in
        "blue")
            echo "green"
            ;;
        "green")
            echo "blue"
            ;;
        "none")
            echo "blue"  # 首次部署默认蓝环境
            ;;
        *)
            error "Unknown active environment: $active"
            ;;
    esac
}

# 健康检查
health_check() {
    local url="$1"
    local timeout="${2:-30}"
    local max_attempts="${3:-10}"
    local attempt=1
    
    info "Performing health check: $url"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url" &> /dev/null; then
            log "Health check passed on attempt $attempt"
            return 0
        fi
        
        warn "Health check failed (attempt $attempt/$max_attempts), retrying in 5 seconds..."
        sleep 5
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# 启动容器
start_container() {
    local env="$1"
    local port="$2"
    local container_name="$3"
    local image="$4"
    
    log "Starting $env environment container: $container_name"
    
    # 停止现有容器
    if docker ps -a --format "table {{.Names}}" | grep -q "$container_name"; then
        log "Stopping existing container: $container_name"
        docker stop "$container_name" || true
        docker rm "$container_name" || true
    fi
    
    # 启动新容器
    docker run -d \
        --name "$container_name" \
        --network "$NETWORK_NAME" \
        -p "$port:80" \
        -e "NODE_ENV=$ENVIRONMENT" \
        -e "ENVIRONMENT=$env" \
        -v "/var/log/nginx:/var/log/nginx" \
        --restart unless-stopped \
        --health-cmd='/usr/local/bin/healthcheck.sh' \
        --health-interval=30s \
        --health-timeout=10s \
        --health-retries=3 \
        "$image"
    
    # 等待容器启动
    log "Waiting for container to start..."
    sleep 10
    
    # 等待容器健康
    local attempts=0
    while [ $attempts -lt 30 ]; do
        if [ "$(docker inspect --format='{{.State.Health.Status}}' "$container_name")" = "healthy" ]; then
            log "Container $container_name is healthy"
            return 0
        fi
        
        info "Waiting for container health check... (attempt $((attempts + 1))/30)"
        sleep 5
        ((attempts++))
    done
    
    error "Container $container_name failed to become healthy"
}

# 更新负载均衡器配置
update_load_balancer() {
    local target_env="$1"
    local target_port="$2"
    
    log "Updating load balancer to point to $target_env environment"
    
    # 备份当前配置
    if [ -f "/etc/nginx/sites-available/assaybio" ]; then
        cp "/etc/nginx/sites-available/assaybio" "/etc/nginx/sites-available/assaybio.backup.$(date +%Y%m%d%H%M%S)"
    fi
    
    # 更新upstream配置
    local nginx_config="$DEPLOYMENT_DIR/nginx/nginx-blue-green.conf"
    sed "s/ACTIVE_ENV/$target_env/g" "$nginx_config" > "/etc/nginx/sites-available/assaybio.tmp"
    
    # 测试配置
    if nginx -t -c "/etc/nginx/sites-available/assaybio.tmp" 2>/dev/null; then
        mv "/etc/nginx/sites-available/assaybio.tmp" "/etc/nginx/sites-available/assaybio"
        systemctl reload nginx
        log "Load balancer updated successfully"
    else
        rm -f "/etc/nginx/sites-available/assaybio.tmp"
        error "Nginx configuration test failed"
    fi
}

# 创建备份
create_backup() {
    if [ "$BACKUP_ENABLED" != "true" ]; then
        info "Backup disabled, skipping..."
        return 0
    fi
    
    log "Creating backup before deployment"
    
    local active_env
    active_env=$(get_active_environment)
    
    if [ "$active_env" != "none" ]; then
        local active_container
        if [ "$active_env" = "blue" ]; then
            active_container="$BLUE_CONTAINER"
        else
            active_container="$GREEN_CONTAINER"
        fi
        
        # 停止备份容器（如果存在）
        if docker ps -a --format "table {{.Names}}" | grep -q "$BACKUP_CONTAINER"; then
            docker stop "$BACKUP_CONTAINER" || true
            docker rm "$BACKUP_CONTAINER" || true
        fi
        
        # 从活跃容器创建镜像备份
        local backup_image="assaybio:backup-$(date +%Y%m%d%H%M%S)"
        docker commit "$active_container" "$backup_image"
        
        # 启动备份容器
        docker run -d \
            --name "$BACKUP_CONTAINER" \
            --network "$NETWORK_NAME" \
            -p "$BACKUP_PORT:80" \
            -e "NODE_ENV=$ENVIRONMENT" \
            -e "ENVIRONMENT=backup" \
            "$backup_image"
        
        log "Backup container created successfully"
    else
        warn "No active environment found, skipping backup creation"
    fi
}

# 清理旧资源
cleanup() {
    local keep_env="$1"
    
    log "Cleaning up old resources (keeping $keep_env environment)"
    
    # 清理旧容器
    if [ "$keep_env" != "blue" ]; then
        docker stop "$BLUE_CONTAINER" 2>/dev/null || true
        docker rm "$BLUE_CONTAINER" 2>/dev/null || true
    fi
    
    if [ "$keep_env" != "green" ]; then
        docker stop "$GREEN_CONTAINER" 2>/dev/null || true
        docker rm "$GREEN_CONTAINER" 2>/dev/null || true
    fi
    
    # 清理未使用的镜像
    docker image prune -f
    
    # 清理旧的备份镜像（保留最近5个）
    docker images --format "table {{.Repository}}:{{.Tag}}" | \
        grep "assaybio:backup-" | \
        tail -n +6 | \
        xargs -r docker rmi
    
    log "Cleanup completed"
}

# 回滚函数
rollback() {
    error_msg="$1"
    warn "Deployment failed: $error_msg"
    warn "Initiating rollback..."
    
    # 检查备份容器是否可用
    if docker ps --format "table {{.Names}}" | grep -q "$BACKUP_CONTAINER"; then
        log "Rolling back using backup container"
        
        # 更新负载均衡器指向备份容器
        sed "s/server localhost:808[01]/server localhost:$BACKUP_PORT/" \
            /etc/nginx/sites-available/assaybio > /etc/nginx/sites-available/assaybio.rollback
        mv /etc/nginx/sites-available/assaybio.rollback /etc/nginx/sites-available/assaybio
        
        nginx -t && systemctl reload nginx
        
        log "Rollback completed using backup container"
    else
        error "No backup container available for rollback"
    fi
}

# ====================
# 蓝绿部署流程
# ====================
blue_green_deploy() {
    local image="$1"
    
    log "Starting blue-green deployment process"
    
    # 获取当前状态
    local active_env
    active_env=$(get_active_environment)
    local target_env
    target_env=$(get_target_environment "$active_env")
    
    info "Active environment: $active_env"
    info "Target environment: $target_env"
    
    # 设置目标容器和端口
    local target_container target_port
    if [ "$target_env" = "blue" ]; then
        target_container="$BLUE_CONTAINER"
        target_port="$BLUE_PORT"
    else
        target_container="$GREEN_CONTAINER"
        target_port="$GREEN_PORT"
    fi
    
    # 创建备份（错误处理）
    if ! create_backup; then
        rollback "Failed to create backup"
        return 1
    fi
    
    # 启动目标环境（错误处理）
    if ! start_container "$target_env" "$target_port" "$target_container" "$image"; then
        rollback "Failed to start target container"
        return 1
    fi
    
    # 健康检查（错误处理）
    if ! health_check "http://localhost:$target_port/health" 30 10; then
        rollback "Health check failed for target environment"
        return 1
    fi
    
    # 预热目标环境
    log "Warming up target environment..."
    for i in {1..5}; do
        curl -sf "http://localhost:$target_port/" > /dev/null || true
        sleep 2
    done
    
    # 更新负载均衡器（错误处理）
    if ! update_load_balancer "$target_env" "$target_port"; then
        rollback "Failed to update load balancer"
        return 1
    fi
    
    # 最终健康检查（错误处理）
    sleep 10
    if ! health_check "$HEALTH_CHECK_URL" 30 5; then
        rollback "Final health check failed"
        return 1
    fi
    
    # 清理旧环境（延迟清理）
    log "Waiting 60 seconds before cleanup to ensure stability..."
    sleep 60
    cleanup "$target_env"
    
    log "Blue-green deployment completed successfully!"
    info "New active environment: $target_env"
    info "Application is now running on: $HEALTH_CHECK_URL"
}

# ====================
# 传统部署流程
# ====================
traditional_deploy() {
    local image="$1"
    
    log "Starting traditional deployment process"
    
    create_backup
    
    # 停止现有服务
    docker stop "$BLUE_CONTAINER" "$GREEN_CONTAINER" 2>/dev/null || true
    docker rm "$BLUE_CONTAINER" "$GREEN_CONTAINER" 2>/dev/null || true
    
    # 启动新服务
    start_container "production" "$BLUE_PORT" "$BLUE_CONTAINER" "$image"
    
    # 健康检查
    health_check "http://localhost:$BLUE_PORT/health"
    
    # 更新负载均衡器
    update_load_balancer "blue" "$BLUE_PORT"
    
    # 最终检查
    health_check "$HEALTH_CHECK_URL"
    
    log "Traditional deployment completed successfully!"
}

# ====================
# 主函数
# ====================
main() {
    log "Starting AssayBio deployment script"
    info "Environment: $ENVIRONMENT"
    info "Image: $IMAGE_TAG"
    info "Blue-Green Deployment: $BLUE_GREEN_ENABLED"
    
    # 前置检查
    check_requirements
    check_docker
    create_network
    
    # 拉取镜像
    pull_image "$IMAGE_TAG"
    
    # 选择部署策略
    if [ "$BLUE_GREEN_ENABLED" = "true" ]; then
        blue_green_deploy "$IMAGE_TAG"
    else
        traditional_deploy "$IMAGE_TAG"
    fi
    
    log "Deployment process completed successfully!"
    
    # 显示部署信息
    echo ""
    echo "=================================="
    echo "Deployment Summary"
    echo "=================================="
    echo "Environment: $ENVIRONMENT"
    echo "Image: $IMAGE_TAG"
    echo "Active Environment: $(get_active_environment)"
    echo "Health Check: $HEALTH_CHECK_URL"
    echo "Deployment Time: $(date)"
    echo "=================================="
}

# 错误处理
trap 'error "Script failed on line $LINENO"' ERR

# 运行主函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi