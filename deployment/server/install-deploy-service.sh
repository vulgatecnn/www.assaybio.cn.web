#!/bin/bash

# GitHub自动部署服务安装脚本
# 在192.3.11.106服务器上执行此脚本

set -e

echo "🚀 开始安装GitHub自动部署服务..."

# 创建服务用户（如果不存在）
if ! id -u github-deploy >/dev/null 2>&1; then
    echo "👤 创建服务用户: github-deploy"
    useradd -r -s /bin/bash -d /opt/github-deploy -m github-deploy
fi

# 创建必要目录
echo "📁 创建服务目录..."
mkdir -p /opt/github-deploy
mkdir -p /var/log/github-deploy
mkdir -p /var/backups/website
mkdir -p /etc/systemd/system

# 复制部署脚本
echo "📋 安装部署脚本..."
cp github-deploy-receiver.js /opt/github-deploy/
chmod +x /opt/github-deploy/github-deploy-receiver.js

# 安装Node.js依赖（如果需要）
if ! command -v node &> /dev/null; then
    echo "📦 安装Node.js..."
    # 对于CentOS/RHEL
    if command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_lts.x | bash -
        yum install -y nodejs
    # 对于Ubuntu/Debian
    elif command -v apt &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
        apt-get install -y nodejs
    # 对于其他系统，尝试包管理器
    else
        echo "⚠️  请手动安装Node.js"
    fi
fi

# 创建systemd服务文件
echo "🔧 创建系统服务..."
cat > /etc/systemd/system/github-deploy.service << 'EOF'
[Unit]
Description=GitHub Auto Deploy Service
After=network.target
Wants=network.target

[Service]
Type=simple
User=github-deploy
Group=github-deploy
WorkingDirectory=/opt/github-deploy
ExecStart=/usr/bin/node /opt/github-deploy/github-deploy-receiver.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/github-deploy/service.log
StandardError=append:/var/log/github-deploy/error.log

# 环境变量
Environment=NODE_ENV=production
Environment=PORT=3000

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/html /var/backups/website /var/log/github-deploy /tmp

# 资源限制
LimitNOFILE=65536
LimitNPROC=32768

[Install]
WantedBy=multi-user.target
EOF

# 设置权限
echo "🔐 设置权限..."
chown -R github-deploy:github-deploy /opt/github-deploy
chown -R github-deploy:github-deploy /var/log/github-deploy
chown -R github-deploy:github-deploy /var/backups/website

# 将github-deploy用户添加到www-data组（或nginx组）
if getent group www-data >/dev/null; then
    usermod -a -G www-data github-deploy
elif getent group nginx >/dev/null; then
    usermod -a -G nginx github-deploy
fi

# 给github-deploy用户对网站目录的写权限
chown -R github-deploy:www-data /var/www/html 2>/dev/null || chown -R github-deploy:nginx /var/www/html 2>/dev/null || echo "⚠️  请手动设置/var/www/html权限"

# 重载systemd
echo "🔄 重载系统服务..."
systemctl daemon-reload

# 启用并启动服务
echo "▶️  启动GitHub部署服务..."
systemctl enable github-deploy
systemctl start github-deploy

# 检查服务状态
echo "🔍 检查服务状态..."
if systemctl is-active --quiet github-deploy; then
    echo "✅ GitHub自动部署服务安装成功并正在运行"
    echo "📡 服务监听端口: 3000"
    echo "🌐 部署接收地址: http://192.3.11.106:3000/deploy"
    echo "📊 状态查询地址: http://192.3.11.106:3000/status"
    echo "🔍 健康检查地址: http://192.3.11.106:3000/health"
else
    echo "❌ 服务启动失败，请检查日志:"
    echo "   journalctl -u github-deploy -f"
    exit 1
fi

# 配置防火墙（如果需要）
if command -v firewall-cmd &> /dev/null && systemctl is-active --quiet firewalld; then
    echo "🔥 配置防火墙规则..."
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --reload
    echo "✅ 防火墙规则已添加"
elif command -v ufw &> /dev/null; then
    echo "🔥 配置UFW防火墙..."
    ufw allow 3000/tcp
    echo "✅ UFW防火墙规则已添加"
fi

# 创建nginx反向代理配置（可选）
echo "🔧 创建Nginx反向代理配置..."
cat > /etc/nginx/sites-available/github-deploy << 'EOF'
# GitHub部署服务反向代理
server {
    listen 8080;
    server_name 192.3.11.106;
    
    location /deploy {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # GitHub Webhook需要的头部
        proxy_pass_request_headers on;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /update {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /status {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# 启用nginx配置
if [ -d "/etc/nginx/sites-enabled" ]; then
    ln -sf /etc/nginx/sites-available/github-deploy /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    echo "✅ Nginx反向代理已配置 (端口8080)"
fi

echo ""
echo "🎉 安装完成！"
echo ""
echo "📋 后续步骤："
echo "1. 在GitHub仓库设置中添加Webhook:"
echo "   URL: http://192.3.11.106:8080/deploy"
echo "   Content type: application/json"
echo "   Secret: 设置一个安全的密钥"
echo ""
echo "2. 更新/opt/github-deploy/github-deploy-receiver.js中的配置:"
echo "   - githubRepo: 你的GitHub仓库地址"
echo "   - webhookSecret: 与GitHub设置相同的密钥"
echo ""
echo "3. 重启服务使配置生效:"
echo "   systemctl restart github-deploy"
echo ""
echo "📊 监控命令:"
echo "   systemctl status github-deploy     # 查看服务状态"
echo "   journalctl -u github-deploy -f     # 查看实时日志"
echo "   curl http://192.3.11.106:3000/status  # 检查服务状态"
echo ""