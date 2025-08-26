# 上海安净生物技术有限公司网站项目

## 项目概述

这是上海安净生物技术有限公司的官方网站项目，专注于水中微生物检测技术及方法的研发、引进和推广。

## 项目结构

```
D:\vulgate\code\trea\assaybio111\
├── apps\
│   └── website\          # 网站源码和构建文件
│       ├── dist\         # 构建后的生产文件
│       ├── src\          # 源代码
│       ├── public\       # 静态资源
│       └── temp.json     # 网站数据配置
├── images\               # 图片资源
├── js\                   # JavaScript文件
├── css\                  # 样式文件
└── index.html           # 首页文件
```

## 部署配置

### SSH部署到生产服务器

**服务器信息：**
- 服务器IP: `192.3.11.106:6500`
- 部署方式: SSH + rsync
- 部署目录: `/var/www/html/` (需根据实际服务器配置调整)

### 部署脚本

#### 1. 手动部署命令

```bash
# 构建生产版本
cd "D:\vulgate\code\trea\assaybio111"

# 使用SSH部署到服务器
# 注意：需要提前配置SSH密钥或用户名密码
# 将网站文件同步到服务器
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude 'temp.json' \
  ./ root@192.3.11.106:/var/www/html/

# 或者使用scp命令
# scp -r apps/website/dist/* root@192.3.11.106:/var/www/html/
```

#### 2. 部署脚本文件

创建 `deploy.sh` 脚本：

```bash
#!/bin/bash

# 网站部署脚本
# 部署到: 192.3.11.106

set -e  # 遇到错误时停止执行

echo "🚀 开始部署网站到生产服务器..."

# 检查服务器连接
echo "📡 检查服务器连接..."
if ! ssh -o ConnectTimeout=10 root@192.3.11.106 "echo '服务器连接成功'"; then
    echo "❌ 无法连接到服务器 192.3.11.106"
    exit 1
fi

# 备份当前网站（可选）
echo "💾 创建服务器备份..."
ssh root@192.3.11.106 "
    if [ -d /var/www/html ]; then
        tar -czf /var/backups/website-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /var/www html/
        echo '✅ 备份完成'
    fi
"

# 同步文件到服务器
echo "📤 同步文件到服务器..."
rsync -avz --delete \
    --progress \
    --exclude 'node_modules/' \
    --exclude '.git/' \
    --exclude '*.log' \
    --exclude 'apps/website/src/' \
    --exclude 'apps/website/tests/' \
    --exclude 'apps/website/node_modules/' \
    --exclude 'test_*/' \
    --exclude 'tools/' \
    --exclude 'web/backup_site/' \
    --exclude '.env*' \
    ./ root@192.3.11.106:/var/www/html/

# 设置正确的文件权限
echo "🔐 设置文件权限..."
ssh root@192.3.11.106 "
    chown -R www-data:www-data /var/www/html/
    chmod -R 755 /var/www/html/
    chmod -R 644 /var/www/html/*.html /var/www/html/*.json
"

# 重启Web服务器（如果需要）
echo "🔄 重启Web服务器..."
ssh root@192.3.11.106 "
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx
        echo '✅ Nginx已重新载入'
    elif systemctl is-active --quiet apache2; then
        systemctl reload apache2
        echo '✅ Apache已重新载入'
    fi
"

echo "🎉 部署完成！"
echo "🌐 网站地址: http://192.3.11.106"
```

#### 3. Windows批处理部署脚本

创建 `deploy.bat` 脚本：

```batch
@echo off
echo 🚀 开始部署网站到生产服务器...

REM 检查SSH连接
echo 📡 检查服务器连接...
ssh -o ConnectTimeout=10 root@192.3.11.106 "echo '服务器连接成功'"
if %ERRORLEVEL% neq 0 (
    echo ❌ 无法连接到服务器 192.3.11.106
    pause
    exit /b 1
)

REM 同步文件
echo 📤 同步文件到服务器...
rsync -avz --delete --progress ^
    --exclude "node_modules/" ^
    --exclude ".git/" ^
    --exclude "*.log" ^
    --exclude "apps/website/src/" ^
    --exclude "apps/website/tests/" ^
    --exclude "test_*/" ^
    --exclude "tools/" ^
    ./ root@192.3.11.106:/var/www/html/

if %ERRORLEVEL% neq 0 (
    echo ❌ 文件同步失败
    pause
    exit /b 1
)

REM 设置权限
echo 🔐 设置文件权限...
ssh root@192.3.11.106 "chown -R www-data:www-data /var/www/html/ && chmod -R 755 /var/www/html/"

echo 🎉 部署完成！
echo 🌐 网站地址: http://192.3.11.106
pause
```

### SSH配置要求

#### 1. SSH密钥配置

```bash
# 生成SSH密钥（如果还没有）
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 将公钥复制到服务器
ssh-copy-id root@192.3.11.106

# 或手动复制公钥
cat ~/.ssh/id_rsa.pub | ssh root@192.3.11.106 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

#### 2. SSH配置文件 (~/.ssh/config)

```
Host assaybio-server
    HostName 192.3.11.106
    User root
    Port 22
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no
```

### 使用说明

1. **首次部署前准备：**
   ```bash
   # 确保可以SSH连接到服务器
   ssh root@192.3.11.106
   
   # 确保服务器已安装web服务器(nginx/apache)
   # 确保部署目录存在并有正确权限
   ```

2. **执行部署：**
   ```bash
   # Linux/Mac
   chmod +x deploy.sh
   ./deploy.sh
   
   # Windows
   deploy.bat
   ```

3. **验证部署：**
   - 访问: http://192.3.11.106
   - 检查网站是否正常加载
   - 确认修改的内容已更新

### 注意事项

- 确保服务器192.3.11.106已配置Web服务器（Nginx/Apache）
- 确保SSH密钥已正确配置，可以无密码登录
- 部署前建议先在测试环境验证
- 重要：生产部署前请确保备份现有网站文件
- temp.json文件包含网站配置数据，部署时会被排除以避免覆盖服务器上的配置

### 故障排查

1. **SSH连接失败：**
   - 检查服务器IP是否正确
   - 确认SSH端口（默认22）
   - 验证SSH密钥配置

2. **权限问题：**
   - 确保有服务器写入权限
   - 检查web服务器用户权限

3. **文件同步失败：**
   - 检查rsync是否已安装
   - 确认网络连接稳定
   - 检查服务器磁盘空间

## 最近更新

- 删除济南技术服务部信息
- 清空产品体系数据
- 更新主公司电话为 400-616-3053
- 修改公司地址为：上海市闵行区紫秀路100号 虹桥总部1号4栋6E
- 保持上海、北京办事处原有电话号码