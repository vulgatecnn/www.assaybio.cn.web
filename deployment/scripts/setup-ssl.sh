#!/bin/bash

# AssayBio网站 - SSL证书自动配置脚本
# 使用Let's Encrypt免费SSL证书

set -e

# 配置变量
DOMAIN="assaybio.com"
EMAIL="admin@assaybio.com"
WEBROOT_PATH="/var/www/certbot"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# 检查root权限
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "请使用root权限运行此脚本"
    fi
}

# 安装依赖
install_dependencies() {
    log "安装必要依赖..."
    
    # 更新包管理器
    apt-get update
    
    # 安装certbot和nginx插件
    apt-get install -y certbot python3-certbot-nginx
    
    # 安装Docker和Docker Compose（如果未安装）
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
}

# 创建必要目录
create_directories() {
    log "创建必要目录..."
    
    mkdir -p $WEBROOT_PATH
    mkdir -p /opt/assaybio-website/ssl
    mkdir -p /opt/assaybio-website/logs/nginx
    mkdir -p /opt/assaybio-website/logs/proxy
    
    chown -R www-data:www-data $WEBROOT_PATH
}

# 获取SSL证书
obtain_certificate() {
    log "获取SSL证书..."
    
    # 检查证书是否已存在
    if [ -d "$CERT_PATH" ]; then
        warn "证书已存在，跳过获取步骤"
        return 0
    fi
    
    # 使用webroot模式获取证书
    certbot certonly \
        --webroot \
        --webroot-path=$WEBROOT_PATH \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --domains $DOMAIN,www.$DOMAIN \
        --non-interactive
        
    if [ $? -eq 0 ]; then
        log "SSL证书获取成功"
    else
        error "SSL证书获取失败"
    fi
}

# 复制证书到项目目录
copy_certificates() {
    log "复制证书到项目目录..."
    
    if [ ! -d "$CERT_PATH" ]; then
        error "证书目录不存在: $CERT_PATH"
    fi
    
    cp "$CERT_PATH/fullchain.pem" /opt/assaybio-website/ssl/
    cp "$CERT_PATH/privkey.pem" /opt/assaybio-website/ssl/
    
    # 设置正确权限
    chmod 644 /opt/assaybio-website/ssl/fullchain.pem
    chmod 600 /opt/assaybio-website/ssl/privkey.pem
    chown root:root /opt/assaybio-website/ssl/*
    
    log "证书复制完成"
}

# 设置自动续期
setup_auto_renewal() {
    log "设置证书自动续期..."
    
    # 创建续期脚本
    cat > /opt/assaybio-website/scripts/renew-cert.sh << 'EOF'
#!/bin/bash

# 续期证书
certbot renew --quiet --webroot --webroot-path=/var/www/certbot

# 如果续期成功，重启nginx
if [ $? -eq 0 ]; then
    # 复制新证书
    cp /etc/letsencrypt/live/assaybio.com/fullchain.pem /opt/assaybio-website/ssl/
    cp /etc/letsencrypt/live/assaybio.com/privkey.pem /opt/assaybio-website/ssl/
    
    # 重启Docker服务
    cd /opt/assaybio-website
    docker-compose restart nginx-proxy
    
    echo "SSL证书续期成功 $(date)"
fi
EOF

    chmod +x /opt/assaybio-website/scripts/renew-cert.sh
    
    # 添加到crontab（每月1号凌晨2点检查）
    (crontab -l 2>/dev/null; echo "0 2 1 * * /opt/assaybio-website/scripts/renew-cert.sh >> /var/log/certbot-renewal.log 2>&1") | crontab -
    
    log "自动续期设置完成"
}

# 验证证书
verify_certificate() {
    log "验证SSL证书..."
    
    if openssl x509 -in /opt/assaybio-website/ssl/fullchain.pem -text -noout > /dev/null 2>&1; then
        log "SSL证书验证成功"
        
        # 显示证书信息
        echo "证书详情:"
        openssl x509 -in /opt/assaybio-website/ssl/fullchain.pem -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After :)"
    else
        error "SSL证书验证失败"
    fi
}

# 主函数
main() {
    log "开始SSL证书配置..."
    
    check_root
    install_dependencies
    create_directories
    obtain_certificate
    copy_certificates
    setup_auto_renewal
    verify_certificate
    
    log "SSL证书配置完成！"
    log "请确保域名 $DOMAIN 和 www.$DOMAIN 已正确解析到此服务器"
    log "然后运行: docker-compose up -d --profile proxy"
}

# 执行主函数
main "$@"