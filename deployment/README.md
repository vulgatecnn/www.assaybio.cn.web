# 上海安净生物技术有限公司 - CI/CD 部署文档

## 概述

本文档描述了上海安净生物技术有限公司网站的自动化部署系统，包括CI/CD流水线、多环境部署、监控告警等功能。

## 架构概览

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   开发环境       │    │   测试环境       │    │   生产环境       │
│   development   │────│   staging       │────│   production    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌─────────────────┐
                    │  GitHub Actions │
                    │     CI/CD       │
                    └─────────────────┘
```

## 部署流程

### 自动部署触发条件

1. **开发环境 (Development)**
   - 分支: `develop`
   - 触发: 每次push到develop分支
   - 自动部署: ✅

2. **测试环境 (Staging)**
   - 分支: `develop`, `release/*`
   - 触发: push到相关分支
   - 自动部署: ❌ (需要手动批准)

3. **生产环境 (Production)**
   - 分支: `main`
   - 触发: push到main分支
   - 自动部署: ❌ (需要手动批准)

### CI/CD流水线阶段

```mermaid
graph LR
    A[代码检查] --> B[构建测试]
    B --> C[安全扫描]
    C --> D[部署准备]
    D --> E[生产部署]
    E --> F[健康检查]
    F --> G[通知告警]
```

#### 1. 代码质量检查
- ESLint代码规范检查
- TypeScript类型检查
- 单元测试执行
- 代码覆盖率分析

#### 2. 构建和测试
- 依赖安装和缓存
- 应用构建打包
- 集成测试运行
- E2E自动化测试

#### 3. 安全扫描
- npm audit安全审计
- 依赖漏洞检查
- 敏感信息扫描
- OWASP安全检查

#### 4. 部署执行
- 服务器连接验证
- 当前版本备份
- 新版本部署
- 服务重启和配置

#### 5. 健康检查
- HTTP状态码验证
- 服务可用性检查
- 内容完整性验证
- 性能基准测试

#### 6. 失败回滚
- 自动回滚机制
- 备份版本恢复
- 服务状态重置
- 错误日志收集

## 环境配置

### 生产环境 (Production)
- **服务器**: 192.3.11.106:6500
- **部署路径**: /var/www/html
- **Web服务**: Nginx
- **备份路径**: /var/backups
- **监控**: 24/7 自动监控

### GitHub Secrets配置

在GitHub仓库的Settings > Secrets and variables > Actions中配置:

```bash
# SSH访问
PRODUCTION_SSH_KEY=<服务器SSH私钥>
STAGING_SSH_KEY=<测试服务器SSH私钥>

# 通知配置
SLACK_WEBHOOK=<Slack Webhook URL>

# 可选配置
CODECOV_TOKEN=<代码覆盖率上传token>
```

## 手动部署

### 生产环境手动部署

```bash
# 1. 连接到服务器
ssh root@192.3.11.106

# 2. 使用现有部署脚本
cd /path/to/project
./deploy.sh

# 或使用Windows环境
deploy.bat
```

### 紧急回滚

```bash
# 1. 查看可用备份
ls -la /var/backups/website-backup-*

# 2. 执行回滚
latest_backup=$(ls -t /var/backups/website-backup-*.tar.gz | head -1)
rm -rf /var/www/html/*
tar -xzf "$latest_backup" -C /var/www/html/
systemctl restart nginx
```

## 监控和告警

### 监控指标

1. **HTTP健康检查**
   - 检查间隔: 5分钟
   - 超时时间: 30秒
   - 预期状态: 200, 308

2. **系统资源监控**
   - CPU使用率: <80%
   - 内存使用率: <85%
   - 磁盘使用率: <80%

3. **服务状态监控**
   - Nginx服务状态
   - 进程数量监控
   - 网络连接监控

### 告警渠道

- **Slack通知**: #deployments, #alerts
- **日志记录**: /var/log/website-monitoring/
- **邮件告警**: (可配置)

### 日志位置

```bash
# 应用日志
/var/log/nginx/access.log
/var/log/nginx/error.log

# 监控日志
/var/log/website-monitoring/website-health.log
/var/log/website-monitoring/system-monitor.log

# 部署日志
GitHub Actions执行历史
```

## 安全配置

### 服务器安全

1. **SSH配置**
   - 密钥认证
   - 禁用密码登录
   - 非标准端口 (可选)

2. **防火墙规则**
   ```bash
   # 仅开放必要端口
   ufw allow 22/tcp   # SSH
   ufw allow 80/tcp   # HTTP  
   ufw allow 443/tcp  # HTTPS (如果启用)
   ```

3. **文件权限**
   ```bash
   # Web文件权限
   chown -R www-data:www-data /var/www/html/
   chmod -R 755 /var/www/html/
   find /var/www/html -type f -exec chmod 644 {} \;
   ```

### 应用安全

1. **依赖管理**
   - 定期security audit
   - 自动漏洞扫描
   - 依赖版本锁定

2. **敏感信息**
   - 环境变量管理
   - 配置文件加密
   - 密钥轮换策略

## 故障处理

### 常见问题

1. **部署失败**
   ```bash
   # 检查GitHub Actions日志
   # 查看服务器错误日志
   tail -f /var/log/nginx/error.log
   
   # 手动回滚
   ./rollback.sh
   ```

2. **服务异常**
   ```bash
   # 检查服务状态
   systemctl status nginx
   
   # 重启服务
   systemctl restart nginx
   ```

3. **磁盘空间不足**
   ```bash
   # 清理旧备份
   find /var/backups -name "website-backup-*.tar.gz" -mtime +7 -delete
   
   # 清理临时文件
   rm -rf /tmp/website-deploy-*
   ```

### 紧急联系

- **技术负责人**: [联系方式]
- **运维支持**: [联系方式]  
- **Slack频道**: #incidents

## 性能优化

### 部署优化

1. **构建优化**
   - 依赖缓存
   - 增量构建
   - 并行处理

2. **传输优化**
   - 压缩传输
   - 增量同步
   - CDN加速

3. **服务器优化**
   - Nginx配置调优
   - 静态文件缓存
   - Gzip压缩

### 监控优化

1. **监控频率调整**
2. **告警阈值优化**
3. **日志轮转策略**

## 最佳实践

### 开发流程

1. **功能开发**: develop分支开发
2. **集成测试**: staging环境验证
3. **生产发布**: main分支部署

### 版本管理

1. **语义化版本**: major.minor.patch
2. **标签发布**: git tag创建release
3. **变更日志**: CHANGELOG.md维护

### 安全实践

1. **最小权限原则**
2. **定期安全审计**
3. **应急响应预案**

---

**文档版本**: v1.0  
**最后更新**: 2024-08-26  
**维护人员**: DevOps Team