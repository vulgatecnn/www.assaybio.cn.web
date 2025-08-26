#!/bin/bash

# 上海安净生物技术有限公司网站健康检查脚本
# 用于监控生产环境网站状态

set -e

# 配置
WEBSITE_URL="http://192.3.11.106:6500"
EXPECTED_STATUS="200|308"  # 接受200或308状态码
TIMEOUT=30
LOG_FILE="/var/log/website-health.log"
ALERT_WEBHOOK="${SLACK_WEBHOOK_URL}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 发送告警
send_alert() {
    local status="$1"
    local message="$2"
    
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 **网站健康检查告警**\n状态: $status\n消息: $message\n时间: $(date '+%Y-%m-%d %H:%M:%S')\n网站: $WEBSITE_URL\"}" \
            "$ALERT_WEBHOOK" 2>/dev/null || true
    fi
}

# 检查HTTP状态
check_http_status() {
    log "开始HTTP状态检查..."
    
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" --connect-timeout "$TIMEOUT" "$WEBSITE_URL")
    
    local status_code="${response%%:*}"
    local response_time="${response##*:}"
    
    if [[ "$status_code" =~ ^($EXPECTED_STATUS)$ ]]; then
        log "✅ HTTP检查通过 - 状态码: $status_code, 响应时间: ${response_time}s"
        return 0
    else
        log "❌ HTTP检查失败 - 状态码: $status_code, 响应时间: ${response_time}s"
        send_alert "HTTP_ERROR" "网站返回异常状态码: $status_code"
        return 1
    fi
}

# 检查Nginx服务状态
check_nginx_status() {
    log "检查Nginx服务状态..."
    
    if systemctl is-active --quiet nginx; then
        log "✅ Nginx服务运行正常"
        return 0
    else
        log "❌ Nginx服务异常"
        send_alert "SERVICE_ERROR" "Nginx服务未运行"
        return 1
    fi
}

# 检查磁盘空间
check_disk_space() {
    log "检查磁盘空间..."
    
    local usage
    usage=$(df /var/www/html | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt 80 ]; then
        log "✅ 磁盘空间正常 - 使用率: ${usage}%"
        return 0
    elif [ "$usage" -lt 90 ]; then
        log "⚠️ 磁盘空间告警 - 使用率: ${usage}%"
        send_alert "DISK_WARNING" "磁盘使用率达到 ${usage}%"
        return 1
    else
        log "❌ 磁盘空间严重不足 - 使用率: ${usage}%"
        send_alert "DISK_CRITICAL" "磁盘使用率达到 ${usage}%，请立即处理"
        return 1
    fi
}

# 检查网站内容完整性
check_content_integrity() {
    log "检查网站内容完整性..."
    
    local content
    content=$(curl -s --connect-timeout "$TIMEOUT" "$WEBSITE_URL")
    
    if echo "$content" | grep -q "上海安净生物技术有限公司"; then
        log "✅ 网站内容完整性检查通过"
        return 0
    else
        log "❌ 网站内容完整性检查失败"
        send_alert "CONTENT_ERROR" "网站内容异常，可能存在部署问题"
        return 1
    fi
}

# 检查SSL证书（如果启用HTTPS）
check_ssl_certificate() {
    if [[ "$WEBSITE_URL" =~ ^https ]]; then
        log "检查SSL证书..."
        
        local expiry_date
        expiry_date=$(openssl s_client -connect "${WEBSITE_URL#https://}:443" -servername "${WEBSITE_URL#https://}" </dev/null 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
        
        local expiry_timestamp
        expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp
        current_timestamp=$(date +%s)
        local days_until_expiry
        days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ "$days_until_expiry" -gt 30 ]; then
            log "✅ SSL证书正常 - 还有${days_until_expiry}天过期"
            return 0
        elif [ "$days_until_expiry" -gt 7 ]; then
            log "⚠️ SSL证书即将过期 - 还有${days_until_expiry}天"
            send_alert "SSL_WARNING" "SSL证书将在${days_until_expiry}天后过期"
            return 1
        else
            log "❌ SSL证书即将过期 - 还有${days_until_expiry}天"
            send_alert "SSL_CRITICAL" "SSL证书将在${days_until_expiry}天后过期，请立即更新"
            return 1
        fi
    fi
}

# 主检查函数
main() {
    log "==================== 开始健康检查 ===================="
    
    local failed_checks=0
    
    # 执行各项检查
    check_http_status || ((failed_checks++))
    check_nginx_status || ((failed_checks++))
    check_disk_space || ((failed_checks++))
    check_content_integrity || ((failed_checks++))
    check_ssl_certificate || ((failed_checks++))
    
    # 汇总结果
    if [ $failed_checks -eq 0 ]; then
        log "🎉 所有健康检查通过"
        exit 0
    else
        log "⚠️ 有${failed_checks}项检查失败"
        exit 1
    fi
}

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

# 运行主检查
main "$@"