#!/bin/bash

# 上海安净生物技术有限公司 - 自动化CI/CD部署脚本
# 完整的自动化部署流程，包括构建、测试、部署、验证

set -e

# 配置变量
SERVER="192.3.11.106"
PORT="6500"
DEPLOY_PATH="/var/www/html"
BACKUP_PATH="/var/backups"
LOCAL_BUILD_PATH="./build"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PACKAGE_NAME="website-${TIMESTAMP}.tar.gz"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# 错误处理
handle_error() {
    error "部署过程中发生错误，开始回滚..."
    rollback
    exit 1
}

trap handle_error ERR

# 回滚函数
rollback() {
    log "执行自动回滚..."
    ssh root@$SERVER "
        latest_backup=\$(ls -t $BACKUP_PATH/website-backup-*.tar.gz 2>/dev/null | head -1)
        if [ -n \"\$latest_backup\" ]; then
            echo \"回滚到: \$latest_backup\"
            rm -rf $DEPLOY_PATH/*
            tar -xzf \"\$latest_backup\" -C $DEPLOY_PATH/
            chown -R www-data:www-data $DEPLOY_PATH/ 2>/dev/null || chown -R apache:apache $DEPLOY_PATH/ 2>/dev/null
            systemctl reload nginx
            echo '✅ 回滚完成'
        else
            echo '❌ 未找到备份文件'
        fi
    "
}

# 1. 预检查
pre_check() {
    log "🔍 执行部署前检查..."
    
    # 检查SSH连接
    if ! ssh -o ConnectTimeout=10 root@$SERVER "echo 'SSH连接正常'" >/dev/null 2>&1; then
        error "无法连接到服务器 $SERVER"
        exit 1
    fi
    success "SSH连接检查通过"
    
    # 检查服务器磁盘空间
    disk_usage=$(ssh root@$SERVER "df $DEPLOY_PATH | awk 'NR==2 {print \$5}' | sed 's/%//'")
    if [ "$disk_usage" -gt 80 ]; then
        warning "磁盘使用率较高: ${disk_usage}%"
    fi
    success "磁盘空间检查通过: ${disk_usage}%"
    
    # 检查Nginx服务
    if ! ssh root@$SERVER "systemctl is-active --quiet nginx"; then
        error "Nginx服务未运行"
        exit 1
    fi
    success "Nginx服务运行正常"
}

# 2. 构建应用
build_app() {
    log "🔨 开始构建应用..."
    
    # 清理之前的构建
    rm -rf $LOCAL_BUILD_PATH
    mkdir -p $LOCAL_BUILD_PATH
    
    # 复制需要部署的文件
    log "📁 准备部署文件..."
    
    # 复制主要文件
    cp index.html $LOCAL_BUILD_PATH/ 2>/dev/null || warning "index.html不存在"
    cp temp.json $LOCAL_BUILD_PATH/ 2>/dev/null || warning "temp.json不存在"
    
    # 复制目录
    for dir in css js images icons; do
        if [ -d "$dir" ]; then
            cp -r "$dir" $LOCAL_BUILD_PATH/
            success "复制目录: $dir"
        else
            warning "目录不存在: $dir"
        fi
    done
    
    # 复制apps/website/dist内容
    if [ -d "apps/website/dist" ]; then
        cp -r apps/website/dist/* $LOCAL_BUILD_PATH/ 2>/dev/null || true
        success "复制构建文件: apps/website/dist"
    else
        warning "构建目录不存在: apps/website/dist"
    fi
    
    # 创建部署包
    log "📦 创建部署包..."
    cd $LOCAL_BUILD_PATH
    tar -czf "../$PACKAGE_NAME" .
    cd ..
    
    success "部署包创建完成: $PACKAGE_NAME"
}

# 3. 运行测试
run_tests() {
    log "🧪 执行自动化测试..."
    
    # 基本文件完整性检查
    if [ ! -f "$PACKAGE_NAME" ]; then
        error "部署包不存在"
        exit 1
    fi
    
    # 检查包内容
    if ! tar -tzf "$PACKAGE_NAME" | grep -q "index.html"; then
        error "部署包中缺少index.html"
        exit 1
    fi
    
    success "测试检查通过"
}

# 4. 部署到服务器
deploy_to_server() {
    log "🚀 开始部署到服务器..."
    
    # 创建服务器备份
    log "💾 创建服务器备份..."
    ssh root@$SERVER "
        mkdir -p $BACKUP_PATH
        if [ -d $DEPLOY_PATH ]; then
            tar -czf $BACKUP_PATH/website-backup-$TIMESTAMP.tar.gz -C $DEPLOY_PATH .
            echo '服务器备份完成'
        fi
    "
    
    # 上传部署包
    log "📤 上传部署包..."
    scp "$PACKAGE_NAME" root@$SERVER:/tmp/
    
    # 在服务器上执行部署
    log "📂 解压并部署..."
    ssh root@$SERVER "
        # 清空现有内容
        rm -rf $DEPLOY_PATH/*
        
        # 解压新版本
        cd /tmp && tar -xzf $PACKAGE_NAME -C $DEPLOY_PATH/
        
        # 设置权限
        chown -R www-data:www-data $DEPLOY_PATH/ 2>/dev/null || chown -R apache:apache $DEPLOY_PATH/ 2>/dev/null || true
        chmod -R 755 $DEPLOY_PATH/
        find $DEPLOY_PATH -type f -exec chmod 644 {} \;
        
        # 重新加载Nginx
        systemctl reload nginx
        
        # 清理临时文件
        rm -f /tmp/$PACKAGE_NAME
        
        echo '部署完成'
    "
    
    success "服务器部署完成"
}

# 5. 健康检查
health_check() {
    log "🔍 执行健康检查..."
    
    # 等待服务启动
    sleep 5
    
    # HTTP状态检查
    log "检查HTTP响应..."
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER:$PORT/" || echo "000")
        
        if [[ "$response" =~ ^(200|308)$ ]]; then
            success "HTTP检查通过 - 状态码: $response"
            break
        else
            warning "HTTP检查失败 - 状态码: $response (尝试 $attempt/$max_attempts)"
            if [ $attempt -eq $max_attempts ]; then
                error "HTTP健康检查最终失败"
                return 1
            fi
            sleep 10
            ((attempt++))
        fi
    done
    
    # 内容完整性检查
    log "检查网站内容..."
    if curl -s "http://$SERVER:$PORT/" | grep -q "上海安净生物技术有限公司"; then
        success "内容完整性检查通过"
    else
        error "内容完整性检查失败"
        return 1
    fi
    
    # 服务状态检查
    log "检查服务状态..."
    ssh root@$SERVER "
        if systemctl is-active --quiet nginx; then
            echo '✅ Nginx服务正常'
        else
            echo '❌ Nginx服务异常'
            exit 1
        fi
    "
    
    success "所有健康检查通过"
}

# 6. 清理
cleanup() {
    log "🧹 清理临时文件..."
    rm -rf $LOCAL_BUILD_PATH
    rm -f "$PACKAGE_NAME"
    
    # 清理服务器上的旧备份（保留最近7个）
    ssh root@$SERVER "
        cd $BACKUP_PATH
        ls -t website-backup-*.tar.gz 2>/dev/null | tail -n +8 | xargs rm -f
        echo '旧备份清理完成'
    " || true
    
    success "清理完成"
}

# 主部署流程
main() {
    log "🚀 开始自动化CI/CD部署流程..."
    echo "========================================="
    echo "  上海安净生物技术有限公司"
    echo "  网站自动化部署系统"
    echo "  目标服务器: $SERVER:$PORT"
    echo "  部署时间: $(date)"
    echo "========================================="
    echo
    
    # 执行部署流程
    pre_check
    build_app
    run_tests
    deploy_to_server
    health_check
    cleanup
    
    echo
    echo "========================================="
    success "🎉 部署成功完成！"
    echo "🌐 网站访问地址: http://$SERVER:$PORT/"
    echo "📊 部署时间: $TIMESTAMP"
    echo "📦 部署包: $PACKAGE_NAME"
    echo "========================================="
}

# 如果直接执行此脚本，运行主函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi