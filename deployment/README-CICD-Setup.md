# 🚀 GitHub CI/CD 自动部署配置指南

本指南将帮助您在 192.3.11.106 服务器上设置 GitHub 自动部署系统。

## 📋 系统架构

```
GitHub Repository (Push) 
    ↓
GitHub Actions (CI/CD Pipeline)
    ↓
192.3.11.106 服务器 (自动部署)
    ↓
http://192.3.11.106:6500/ (网站更新)
```

## 🛠️ 部署方案

我们提供了三种部署方案，按推荐程度排序：

### 方案一：完整的 GitHub Webhook + Node.js 服务（推荐）

**特点**：
- ✅ 实时响应 GitHub 推送
- ✅ 完整的日志记录
- ✅ 自动备份和回滚
- ✅ 健康检查

**安装步骤**：

1. **上传文件到服务器**：
   ```bash
   # 将以下文件上传到服务器
   scp deployment/server/* root@192.3.11.106:/tmp/
   ```

2. **在服务器上安装**：
   ```bash
   ssh root@192.3.11.106
   cd /tmp
   chmod +x install-deploy-service.sh
   ./install-deploy-service.sh
   ```

3. **配置 GitHub 仓库**：
   - 进入 GitHub 仓库设置 → Webhooks
   - 添加新的 Webhook：
     - URL: `http://192.3.11.106:8080/deploy`
     - Content type: `application/json`
     - Secret: 设置一个安全密钥
     - Events: `push` 和 `pull_request`

4. **更新服务配置**：
   ```bash
   # 编辑配置文件
   nano /opt/github-deploy/github-deploy-receiver.js
   # 更新以下配置：
   # - githubRepo: 你的实际仓库地址
   # - webhookSecret: 与 GitHub 设置相同的密钥
   
   # 重启服务
   systemctl restart github-deploy
   ```

### 方案二：简化的定时拉取（简单可靠）

**特点**：
- ✅ 配置简单
- ✅ 定时自动更新
- ⚠️ 非实时响应

**安装步骤**：

1. **上传脚本**：
   ```bash
   scp deployment/server/simple-deploy-trigger.sh root@192.3.11.106:/usr/local/bin/
   chmod +x /usr/local/bin/simple-deploy-trigger.sh
   ```

2. **配置定时任务**：
   ```bash
   # 添加到 crontab
   crontab -e
   
   # 每5分钟检查一次更新
   */5 * * * * /usr/local/bin/simple-deploy-trigger.sh >> /var/log/github-deploy.log 2>&1
   ```

### 方案三：GitHub Actions SSH 部署

**特点**：
- ✅ GitHub 原生支持
- ⚠️ 需要 SSH 密钥配置

**配置步骤**：

1. **在 GitHub 仓库设置中添加 SSH 密钥**：
   - 生成 SSH 密钥对
   - 将私钥添加到 GitHub Secrets: `SERVER_SSH_KEY`
   - 将公钥添加到服务器的 `~/.ssh/authorized_keys`

2. **GitHub Actions 会自动使用 SSH 部署**

## 🔧 服务器端配置要求

### 系统要求
- Linux 系统（CentOS、Ubuntu、Debian）
- Nginx 或 Apache Web 服务器
- Node.js（方案一需要）
- Git（可选，用于代码拉取）

### 目录结构
```
/var/www/html/          # 网站根目录
/var/backups/website/   # 备份目录
/opt/github-deploy/     # 部署服务目录
/var/log/github-deploy/ # 日志目录
```

### 权限配置
```bash
# 创建部署用户
useradd -r github-deploy

# 设置目录权限
chown -R github-deploy:www-data /var/www/html
chmod -R 755 /var/www/html

# 设置服务权限
chown -R github-deploy:github-deploy /opt/github-deploy
```

## 📊 监控和维护

### 服务状态检查
```bash
# 检查部署服务状态
systemctl status github-deploy

# 查看实时日志
journalctl -u github-deploy -f

# 检查网站状态
curl http://192.3.11.106:6500/status
curl http://192.3.11.106:6500/health
```

### 手动触发部署
```bash
# 方式1：通过API触发
curl -X GET "http://192.3.11.106:8080/update?token=github-deploy-2025"

# 方式2：直接运行脚本
/usr/local/bin/simple-deploy-trigger.sh

# 方式3：重启服务并拉取
systemctl restart github-deploy
```

### 备份管理
```bash
# 查看备份文件
ls -la /var/backups/website/

# 手动创建备份
cd /var/www/html
tar -czf /var/backups/website/manual-backup-$(date +%Y%m%d-%H%M%S).tar.gz *

# 恢复备份
cd /var/www/html
rm -rf *
tar -xzf /var/backups/website/backup-YYYYMMDD-HHMMSS.tar.gz
```

## 🔍 故障排除

### 常见问题

1. **部署服务无法启动**
   ```bash
   journalctl -u github-deploy -n 50
   ```

2. **网站无法访问**
   ```bash
   nginx -t                    # 检查配置
   systemctl status nginx      # 检查服务状态
   netstat -tulpn | grep 6500  # 检查端口
   ```

3. **权限问题**
   ```bash
   chown -R www-data:www-data /var/www/html
   chmod -R 644 /var/www/html/*
   find /var/www/html -type d -exec chmod 755 {} \;
   ```

4. **GitHub Webhook 失败**
   - 检查防火墙设置
   - 验证 Webhook URL 可访问
   - 检查 Secret 配置是否一致

### 日志位置
- 部署服务日志: `/var/log/github-deploy/`
- Nginx 日志: `/var/log/nginx/`
- 系统日志: `journalctl -u github-deploy`

## 🚀 测试部署

1. **提交测试更改到 GitHub**
2. **检查 GitHub Actions 执行情况**
3. **验证网站更新**：
   ```bash
   curl http://192.3.11.106:6500/version.json
   ```

## 🔐 安全注意事项

1. **设置强密码和密钥**
2. **限制服务访问IP范围**
3. **定期更新系统和依赖**
4. **监控异常访问和日志**
5. **定期备份重要数据**

## 📞 支持

如果遇到问题，请检查：
1. 服务器日志文件
2. GitHub Actions 执行日志
3. 网络连接状态
4. 权限和配置设置

---

**注意**：请根据您的实际服务器环境调整配置参数，确保所有路径和设置与您的系统匹配。