# AssayBio 自动化部署文档

## 🚀 Git Hook 自动部署方案

这是一个基于Git Hook的轻量级自动部署方案，只需要 `git push` 就能自动部署到生产环境。

## 📋 部署流程

```
本地开发 → git commit → git push production main → 服务器自动部署
```

## ⚙️ 安装配置

### 1. 服务器端配置

#### 创建Git裸仓库
```bash
# SSH登录服务器
ssh user@your-server

# 创建目录
sudo mkdir -p /var/git/assaybio.git
sudo mkdir -p /var/www/html/assaybio
sudo mkdir -p /var/www/backups/assaybio

# 初始化裸仓库
cd /var/git/assaybio.git
sudo git init --bare

# 设置权限
sudo chown -R www-data:www-data /var/git/assaybio.git
sudo chown -R www-data:www-data /var/www/html/assaybio
sudo chown -R www-data:www-data /var/www/backups/assaybio
```

#### 安装Hook脚本
```bash
# 复制Hook脚本到服务器
scp deployment/post-receive-hook.sh user@your-server:/tmp/

# 在服务器上安装
sudo mv /tmp/post-receive-hook.sh /var/git/assaybio.git/hooks/post-receive
sudo chmod +x /var/git/assaybio.git/hooks/post-receive
sudo chown www-data:www-data /var/git/assaybio.git/hooks/post-receive
```

#### 配置Nginx
```bash
# 复制Nginx配置
scp deployment/nginx.conf user@your-server:/tmp/

# 在服务器上安装
sudo mv /tmp/nginx.conf /etc/nginx/sites-available/assaybio
sudo ln -s /etc/nginx/sites-available/assaybio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. 本地配置

#### 添加远程仓库
```bash
# 进入项目目录
cd /path/to/assaybio

# 添加生产服务器
git remote add production user@your-server:/var/git/assaybio.git

# 验证配置
git remote -v
```

#### 配置SSH密钥（如果还没有）
```bash
# 生成SSH密钥
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 复制公钥到服务器
ssh-copy-id user@your-server
```

## 🎯 使用方法

### 方法1：直接Git命令
```bash
# 提交代码
git add .
git commit -m "更新网站内容"

# 部署到生产环境
git push production main
```

### 方法2：使用部署脚本
```bash
# 给脚本执行权限
chmod +x deployment/deploy.sh

# 运行部署脚本
./deployment/deploy.sh
```

## 🔍 自动部署流程

Hook脚本会自动执行以下步骤：

1. **📥 检出代码** - 从Git仓库检出最新代码
2. **💾 创建备份** - 备份当前版本（保留最近5个）
3. **📦 安装依赖** - 运行 `npm ci`（如果有package.json）
4. **🔨 构建项目** - 运行 `npm run build`（如果配置了）
5. **📁 复制文件** - 将构建文件复制到网站目录
6. **🕷️  处理爬虫内容** - 复制爬虫下载的静态内容
7. **🔐 设置权限** - 设置正确的文件权限
8. **🔄 重载Nginx** - 测试并重载Nginx配置
9. **🏥 健康检查** - 检查网站是否正常运行
10. **📝 记录日志** - 记录部署日志

## 📁 目录结构

```
服务器端：
/var/git/assaybio.git/          # Git裸仓库
/var/www/html/assaybio/         # 网站文件
/var/www/backups/assaybio/      # 备份目录
/var/log/assaybio-deploy.log    # 部署日志

本地端：
deployment/
├── post-receive-hook.sh        # 服务器Hook脚本
├── setup-local-git.sh         # 本地Git配置脚本
├── deploy.sh                   # 一键部署脚本
├── nginx.conf                  # Nginx配置文件
└── README.md                   # 使用文档
```

## 🛠️ 故障排除

### 常见问题

#### 1. 权限错误
```bash
# 检查文件权限
sudo chown -R www-data:www-data /var/www/html/assaybio
sudo chmod -R 755 /var/www/html/assaybio
```

#### 2. Git Hook不执行
```bash
# 检查Hook脚本权限
sudo chmod +x /var/git/assaybio.git/hooks/post-receive
sudo chown www-data:www-data /var/git/assaybio.git/hooks/post-receive
```

#### 3. Nginx配置错误
```bash
# 测试Nginx配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

#### 4. Node.js构建失败
```bash
# 检查Node.js版本
node --version
npm --version

# 手动构建测试
cd /var/www/html/assaybio
npm install
npm run build
```

### 查看日志
```bash
# 部署日志
sudo tail -f /var/log/assaybio-deploy.log

# Nginx日志
sudo tail -f /var/log/nginx/assaybio.access.log
sudo tail -f /var/log/nginx/assaybio.error.log

# 系统日志
sudo journalctl -u nginx -f
```

## 📊 监控和维护

### 备份管理
- 自动备份保留最近5个版本
- 备份位置：`/var/www/backups/assaybio/`
- 手动备份：`sudo cp -r /var/www/html/assaybio /var/www/backups/assaybio/manual_$(date +%Y%m%d_%H%M%S)`

### 日志管理
```bash
# 清理旧日志（保留30天）
sudo find /var/log/nginx/ -name "*.log" -mtime +30 -delete

# 日志轮转配置
sudo vim /etc/logrotate.d/assaybio
```

### 性能监控
```bash
# 检查网站响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://your-domain.com/

# 监控磁盘空间
df -h /var/www/

# 监控内存使用
free -h
```

## 🔒 安全建议

1. **SSH密钥认证** - 禁用密码登录
2. **防火墙设置** - 只开放必要端口
3. **定期更新** - 及时更新系统和软件包
4. **SSL证书** - 配置HTTPS加密
5. **访问日志** - 定期检查访问日志

## 📞 支持

如果遇到问题，请：

1. 查看部署日志：`/var/log/assaybio-deploy.log`
2. 检查Nginx日志：`/var/log/nginx/assaybio.error.log`
3. 验证文件权限和目录结构
4. 测试手动构建流程

---

**🎉 现在您只需要 `git push production main` 就能自动部署网站了！**