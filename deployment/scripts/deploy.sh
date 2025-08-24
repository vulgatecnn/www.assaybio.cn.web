#!/bin/bash

# AssayBio网站 - 自动化部署脚本
# 支持零停机部署和回滚

set -e

# 配置变量
PROJECT_NAME="assaybio-website"
PROJECT_DIR="/opt/assaybio-website"
BACKUP_DIR="/opt/backups/assaybio"
REGISTRY="ghcr.io"
IMAGE_NAME="assaybio/assaybio-website"
HEALTH_CHECK_URL="http://localhost/health"
DEPLOYMENT_TIMEOUT=300

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 显示使用说明
usage() {
    cat << EOF
使用说明:
    $0 deploy [version]     - 部署指定版本（默认: latest）
    $0 rollback [backup]    - 回滚到指定备份
    $0 status               - 检查服务状态
    $0 logs [service]       - 查看服务日志
    $0 backup               - 创建备份
    $0 clean                - 清理旧镜像和备份

示例:
    $0 deploy v1.2.0        - 部署v1.2.0版本
    $0 rollback 20240124    - 回滚到20240124备份
    $0 logs nginx           - 查看nginx日志
EOF
}

# 检查依赖
check_dependencies() {
    local deps=("docker" "docker-compose" "curl" "jq")
    
    for dep in "${deps[@]}"; do
        if ! command -v $dep &> /dev/null; then
            error "依赖 $dep 未安装"
        fi
    done
}

# 创建备份
create_backup() {
    local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "创建备份: $backup_name"
    
    mkdir -p "$backup_path"
    
    # 备份Docker Compose配置
    cp -r "$PROJECT_DIR/docker-compose.yml" "$backup_path/"
    cp -r "$PROJECT_DIR/docker/" "$backup_path/" 2>/dev/null || true
    
    # 备份环境配置
    cp "$PROJECT_DIR/.env" "$backup_path/" 2>/dev/null || true
    
    # 导出当前运行的容器镜像信息
    docker-compose -f "$PROJECT_DIR/docker-compose.yml" config --services | while read service; do
        image=$(docker-compose -f "$PROJECT_DIR/docker-compose.yml" ps -q $service | xargs docker inspect --format='{{.Image}}' 2>/dev/null || echo "")
        if [ ! -z "$image" ]; then
            echo "$service:$image" >> "$backup_path/images.txt"
        fi
    done
    
    # 压缩备份
    cd "$BACKUP_DIR"
    tar -czf "$backup_name.tar.gz" "$backup_name"
    rm -rf "$backup_name"
    
    log "备份完成: $backup_path.tar.gz"
    echo "$backup_name"
}

# 健康检查
health_check() {
    local max_attempts=30
    local attempt=1
    
    log "开始健康检查..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
            log "健康检查通过"
            return 0
        fi
        
        info "健康检查失败，重试 ($attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    error "健康检查失败，服务可能未正常启动"
}

# 部署函数
deploy() {
    local version="${1:-latest}"
    local image_tag="$REGISTRY/$IMAGE_NAME:$version"
    
    log "开始部署 AssayBio 网站 - 版本: $version"
    
    # 检查依赖
    check_dependencies
    
    # 创建项目目录
    mkdir -p "$PROJECT_DIR"
    mkdir -p "$BACKUP_DIR"
    
    # 切换到项目目录
    cd "$PROJECT_DIR"
    
    # 创建备份
    local backup_name=$(create_backup)
    
    # 拉取新镜像
    log "拉取镜像: $image_tag"
    if ! docker pull "$image_tag"; then
        error "镜像拉取失败: $image_tag"
    fi
    
    # 更新Docker Compose文件中的镜像版本
    if [ -f "docker-compose.yml" ]; then
        sed -i "s|image: .*assaybio-website.*|image: $image_tag|g" docker-compose.yml
    fi
    
    # 开始部署
    log "开始零停机部署..."
    
    # 启动新服务（蓝绿部署）
    docker-compose up -d --no-deps assaybio-web
    
    # 等待服务启动
    sleep 30
    
    # 健康检查
    if ! health_check; then
        warn "健康检查失败，开始回滚..."
        rollback_deployment "$backup_name"
        return 1
    fi
    
    # 重启代理服务以应用新配置
    docker-compose restart nginx-proxy 2>/dev/null || true
    
    # 清理旧镜像
    log "清理旧镜像..."
    docker image prune -f
    
    log "部署完成！版本: $version"
    
    # 显示服务状态
    show_status
}

# 回滚部署
rollback_deployment() {
    local backup_name="$1"
    
    if [ -z "$backup_name" ]; then
        error "请指定回滚的备份名称"
    fi
    
    local backup_file="$BACKUP_DIR/${backup_name}.tar.gz"
    
    if [ ! -f "$backup_file" ]; then
        error "备份文件不存在: $backup_file"
    fi
    
    log "开始回滚到备份: $backup_name"
    
    # 解压备份
    cd "$BACKUP_DIR"
    tar -xzf "$backup_file"
    
    # 恢复配置
    cp -r "$backup_name/"* "$PROJECT_DIR/"
    
    # 重新加载镜像
    if [ -f "$BACKUP_DIR/$backup_name/images.txt" ]; then
        while IFS=':' read -r service image; do
            if [ ! -z "$image" ]; then
                log "恢复镜像: $service -> $image"
                docker tag "$image" "$REGISTRY/$IMAGE_NAME:rollback" || true
            fi
        done < "$BACKUP_DIR/$backup_name/images.txt"
    fi
    
    # 重启服务
    cd "$PROJECT_DIR"
    docker-compose down
    docker-compose up -d
    
    # 健康检查
    health_check
    
    # 清理临时文件
    rm -rf "$BACKUP_DIR/$backup_name"
    
    log "回滚完成"
}

# 显示服务状态
show_status() {
    log "服务状态:"
    
    cd "$PROJECT_DIR"
    docker-compose ps
    
    echo -e "\n${BLUE}资源使用情况:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    
    echo -e "\n${BLUE}磁盘使用情况:${NC}"
    df -h /opt
}

# 查看日志
show_logs() {
    local service="${1:-}"
    
    cd "$PROJECT_DIR"
    
    if [ -z "$service" ]; then
        docker-compose logs --tail=100 -f
    else
        docker-compose logs --tail=100 -f "$service"
    fi
}

# 清理资源
cleanup() {
    log "开始清理资源..."
    
    # 清理Docker资源
    docker system prune -f
    docker volume prune -f
    docker image prune -a -f
    
    # 清理旧备份（保留最近10个）
    cd "$BACKUP_DIR"
    ls -t *.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    
    log "清理完成"
}

# 主函数
main() {
    local command="$1"
    
    case "$command" in
        "deploy")
            deploy "$2"
            ;;
        "rollback")
            rollback_deployment "$2"
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$2"
            ;;
        "backup")
            create_backup
            ;;
        "clean")
            cleanup
            ;;
        *)
            usage
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"