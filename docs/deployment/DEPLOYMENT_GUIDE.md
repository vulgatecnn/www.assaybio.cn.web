# AssayBio网站部署指南

## 概述

本文档提供AssayBio网站的完整部署指南，包括生产环境配置、监控设置和维护操作。

## 系统要求

### 最小配置要求
- **CPU**: 2核心 2.0GHz
- **内存**: 4GB RAM
- **存储**: 50GB SSD
- **网络**: 100Mbps带宽
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+

### 推荐配置
- **CPU**: 4核心 2.5GHz
- **内存**: 8GB RAM
- **存储**: 100GB SSD
- **网络**: 1Gbps带宽
- **备份存储**: 200GB

### 软件依赖
- Docker 24.0+
- Docker Compose 2.20+
- Git 2.30+
- Nginx 1.20+ (如果不使用Docker)
- Let's Encrypt Certbot

## 快速部署

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 重新登录以应用Docker组权限
```

### 2. 项目部署

```bash
# 创建项目目录
sudo mkdir -p /opt/assaybio-website
cd /opt/assaybio-website

# 克隆项目
git clone https://github.com/your-org/assaybio-website.git .

# 配置环境变量
cp .env.example .env
nano .env  # 编辑配置

# 设置SSL证书
sudo ./scripts/setup-ssl.sh

# 启动服务
docker-compose up -d

# 检查服务状态
docker-compose ps
```

### 3. 快速验证

```bash
# 健康检查
curl -f http://localhost/health

# SSL检查
curl -I https://your-domain.com

# 查看日志
docker-compose logs -f
```

## 详细部署流程

### 环境配置

1. **创建环境配置文件**
```bash
cp .env.example .env
```

2. **编辑关键配置**
```bash
# 域名配置
DOMAIN=assaybio.com
SSL_EMAIL=admin@assaybio.com

# 安全配置
JWT_SECRET=your-super-secret-jwt-key-here
GRAFANA_PASSWORD=your-secure-password

# 服务配置
NODE_ENV=production
```

### SSL证书配置

#### 自动配置（推荐）
```bash
sudo ./scripts/setup-ssl.sh
```

#### 手动配置
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@assaybio.com \
  --agree-tos --no-eff-email \
  --domains assaybio.com,www.assaybio.com

# 复制证书
sudo cp /etc/letsencrypt/live/assaybio.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/assaybio.com/privkey.pem ./ssl/
```

### 服务启动

#### 基础服务
```bash
# 启动主要服务
docker-compose up -d

# 启动SSL代理
docker-compose --profile proxy up -d

# 启动监控服务
docker-compose -f docker/docker-compose.monitoring.yml --profile monitoring up -d
```

#### 服务验证
```bash
# 检查容器状态
docker-compose ps

# 查看资源使用
docker stats

# 测试网站访问
curl -f https://assaybio.com/health
```

## 部署选项

### 选项1: 单服务器部署（推荐中小型网站）

**特点:**
- 成本低
- 配置简单
- 适合中小型流量

**架构:**
```
Internet → Nginx (SSL终止) → Docker容器 → 应用
```

**部署命令:**
```bash
docker-compose up -d
```

### 选项2: 容器集群部署（高可用）

**特点:**
- 高可用
- 自动故障转移
- 水平扩展

**架构:**
```
Internet → 负载均衡器 → Nginx → 多个应用容器
```

**部署命令:**
```bash
# 启动多实例
docker-compose up -d --scale assaybio-web=3
```

### 选项3: Kubernetes部署（大规模）

**特点:**
- 自动扩缩容
- 服务网格
- 微服务架构

**部署文件:** 参见 `k8s/` 目录

### 选项4: Vercel部署（Jamstack）

**特点:**
- 零服务器运维
- 全球CDN
- 自动HTTPS

**部署配置:** 参见 `vercel.json`

## 监控配置

### 监控组件

1. **Prometheus** - 指标收集
2. **Grafana** - 数据可视化
3. **AlertManager** - 告警管理
4. **Loki** - 日志聚合
5. **Uptime Kuma** - 可用性监控

### 启动监控

```bash
# 启动完整监控栈
docker-compose -f docker/docker-compose.monitoring.yml --profile monitoring up -d

# 访问Grafana仪表板
open http://your-server-ip:3000
# 用户名: admin
# 密码: 在.env文件中的GRAFANA_PASSWORD
```

### 监控指标

- **系统指标**: CPU、内存、磁盘、网络
- **应用指标**: 响应时间、错误率、吞吐量
- **业务指标**: 访问量、转化率、用户行为

## 维护操作

### 日常维护

```bash
# 查看服务状态
./scripts/deploy.sh status

# 查看日志
./scripts/deploy.sh logs

# 创建备份
./scripts/deploy.sh backup

# 清理资源
./scripts/deploy.sh clean
```

### 版本更新

```bash
# 部署新版本
./scripts/deploy.sh deploy v1.2.0

# 检查健康状态
curl -f https://assaybio.com/health

# 如有问题，回滚到之前版本
./scripts/deploy.sh rollback backup_20240124_120000
```

### 证书续期

```bash
# 自动续期（已配置cron任务）
sudo crontab -l  # 查看自动续期任务

# 手动续期
sudo certbot renew
sudo systemctl reload nginx
```

### 数据库维护（如果使用）

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U user dbname > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U user dbname < backup.sql

# 数据库性能优化
docker-compose exec postgres psql -U user -c "VACUUM ANALYZE;"
```

## 故障排除

### 常见问题

1. **服务无法启动**
```bash
# 检查端口占用
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# 检查Docker状态
sudo systemctl status docker

# 重启服务
docker-compose down && docker-compose up -d
```

2. **SSL证书问题**
```bash
# 检查证书有效期
openssl x509 -in ./ssl/fullchain.pem -text -noout | grep "Not After"

# 重新获取证书
sudo certbot renew --force-renewal
```

3. **性能问题**
```bash
# 检查资源使用
docker stats
htop

# 查看应用日志
docker-compose logs assaybio-web

# 检查网络延迟
curl -w "@curl-format.txt" -o /dev/null -s https://assaybio.com/
```

### 日志分析

```bash
# 查看Nginx访问日志
tail -f ./logs/nginx/access.log

# 查看错误日志
tail -f ./logs/nginx/error.log

# 使用日志分析工具
docker run --rm -v $(pwd)/logs:/logs:ro \
  nginx-log-analyzer:latest \
  analyze /logs/nginx/access.log
```

### 性能优化

1. **静态资源优化**
- 启用Gzip压缩
- 设置合适的缓存头
- 使用CDN加速

2. **数据库优化**
- 索引优化
- 查询优化
- 连接池配置

3. **服务器优化**
- 内核参数调优
- 文件描述符限制
- TCP连接优化

## 安全最佳实践

### 基础安全

1. **系统安全**
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 配置防火墙
sudo ufw enable
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp

# 禁用root登录
sudo nano /etc/ssh/sshd_config
# 设置 PermitRootLogin no
sudo systemctl restart ssh
```

2. **应用安全**
- 使用强密码
- 定期更新依赖
- 启用安全头
- 实施访问控制

3. **监控安全**
- 异常检测
- 入侵检测
- 日志审计
- 安全扫描

### 数据保护

1. **备份策略**
- 自动备份
- 异地备份
- 备份验证
- 恢复测试

2. **加密措施**
- 传输加密(HTTPS)
- 存储加密
- 密钥管理
- 证书管理

## 扩展部署

### 水平扩展

```bash
# 增加应用实例
docker-compose up -d --scale assaybio-web=3

# 配置负载均衡
# 参见 nginx/load-balancer.conf
```

### 垂直扩展

```bash
# 调整容器资源限制
# 在docker-compose.yml中配置:
services:
  assaybio-web:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

### CDN配置

1. **选择CDN提供商**
- Cloudflare
- AWS CloudFront
- 阿里云CDN
- 腾讯云CDN

2. **配置CDN**
- 静态资源缓存
- 动态加速
- 安全防护
- 性能监控

## 成本优化

### 资源优化

1. **容器优化**
- 多阶段构建
- 镜像最小化
- 资源限制
- 健康检查优化

2. **存储优化**
- 日志轮转
- 备份压缩
- 临时文件清理
- 数据归档

3. **网络优化**
- CDN使用
- 压缩传输
- 连接复用
- 缓存策略

### 自动化节约

```bash
# 自动清理脚本
crontab -e
# 添加: 0 2 * * * /opt/assaybio-website/scripts/deploy.sh clean

# 资源监控告警
# 在Grafana中配置资源使用告警
```

## 支持联系

- **技术支持**: tech-support@assaybio.com
- **紧急联系**: emergency@assaybio.com
- **文档问题**: docs@assaybio.com

## 更新记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0.0 | 2024-01-24 | 初始版本，包含基础部署流程 |
| 1.1.0 | 2024-02-01 | 增加监控配置和故障排除 |
| 1.2.0 | 2024-02-15 | 优化性能和安全配置 |