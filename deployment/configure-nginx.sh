#!/bin/bash

# 配置Nginx支持6500端口的脚本
# 在服务器192.3.11.106上执行

set -e

echo "🔧 开始配置Nginx支持6500端口..."

SERVER_IP="192.3.11.106"
NGINX_CONF_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
WEBSITE_CONF="website.conf"

# 1. 上传Nginx配置文件
echo "📤 上传Nginx配置文件..."
scp deployment/nginx/website.conf root@$SERVER_IP:$NGINX_CONF_DIR/

# 2. 在服务器上配置Nginx
echo "⚙️ 配置Nginx..."
ssh root@$SERVER_IP "
    # 启用网站配置
    if [ ! -L $NGINX_ENABLED_DIR/$WEBSITE_CONF ]; then
        ln -s $NGINX_CONF_DIR/$WEBSITE_CONF $NGINX_ENABLED_DIR/$WEBSITE_CONF
        echo '✅ 已创建配置链接'
    else
        echo '⚠️ 配置链接已存在'
    fi

    # 测试Nginx配置
    echo '🧪 测试Nginx配置...'
    nginx -t

    # 检查端口是否已被占用
    echo '🔍 检查端口6500状态...'
    if netstat -tlnp | grep :6500; then
        echo '⚠️ 端口6500已被占用'
    else
        echo '✅ 端口6500可用'
    fi

    # 重新加载Nginx配置
    echo '🔄 重新加载Nginx配置...'
    systemctl reload nginx

    # 检查Nginx状态
    systemctl status nginx --no-pager

    echo '✅ Nginx配置完成'
"

# 3. 验证配置
echo "🔍 验证端口6500是否正常监听..."
sleep 3

ssh root@$SERVER_IP "
    echo '检查端口监听状态:'
    netstat -tlnp | grep :6500 || echo '端口6500未监听'
    
    echo
    echo '检查Nginx进程:'
    ps aux | grep nginx | grep -v grep
"

# 4. 测试网站访问
echo "🌐 测试网站访问..."
if curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:6500/ | grep -E "200|308"; then
    echo "✅ 网站在6500端口访问正常"
else
    echo "❌ 网站在6500端口访问失败"
fi

echo
echo "🎉 Nginx 6500端口配置完成！"
echo "🌐 网站访问地址: http://$SERVER_IP:6500/"
echo
echo "如果需要开放防火墙端口，请执行："
echo "  ssh root@$SERVER_IP 'ufw allow 6500/tcp'"