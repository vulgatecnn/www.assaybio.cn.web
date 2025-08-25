#!/bin/bash

# AssayBio 自动部署脚本
# 放置位置：服务器 /var/git/assaybio.git/hooks/post-receive

set -e

# 配置变量
WORK_TREE="/var/www/html/assaybio"
GIT_DIR="/var/git/assaybio.git"
BACKUP_DIR="/var/www/backups/assaybio"

echo "🚀 开始自动部署 AssayBio..."

# 1. 创建备份
echo "💾 创建备份..."
BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
if [ -d "$WORK_TREE" ]; then
    sudo mkdir -p "$BACKUP_DIR"
    sudo cp -r "$WORK_TREE" "$BACKUP_DIR/$BACKUP_NAME"
    echo "✅ 备份创建完成: $BACKUP_DIR/$BACKUP_NAME"
fi

# 2. 检出代码到工作目录
echo "📥 检出代码..."
sudo mkdir -p "$WORK_TREE"
cd "$WORK_TREE"
sudo git --git-dir="$GIT_DIR" --work-tree="$WORK_TREE" checkout -f

# 3. 设置权限
echo "🔐 设置权限..."
sudo chown -R www-data:www-data "$WORK_TREE"
sudo chmod -R 755 "$WORK_TREE"

# 4. 安装依赖和构建（如果有package.json）
if [ -f "$WORK_TREE/package.json" ]; then
    echo "📦 安装依赖..."
    cd "$WORK_TREE"
    
    # 检查Node.js版本
    if command -v node >/dev/null 2>&1; then
        echo "Node.js版本: $(node --version)"
        echo "NPM版本: $(npm --version)"
        
        # 安装依赖
        sudo -u www-data npm ci --only=production
        
        # 构建项目
        echo "🔨 构建项目..."
        sudo -u www-data npm run build
        
        # 移动构建文件到根目录（如果dist目录存在）
        if [ -d "$WORK_TREE/dist" ]; then
            echo "📁 移动构建文件..."
            sudo -u www-data cp -r "$WORK_TREE/dist/"* "$WORK_TREE/"
        fi
        
        echo "✅ 构建完成"
    else
        echo "⚠️  Node.js未安装，跳过构建步骤"
    fi
fi

# 5. 处理静态资源（爬虫下载的内容）
if [ -d "$WORK_TREE/web" ]; then
    echo "🕷️  处理爬虫内容..."
    # 如果有最新的爬虫结果，复制到网站根目录
    LATEST_CRAWL=$(find "$WORK_TREE/web" -name "assaybio*" -type d | head -1)
    if [ -d "$LATEST_CRAWL" ]; then
        echo "📋 复制爬虫内容: $LATEST_CRAWL"
        sudo -u www-data cp -r "$LATEST_CRAWL/"* "$WORK_TREE/"
    fi
fi

# 6. 测试Nginx配置
echo "🔍 测试Nginx配置..."
if sudo nginx -t >/dev/null 2>&1; then
    echo "✅ Nginx配置正确"
    
    # 7. 重载Nginx
    echo "🔄 重载Nginx..."
    sudo nginx -s reload
    echo "✅ Nginx重载完成"
else
    echo "❌ Nginx配置错误，请检查配置文件"
    exit 1
fi

# 8. 清理旧备份（保留最近5个）
echo "🧹 清理旧备份..."
if [ -d "$BACKUP_DIR" ]; then
    cd "$BACKUP_DIR"
    sudo ls -t | tail -n +6 | xargs -I {} sudo rm -rf {}
    echo "✅ 备份清理完成"
fi

# 9. 健康检查
echo "🏥 健康检查..."
if curl -f -s http://localhost/ >/dev/null; then
    echo "✅ 网站运行正常"
else
    echo "⚠️  健康检查失败，可能需要手动检查"
fi

# 10. 记录部署日志
LOG_FILE="/var/log/assaybio-deploy.log"
echo "$(date '+%Y-%m-%d %H:%M:%S') - 部署成功" | sudo tee -a "$LOG_FILE"

echo ""
echo "🎉 部署完成！"
echo "📝 部署日志: $LOG_FILE"
echo "💾 备份位置: $BACKUP_DIR/$BACKUP_NAME"
echo ""