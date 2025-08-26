#!/bin/bash
# AssayBio SSL/TLS证书自动化管理脚本
# Let's Encrypt 证书申请、续期和部署

set -euo pipefail

# ====================
# 配置和环境变量
# ====================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# SSL配置
DOMAINS="${CERTBOT_DOMAINS:-assaybio.com,www.assaybio.com}"
EMAIL="${LETSENCRYPT_EMAIL:-admin@assaybio.com}"
WEBROOT_PATH="${WEBROOT_PATH:-/var/www/html}"
CERT_PATH="${CERT_PATH:-/etc/letsencrypt/live}"
NGINX_CONF_PATH="${NGINX_CONF_PATH:-/etc/nginx}"

# 证书管理配置
CERT_RENEWAL_DAYS="${CERT_RENEWAL_DAYS:-30}"
CERT_BACKUP_RETENTION="${CERT_BACKUP_RETENTION:-90}"
NOTIFICATION_WEBHOOK="${SLACK_WEBHOOK:-}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ====================
# 日志函数
# ====================
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    logger -t ssl-setup "INFO: $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
    logger -t ssl-setup "WARNING: $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    logger -t ssl-setup "ERROR: $1"
    return 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
    logger -t ssl-setup "INFO: $1"
}

# 发送通知
send_notification() {
    local message="$1"
    local severity="${2:-info}"
    
    if [ -n "$NOTIFICATION_WEBHOOK" ]; then
        local color="#36a64f"  # green
        case "$severity" in
            "warning") color="#ffaa00" ;;
            "error") color="#ff0000" ;;
        esac
        
        curl -s -X POST "$NOTIFICATION_WEBHOOK" \
            -H 'Content-type: application/json' \
            --data-raw '{
                "attachments": [{
                    "color": "'$color'",
                    "title": "AssayBio SSL Certificate Alert",
                    "text": "'$message'",
                    "footer": "SSL Management System",
                    "ts": '$(date +%s)'
                }]
            }' > /dev/null 2>&1 || true
    fi
}

# ====================
# 环境检查
# ====================
check_requirements() {
    log "Checking SSL management requirements..."
    
    # 检查必需的工具
    local tools=("certbot" "nginx" "openssl" "curl")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error "$tool is not installed or not in PATH"
        fi
    done
    
    # 检查nginx配置语法
    if ! nginx -t 2>/dev/null; then
        error "Nginx configuration has syntax errors"
    fi
    
    # 检查网络连通性
    if ! curl -s --connect-timeout 10 https://acme-v02.api.letsencrypt.org/directory > /dev/null; then
        warn "Cannot reach Let's Encrypt servers - continuing anyway"
    fi
    
    # 创建必要的目录
    mkdir -p /var/www/certbot
    mkdir -p /etc/letsencrypt/renewal-hooks/post
    mkdir -p /var/log/ssl
    
    log "SSL requirements check completed"
}

# ====================
# 证书申请
# ====================
obtain_certificate() {
    log "Obtaining SSL certificate for domains: $DOMAINS"
    
    # 分解域名列表
    local domain_array
    IFS=',' read -ra domain_array <<< "$DOMAINS"
    local primary_domain="${domain_array[0]}"
    
    # 检查是否已有有效证书
    if [ -d "$CERT_PATH/$primary_domain" ]; then
        local cert_file="$CERT_PATH/$primary_domain/cert.pem"
        if [ -f "$cert_file" ]; then
            local expiry_date
            expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
            local expiry_timestamp
            expiry_timestamp=$(date -d "$expiry_date" +%s)
            local current_timestamp
            current_timestamp=$(date +%s)
            local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [ $days_until_expiry -gt $CERT_RENEWAL_DAYS ]; then
                log "Certificate for $primary_domain is valid for $days_until_expiry more days"
                return 0
            else
                warn "Certificate for $primary_domain expires in $days_until_expiry days - renewing"
            fi
        fi
    fi
    
    # 构建certbot命令
    local certbot_cmd="certbot certonly --webroot"
    certbot_cmd+=" --webroot-path=$WEBROOT_PATH"
    certbot_cmd+=" --email $EMAIL"
    certbot_cmd+=" --agree-tos"
    certbot_cmd+=" --non-interactive"
    certbot_cmd+=" --expand"
    
    # 添加域名
    for domain in "${domain_array[@]}"; do
        certbot_cmd+=" -d $domain"
    done
    
    # 执行证书申请
    info "Running: $certbot_cmd"
    if $certbot_cmd; then
        log "Certificate obtained successfully"
        send_notification "SSL certificate obtained successfully for domains: $DOMAINS"
        return 0
    else
        error "Failed to obtain SSL certificate"
        send_notification "Failed to obtain SSL certificate for domains: $DOMAINS" "error"
        return 1
    fi
}

# ====================
# 证书续期
# ====================
renew_certificate() {
    log "Checking and renewing certificates..."
    
    # 备份当前证书
    backup_certificates
    
    # 执行续期
    local renewal_output
    renewal_output=$(certbot renew --webroot --webroot-path="$WEBROOT_PATH" --quiet 2>&1 || echo "RENEWAL_FAILED")
    
    if [[ "$renewal_output" == *"RENEWAL_FAILED"* ]]; then
        error "Certificate renewal failed"
        send_notification "Certificate renewal failed: $renewal_output" "error"
        return 1
    elif [[ "$renewal_output" == *"renewed"* ]]; then
        log "Certificates renewed successfully"
        send_notification "SSL certificates renewed successfully"
        
        # 重新加载Nginx配置
        reload_nginx
        
        # 验证续期后的证书
        verify_certificates
        
        return 0
    else
        log "No certificates needed renewal"
        return 0
    fi
}

# ====================
# 证书验证
# ====================
verify_certificates() {
    log "Verifying SSL certificates..."
    
    local domain_array
    IFS=',' read -ra domain_array <<< "$DOMAINS"
    local primary_domain="${domain_array[0]}"
    
    local cert_file="$CERT_PATH/$primary_domain/fullchain.pem"
    local key_file="$CERT_PATH/$primary_domain/privkey.pem"
    
    if [ ! -f "$cert_file" ] || [ ! -f "$key_file" ]; then
        error "Certificate files not found for $primary_domain"
    fi
    
    # 验证证书完整性
    if ! openssl x509 -in "$cert_file" -text -noout > /dev/null 2>&1; then
        error "Certificate file is corrupted: $cert_file"
    fi
    
    # 验证私钥
    if ! openssl rsa -in "$key_file" -check -noout > /dev/null 2>&1; then
        error "Private key file is corrupted: $key_file"
    fi
    
    # 验证证书和私钥匹配
    local cert_modulus key_modulus
    cert_modulus=$(openssl x509 -noout -modulus -in "$cert_file" | openssl md5)
    key_modulus=$(openssl rsa -noout -modulus -in "$key_file" | openssl md5)
    
    if [ "$cert_modulus" != "$key_modulus" ]; then
        error "Certificate and private key do not match"
    fi
    
    # 检查证书有效期
    local expiry_date
    expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
    local expiry_timestamp
    expiry_timestamp=$(date -d "$expiry_date" +%s)
    local current_timestamp
    current_timestamp=$(date +%s)
    local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    log "Certificate for $primary_domain expires in $days_until_expiry days"
    
    if [ $days_until_expiry -lt 7 ]; then
        error "Certificate expires in less than 7 days!"
        send_notification "SSL certificate for $primary_domain expires in $days_until_expiry days!" "error"
    elif [ $days_until_expiry -lt 30 ]; then
        warn "Certificate expires in less than 30 days"
        send_notification "SSL certificate for $primary_domain expires in $days_until_expiry days" "warning"
    fi
    
    # 在线验证证书
    for domain in "${domain_array[@]}"; do
        info "Verifying online certificate for $domain..."
        local online_check
        online_check=$(curl -s --connect-timeout 10 "https://$domain" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")
        
        if [ "$online_check" = "200" ]; then
            log "Online certificate verification passed for $domain"
        else
            warn "Online certificate verification failed for $domain (HTTP $online_check)"
        fi
    done
    
    log "Certificate verification completed"
}

# ====================
# 证书备份
# ====================
backup_certificates() {
    log "Creating certificate backup..."
    
    local backup_dir="/var/backups/ssl/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    if [ -d "$CERT_PATH" ]; then
        # 备份所有证书
        cp -r "$CERT_PATH"/* "$backup_dir/" 2>/dev/null || true
        
        # 创建压缩备份
        tar -czf "${backup_dir}.tar.gz" -C "$backup_dir" . 2>/dev/null || true
        
        # 删除未压缩的备份目录
        rm -rf "$backup_dir" 2>/dev/null || true
        
        log "Certificate backup created: ${backup_dir}.tar.gz"
    fi
    
    # 清理旧备份
    find /var/backups/ssl -name "*.tar.gz" -mtime +$CERT_BACKUP_RETENTION -delete 2>/dev/null || true
}

# ====================
# Nginx配置更新
# ====================
update_nginx_config() {
    log "Updating Nginx SSL configuration..."
    
    local domain_array
    IFS=',' read -ra domain_array <<< "$DOMAINS"
    local primary_domain="${domain_array[0]}"
    
    # 检查证书文件是否存在
    local cert_file="$CERT_PATH/$primary_domain/fullchain.pem"
    local key_file="$CERT_PATH/$primary_domain/privkey.pem"
    
    if [ ! -f "$cert_file" ] || [ ! -f "$key_file" ]; then
        error "Certificate files not found, cannot update Nginx config"
    fi
    
    # 创建SSL配置片段
    local ssl_conf="$NGINX_CONF_PATH/conf.d/ssl-params.conf"
    cat > "$ssl_conf" << EOF
# AssayBio SSL Configuration
# Generated automatically - do not edit manually

ssl_certificate $cert_file;
ssl_certificate_key $key_file;

# SSL Protocol and Cipher Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

# SSL Session Configuration
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate $cert_file;

# DNS Resolver for OCSP
resolver 1.1.1.1 8.8.8.8 valid=300s;
resolver_timeout 5s;

# Security Headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
EOF
    
    # 测试Nginx配置
    if nginx -t 2>/dev/null; then
        log "Nginx SSL configuration updated successfully"
        return 0
    else
        error "Nginx configuration test failed after SSL update"
        # 恢复备份配置
        rm -f "$ssl_conf"
        return 1
    fi
}

# ====================
# 重新加载Nginx
# ====================
reload_nginx() {
    log "Reloading Nginx configuration..."
    
    if nginx -t 2>/dev/null; then
        if systemctl reload nginx 2>/dev/null; then
            log "Nginx reloaded successfully"
            return 0
        else
            error "Failed to reload Nginx"
            return 1
        fi
    else
        error "Nginx configuration test failed, not reloading"
        return 1
    fi
}

# ====================
# 设置自动续期
# ====================
setup_auto_renewal() {
    log "Setting up automatic certificate renewal..."
    
    # 创建续期脚本
    local renewal_script="/usr/local/bin/ssl-auto-renew.sh"
    cat > "$renewal_script" << 'EOF'
#!/bin/bash
# AssayBio SSL Certificate Auto-Renewal Script
# Runs daily to check and renew certificates if needed

set -euo pipefail

# 日志配置
LOG_FILE="/var/log/ssl/renewal-$(date +%Y%m%d).log"
mkdir -p "$(dirname "$LOG_FILE")"

# 重定向输出到日志文件
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo "=== SSL Certificate Renewal Check Started at $(date) ==="

# 运行续期检查
if /deployment/ssl/ssl-setup.sh renew; then
    echo "SSL certificate renewal check completed successfully"
    exit 0
else
    echo "SSL certificate renewal check failed"
    exit 1
fi
EOF
    
    chmod +x "$renewal_script"
    
    # 创建cron任务
    local cron_job="0 2 * * * $renewal_script >> /var/log/ssl/cron.log 2>&1"
    
    # 检查cron任务是否已存在
    if ! crontab -l 2>/dev/null | grep -q "$renewal_script"; then
        # 添加cron任务
        (crontab -l 2>/dev/null || echo ""; echo "$cron_job") | crontab -
        log "Automatic renewal cron job created"
    else
        log "Automatic renewal cron job already exists"
    fi
    
    # 创建systemd service (作为备用)
    cat > /etc/systemd/system/ssl-renewal.service << EOF
[Unit]
Description=SSL Certificate Renewal
After=network.target

[Service]
Type=oneshot
ExecStart=$renewal_script
User=root
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    # 创建systemd timer
    cat > /etc/systemd/system/ssl-renewal.timer << EOF
[Unit]
Description=Run SSL Certificate Renewal Daily
Requires=ssl-renewal.service

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=3600

[Install]
WantedBy=timers.target
EOF
    
    # 启用并启动timer
    systemctl daemon-reload
    systemctl enable ssl-renewal.timer
    systemctl start ssl-renewal.timer
    
    log "Automatic renewal setup completed"
}

# ====================
# 证书监控和告警
# ====================
monitor_certificates() {
    log "Monitoring SSL certificates..."
    
    local domain_array
    IFS=',' read -ra domain_array <<< "$DOMAINS"
    
    for domain in "${domain_array[@]}"; do
        info "Monitoring certificate for $domain..."
        
        # 检查证书到期时间
        local expiry_check
        expiry_check=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -enddate -noout 2>/dev/null | cut -d= -f2 || echo "")
        
        if [ -n "$expiry_check" ]; then
            local expiry_timestamp
            expiry_timestamp=$(date -d "$expiry_check" +%s)
            local current_timestamp
            current_timestamp=$(date +%s)
            local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            log "Certificate for $domain expires in $days_until_expiry days"
            
            # 发送告警
            if [ $days_until_expiry -lt 7 ]; then
                send_notification "CRITICAL: SSL certificate for $domain expires in $days_until_expiry days!" "error"
            elif [ $days_until_expiry -lt 14 ]; then
                send_notification "WARNING: SSL certificate for $domain expires in $days_until_expiry days" "warning"
            fi
        else
            warn "Could not check certificate expiry for $domain"
            send_notification "Could not check SSL certificate for $domain" "warning"
        fi
    done
}

# ====================
# 主函数
# ====================
main() {
    local action="${1:-setup}"
    
    case "$action" in
        "setup"|"initial")
            log "Starting SSL certificate initial setup..."
            check_requirements
            obtain_certificate
            update_nginx_config
            reload_nginx
            verify_certificates
            setup_auto_renewal
            log "SSL certificate setup completed successfully"
            ;;
        "renew")
            log "Starting SSL certificate renewal..."
            check_requirements
            renew_certificate
            ;;
        "verify")
            log "Starting SSL certificate verification..."
            verify_certificates
            ;;
        "monitor")
            log "Starting SSL certificate monitoring..."
            monitor_certificates
            ;;
        "backup")
            log "Creating SSL certificate backup..."
            backup_certificates
            ;;
        *)
            echo "Usage: $0 {setup|renew|verify|monitor|backup}"
            echo "  setup   - Initial SSL certificate setup"
            echo "  renew   - Renew existing certificates"
            echo "  verify  - Verify certificate validity"
            echo "  monitor - Check certificate expiry"
            echo "  backup  - Create certificate backup"
            exit 1
            ;;
    esac
}

# 运行主函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi