#!/bin/bash

# AssayBio自动部署到192.3.11.106服务器脚本
# 使用方法: ./auto-deploy-to-server.sh [version]

set -e

# 配置变量 - 请根据实际情况修改
SERVER_IP="192.3.11.106"
SERVER_USER="root"  # 请修改为实际用户名
SERVER_PORT="22"
REMOTE_PROJECT_PATH="/opt/assaybio-website"
LOCAL_PROJECT_PATH="$(dirname $(dirname $(realpath $0)))"

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

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# 检查SSH连接
check_ssh_connection() {
    log "检查SSH连接到 $SERVER_USER@$SERVER_IP..."
    
    if ssh -o ConnectTimeout=10 -p $SERVER_PORT $SERVER_USER@$SERVER_IP "echo 'SSH连接成功'" &>/dev/null; then
        log "SSH连接成功"
    else
        error "SSH连接失败，请检查：
1. 服务器IP: $SERVER_IP
2. 用户名: $SERVER_USER  
3. SSH密钥配置
4. 网络连接"
    fi
}

# 构建项目
build_project() {
    log "开始构建项目..."
    
    cd "$LOCAL_PROJECT_PATH"
    
    # 尝试多种构建方式
    if npm run build:prod 2>/dev/null; then
        log "使用build:prod构建成功"
    elif npm run build 2>/dev/null; then
        log "使用build构建成功"  
    elif cd apps/website && npm run build; then
        log "切换到website目录构建成功"
        cd "$LOCAL_PROJECT_PATH"
    else
        error "构建失败，请检查构建配置"
    fi
}

# 打包部署文件
package_for_deployment() {
    log "打包部署文件..."
    
    local deploy_package="/tmp/assaybio-deploy-$(date +%Y%m%d_%H%M%S).tar.gz"
    
    # 创建临时目录
    local temp_dir="/tmp/assaybio-deploy-temp"
    rm -rf "$temp_dir"
    mkdir -p "$temp_dir"
    
    # 复制必要文件
    cp -r "$LOCAL_PROJECT_PATH/apps/website/dist" "$temp_dir/" 2>/dev/null || \
    cp -r "$LOCAL_PROJECT_PATH/dist" "$temp_dir/" || \
    error "找不到构建产物dist目录"
    
    cp -r "$LOCAL_PROJECT_PATH/deployment/docker" "$temp_dir/" 2>/dev/null || true
    cp "$LOCAL_PROJECT_PATH/deployment/scripts/deploy.sh" "$temp_dir/" 2>/dev/null || true
    
    # 打包
    cd "/tmp"
    tar -czf "$deploy_package" -C "$(dirname $temp_dir)" "$(basename $temp_dir)"
    rm -rf "$temp_dir"
    
    log "部署包创建完成: $deploy_package"
    echo "$deploy_package"
}

# 部署到服务器
deploy_to_server() {
    local version="${1:-latest}"
    local deploy_package="$2"
    
    log "开始部署到服务器 $SERVER_IP..."
    
    # 上传部署包
    log "上传部署包..."
    scp -P $SERVER_PORT "$deploy_package" "$SERVER_USER@$SERVER_IP:/tmp/"
    
    local package_name=$(basename "$deploy_package")
    
    # 远程执行部署
    ssh -p $SERVER_PORT "$SERVER_USER@$SERVER_IP" << EOF
set -e

log() {
    echo -e "\033[0;32m[\$(date +'%Y-%m-%d %H:%M:%S')] \$1\033[0m"
}

log "开始远程部署..."

# 创建项目目录
mkdir -p "$REMOTE_PROJECT_PATH"
mkdir -p "/opt/backups/assaybio"

# 备份现有版本
if [ -d "$REMOTE_PROJECT_PATH/current" ]; then
    log "备份现有版本..."
    mv "$REMOTE_PROJECT_PATH/current" "$REMOTE_PROJECT_PATH/backup-\$(date +%Y%m%d_%H%M%S)"
fi

# 解压新版本
log "解压部署包..."
cd "$REMOTE_PROJECT_PATH"
tar -xzf "/tmp/$package_name"
mv "assaybio-deploy-temp" "current"

# 设置权限
chmod +x "$REMOTE_PROJECT_PATH/current/deploy.sh" 2>/dev/null || true

# 检查是否使用Docker部署
if [ -d "$REMOTE_PROJECT_PATH/current/docker" ]; then
    log "使用Docker部署..."
    
    cd "$REMOTE_PROJECT_PATH/current"
    
    # 创建nginx配置
    if [ ! -f "docker-compose.yml" ]; then
        cat > docker-compose.yml << 'DOCKERCOMPOSE'
version: '3.8'

services:
  assaybio-web:
    image: nginx:alpine
    container_name: assaybio-website
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./dist:/usr/share/nginx/html:ro
      - ./docker/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/default.conf:/etc/nginx/conf.d/default.conf:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
DOCKERCOMPOSE
    fi
    
    # 启动服务
    docker-compose down 2>/dev/null || true
    docker-compose up -d
    
    # 健康检查
    sleep 30
    if curl -f -s http://localhost/ > /dev/null; then
        log "Docker部署成功，服务运行正常"
    else
        log "警告：健康检查失败，请检查服务状态"
    fi
else
    log "使用静态文件部署..."
    
    # 安装nginx（如果没有）
    if ! command -v nginx &> /dev/null; then
        log "安装nginx..."
        if command -v apt-get &> /dev/null; then
            apt-get update && apt-get install -y nginx
        elif command -v yum &> /dev/null; then
            yum install -y nginx
        else
            log "请手动安装nginx"
        fi
    fi
    
    # 配置nginx
    if [ -d "$REMOTE_PROJECT_PATH/current/dist" ]; then
        cp -r "$REMOTE_PROJECT_PATH/current/dist"/* /var/www/html/ 2>/dev/null || \
        cp -r "$REMOTE_PROJECT_PATH/current/dist"/* /usr/share/nginx/html/
        
        systemctl enable nginx
        systemctl restart nginx
        
        log "静态文件部署成功"
    else
        log "错误：找不到dist目录"
        exit 1
    fi
fi

# 清理
rm -f "/tmp/$package_name"

log "部署完成！"
log "访问地址: http://$SERVER_IP"

EOF
    
    # 清理本地临时文件
    rm -f "$deploy_package"
    
    log "自动部署完成！"
    info "访问地址: http://$SERVER_IP"
}

# 主函数
main() {
    local version="${1:-latest}"
    
    log "开始自动部署 AssayBio 网站到 $SERVER_IP"
    
    # 检查SSH连接
    check_ssh_connection
    
    # 构建项目
    build_project
    
    # 打包部署文件
    local deploy_package=$(package_for_deployment)
    
    # 部署到服务器
    deploy_to_server "$version" "$deploy_package"
    
    log "所有步骤完成！"
}

# 显示使用说明
usage() {
    cat << EOF
AssayBio自动部署脚本

使用方法:
    $0 [version]           - 部署指定版本（默认: latest）
    
配置要求:
    1. 确保SSH密钥配置正确
    2. 目标服务器安装了Docker和docker-compose
    3. 修改脚本中的服务器配置信息

示例:
    $0                     - 部署latest版本
    $0 v1.2.0              - 部署v1.2.0版本

服务器信息:
    IP: $SERVER_IP
    用户: $SERVER_USER
    端口: $SERVER_PORT
EOF
}

# 处理命令行参数
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

# 执行主函数
main "$@"