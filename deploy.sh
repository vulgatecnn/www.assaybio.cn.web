#!/bin/bash

# 上海安净生物技术有限公司网站部署脚本
# 部署到: 192.3.11.106

set -e  # 遇到错误时停止执行

echo "🚀 开始部署网站到生产服务器..."

# 检查服务器连接
echo "📡 检查服务器连接..."
if ! ssh -o ConnectTimeout=10 root@192.3.11.106 "echo '服务器连接成功'"; then
    echo "❌ 无法连接到服务器 192.3.11.106"
    exit 1
fi

# 备份当前网站（可选）
echo "💾 创建服务器备份..."
ssh root@192.3.11.106 "
    if [ -d /var/www/html ]; then
        tar -czf /var/backups/website-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /var/www html/
        echo '✅ 备份完成'
    fi
"

# 同步文件到服务器
echo "📤 同步文件到服务器..."
rsync -avz --delete \
    --progress \
    --exclude 'node_modules/' \
    --exclude '.git/' \
    --exclude '*.log' \
    --exclude 'apps/website/src/' \
    --exclude 'apps/website/tests/' \
    --exclude 'apps/website/node_modules/' \
    --exclude 'test_*/' \
    --exclude 'tools/' \
    --exclude 'web/backup_site/' \
    --exclude '.env*' \
    --exclude 'CLAUDE.md' \
    --exclude 'deploy.sh' \
    --exclude 'deploy.bat' \
    ./ root@192.3.11.106:/var/www/html/

# 设置正确的文件权限
echo "🔐 设置文件权限..."
ssh root@192.3.11.106 "
    chown -R www-data:www-data /var/www/html/
    chmod -R 755 /var/www/html/
    chmod -R 644 /var/www/html/*.html /var/www/html/*.json
"

# 重启Web服务器（如果需要）
echo "🔄 重启Web服务器..."
ssh root@192.3.11.106 "
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx
        echo '✅ Nginx已重新载入'
    elif systemctl is-active --quiet apache2; then
        systemctl reload apache2
        echo '✅ Apache已重新载入'
    fi
"

echo "🎉 部署完成！"
echo "🌐 网站地址: http://192.3.11.106:6500"