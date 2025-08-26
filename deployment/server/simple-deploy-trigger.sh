#!/bin/bash

# 简化的GitHub部署触发脚本
# 可以直接在服务器上运行，从GitHub拉取最新代码并部署

set -e

# 配置
GITHUB_REPO="https://github.com/你的用户名/trea"  # 请替换为实际仓库地址
WEB_ROOT="/var/www/html"
BACKUP_DIR="/var/backups/website"
TEMP_DIR="/tmp/deploy-$(date +%s)"
BRANCH="main"

echo "🚀 开始从GitHub部署最新代码..."
echo "📂 仓库: $GITHUB_REPO"
echo "🌐 目标目录: $WEB_ROOT"

# 创建临时目录
echo "📁 创建临时目录: $TEMP_DIR"
mkdir -p "$TEMP_DIR"
mkdir -p "$BACKUP_DIR"

# 备份当前网站
echo "💾 创建当前网站备份..."
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
cd "$WEB_ROOT" && tar -czf "$BACKUP_FILE" * 2>/dev/null || echo "⚠️  备份创建警告（可能是空目录）"
echo "✅ 备份保存至: $BACKUP_FILE"

# 下载最新代码
echo "⬇️  下载GitHub代码..."
cd "$TEMP_DIR"
if git clone --branch "$BRANCH" --single-branch "$GITHUB_REPO.git" code; then
    echo "✅ Git克隆成功"
    CODE_DIR="$TEMP_DIR/code"
elif wget -O code.zip "$GITHUB_REPO/archive/refs/heads/$BRANCH.zip" && unzip -q code.zip; then
    echo "✅ ZIP下载成功"
    CODE_DIR="$TEMP_DIR/trea-$BRANCH"
else
    echo "❌ 代码下载失败"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 检查代码目录
if [ ! -d "$CODE_DIR" ]; then
    echo "❌ 找不到代码目录"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo "📋 开始部署代码..."

# 清理目标目录（保留备份文件）
echo "🧹 清理目标目录..."
cd "$WEB_ROOT"
find . -maxdepth 1 ! -name '.' ! -name 'backup-*' ! -name '*.log' -exec rm -rf {} + 2>/dev/null || true

# 部署新文件
echo "📦 部署新文件..."
cd "$CODE_DIR"

# 复制网站文件
if [ -d "apps/website/dist" ]; then
    echo "  📁 复制dist目录..."
    cp -r apps/website/dist/* "$WEB_ROOT/" 2>/dev/null || true
fi

# 复制静态资源
for dir in css js images icons; do
    if [ -d "$dir" ]; then
        echo "  📁 复制 $dir 目录..."
        cp -r "$dir" "$WEB_ROOT/" 2>/dev/null || true
    fi
done

# 复制主要文件
for file in index.html; do
    if [ -f "$file" ]; then
        echo "  📄 复制 $file..."
        cp "$file" "$WEB_ROOT/" 2>/dev/null || true
    fi
done

# 复制配置文件
if [ -f "apps/website/temp.json" ]; then
    echo "  📄 复制配置文件 temp.json..."
    cp "apps/website/temp.json" "$WEB_ROOT/" 2>/dev/null || true
fi

# 创建版本信息文件
echo "📝 创建版本信息..."
cat > "$WEB_ROOT/version.json" << EOF
{
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployed_from": "$GITHUB_REPO",
  "branch": "$BRANCH",
  "deploy_method": "simple-script",
  "server": "$(hostname)",
  "backup_file": "$BACKUP_FILE"
}
EOF

# 设置文件权限
echo "🔐 设置文件权限..."
cd "$WEB_ROOT"
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;

# 设置所有者
if getent group www-data >/dev/null 2>&1; then
    chown -R www-data:www-data "$WEB_ROOT" 2>/dev/null || echo "⚠️  无法设置www-data所有者，请手动处理"
elif getent group nginx >/dev/null 2>&1; then
    chown -R nginx:nginx "$WEB_ROOT" 2>/dev/null || echo "⚠️  无法设置nginx所有者，请手动处理"
else
    echo "⚠️  未找到www-data或nginx用户组，请手动设置权限"
fi

# 重载Web服务器
echo "🔄 重载Web服务器..."
if systemctl is-active nginx >/dev/null 2>&1; then
    systemctl reload nginx && echo "✅ Nginx重载成功"
elif systemctl is-active apache2 >/dev/null 2>&1; then
    systemctl reload apache2 && echo "✅ Apache重载成功"
elif systemctl is-active httpd >/dev/null 2>&1; then
    systemctl reload httpd && echo "✅ Apache重载成功"
else
    echo "⚠️  未找到活动的Web服务器"
fi

# 清理临时文件
echo "🧹 清理临时文件..."
rm -rf "$TEMP_DIR"

# 健康检查
echo "🔍 执行健康检查..."
if curl -f -s http://localhost:6500/ >/dev/null; then
    echo "✅ 网站健康检查通过"
    # 检查版本信息
    if curl -f -s http://localhost:6500/version.json >/dev/null; then
        echo "✅ 版本信息文件可访问"
    fi
else
    echo "❌ 网站健康检查失败"
    echo "🔄 尝试回滚到备份..."
    
    # 简单回滚
    cd "$WEB_ROOT"
    rm -rf * 2>/dev/null || true
    tar -xzf "$BACKUP_FILE" -C "$WEB_ROOT/" 2>/dev/null || echo "❌ 回滚失败"
    
    exit 1
fi

# 清理旧备份（保留最近5个）
echo "🧹 清理旧备份文件..."
cd "$BACKUP_DIR"
ls -t backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

echo ""
echo "🎉 部署成功完成！"
echo "🌐 网站地址: http://192.3.11.106:6500/"
echo "📊 版本信息: http://192.3.11.106:6500/version.json"
echo "💾 备份文件: $BACKUP_FILE"
echo "⏰ 部署时间: $(date)"
echo ""