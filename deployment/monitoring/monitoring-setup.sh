#!/bin/bash

# 生产环境监控设置脚本
# 在服务器192.3.11.106上设置监控和告警

set -e

SERVER_IP="192.3.11.106"
MONITORING_DIR="/opt/website-monitoring"
LOG_DIR="/var/log/website-monitoring"

echo "🚀 开始设置生产环境监控..."

# 1. 在服务器上创建监控目录
ssh root@$SERVER_IP "
    mkdir -p $MONITORING_DIR
    mkdir -p $LOG_DIR
    chmod 755 $MONITORING_DIR
"

# 2. 上传健康检查脚本
echo "📤 上传健康检查脚本..."
scp deployment/monitoring/health-check.sh root@$SERVER_IP:$MONITORING_DIR/
ssh root@$SERVER_IP "chmod +x $MONITORING_DIR/health-check.sh"

# 3. 设置定时任务
echo "⏰ 设置定时监控任务..."
ssh root@$SERVER_IP "
    # 每5分钟执行一次健康检查
    (crontab -l 2>/dev/null || true; echo '*/5 * * * * $MONITORING_DIR/health-check.sh >> $LOG_DIR/cron.log 2>&1') | crontab -
    
    # 每天凌晨清理7天前的日志
    (crontab -l 2>/dev/null || true; echo '0 2 * * * find $LOG_DIR -name \"*.log\" -mtime +7 -delete') | crontab -
"

# 4. 安装并配置Nginx状态页面
echo "📊 配置Nginx状态页面..."
ssh root@$SERVER_IP "
    # 创建Nginx状态配置
    cat > /etc/nginx/conf.d/status.conf << 'EOF'
server {
    listen 127.0.0.1:8080;
    server_name localhost;
    
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
    
    location /health {
        access_log off;
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF
    
    # 重新加载Nginx配置
    nginx -t && systemctl reload nginx
"

# 5. 创建系统监控脚本
echo "📈 创建系统监控脚本..."
ssh root@$SERVER_IP "
    cat > $MONITORING_DIR/system-monitor.sh << 'EOF'
#!/bin/bash

# 系统资源监控脚本
LOG_FILE=\"$LOG_DIR/system-monitor.log\"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEM=85
ALERT_THRESHOLD_DISK=80

log() {
    echo \"[\$(date '+%Y-%m-%d %H:%M:%S')] \$1\" | tee -a \"\$LOG_FILE\"
}

# CPU使用率检查
cpu_usage=\$(top -bn1 | grep \"Cpu(s)\" | awk '{print \$2}' | cut -d'%' -f1 | cut -d' ' -f1)
cpu_usage=\${cpu_usage%.*}  # 取整数部分

if [ \"\$cpu_usage\" -gt \$ALERT_THRESHOLD_CPU ]; then
    log \"⚠️ CPU使用率告警: \${cpu_usage}%\"
fi

# 内存使用率检查  
mem_usage=\$(free | grep Mem | awk '{printf \"%.0f\", \$3/\$2 * 100.0}')

if [ \"\$mem_usage\" -gt \$ALERT_THRESHOLD_MEM ]; then
    log \"⚠️ 内存使用率告警: \${mem_usage}%\"
fi

# 磁盘使用率检查
disk_usage=\$(df /var/www/html | awk 'NR==2 {print \$5}' | sed 's/%//')

if [ \"\$disk_usage\" -gt \$ALERT_THRESHOLD_DISK ]; then
    log \"⚠️ 磁盘使用率告警: \${disk_usage}%\"
fi

log \"✅ 系统监控完成 - CPU: \${cpu_usage}%, MEM: \${mem_usage}%, DISK: \${disk_usage}%\"
EOF

    chmod +x $MONITORING_DIR/system-monitor.sh
"

# 6. 添加系统监控到定时任务
ssh root@$SERVER_IP "
    # 每10分钟执行一次系统监控
    (crontab -l 2>/dev/null || true; echo '*/10 * * * * $MONITORING_DIR/system-monitor.sh') | crontab -
"

# 7. 创建日志轮转配置
echo "📝 配置日志轮转..."
ssh root@$SERVER_IP "
    cat > /etc/logrotate.d/website-monitoring << 'EOF'
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}
EOF
"

# 8. 设置Prometheus监控（可选）
if command -v prometheus &> /dev/null; then
    echo "📊 配置Prometheus监控..."
    ssh root@$SERVER_IP "
        # 创建Node Exporter服务
        if ! systemctl is-active --quiet node_exporter; then
            wget -q https://github.com/prometheus/node_exporter/releases/latest/download/node_exporter-1.6.1.linux-amd64.tar.gz
            tar xzf node_exporter-*.tar.gz
            mv node_exporter-*/node_exporter /usr/local/bin/
            rm -rf node_exporter-*
            
            # 创建systemd服务
            cat > /etc/systemd/system/node_exporter.service << 'EOD'
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=nobody
ExecStart=/usr/local/bin/node_exporter
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOD
            
            systemctl daemon-reload
            systemctl enable node_exporter
            systemctl start node_exporter
        fi
    "
fi

# 9. 验证监控设置
echo "🔍 验证监控设置..."
ssh root@$SERVER_IP "
    echo '验证定时任务:'
    crontab -l
    echo
    echo '验证监控脚本:'
    ls -la $MONITORING_DIR/
    echo
    echo '测试健康检查:'
    $MONITORING_DIR/health-check.sh || true
"

echo "✅ 监控设置完成！"
echo
echo "监控功能:"
echo "- ✅ 每5分钟执行健康检查"
echo "- ✅ 每10分钟执行系统监控"
echo "- ✅ 自动日志轮转"
echo "- ✅ Nginx状态页面: http://127.0.0.1:8080/nginx_status"
echo
echo "日志位置:"
echo "- 健康检查: $LOG_DIR/website-health.log"
echo "- 系统监控: $LOG_DIR/system-monitor.log"
echo "- 定时任务: $LOG_DIR/cron.log"