@echo off
chcp 65001 >nul
echo 🚀 开始部署网站到生产服务器 192.3.11.106...

REM 设置变量
set SERVER=192.3.11.106
set USER=root
set REMOTE_PATH=/var/www/html
set ARCHIVE_NAME=website-deploy.tar.gz

REM 检查SSH连接
echo 📡 检查服务器连接...
ssh -o ConnectTimeout=10 %USER%@%SERVER% "echo '服务器连接成功'"
if %ERRORLEVEL% neq 0 (
    echo ❌ 无法连接到服务器 %SERVER%
    pause
    exit /b 1
)

REM 创建临时部署目录
echo 📦 准备部署文件...
if exist deploy_temp (
    rd /s /q deploy_temp
)
mkdir deploy_temp

REM 复制需要的文件到临时目录
echo 📁 复制网站文件...
copy index.html deploy_temp\ >nul 2>&1
copy temp.json deploy_temp\ >nul 2>&1

if exist css (
    xcopy css deploy_temp\css\ /s /e /i >nul 2>&1
)
if exist js (
    xcopy js deploy_temp\js\ /s /e /i >nul 2>&1
)
if exist images (
    xcopy images deploy_temp\images\ /s /e /i >nul 2>&1
)
if exist icons (
    xcopy icons deploy_temp\icons\ /s /e /i >nul 2>&1
)

REM 复制apps/website/dist目录下的文件（如果存在）
if exist apps\website\dist (
    echo 📁 复制构建文件...
    xcopy apps\website\dist\* deploy_temp\ /s /e >nul 2>&1
)

REM 创建压缩包
echo 🗜️ 创建压缩包...
cd deploy_temp
tar -czf ../%ARCHIVE_NAME% *
cd ..

REM 检查压缩包是否创建成功
if not exist %ARCHIVE_NAME% (
    echo ❌ 压缩包创建失败
    rd /s /q deploy_temp
    pause
    exit /b 1
)

echo ✅ 压缩包创建成功: %ARCHIVE_NAME%

REM 备份服务器上的现有网站
echo 💾 备份服务器上的现有网站...
ssh %USER%@%SERVER% "if [ -d %REMOTE_PATH% ]; then tar -czf /tmp/website-backup-$(date +%%Y%%m%%d-%%H%%M%%S).tar.gz -C %REMOTE_PATH% .; echo '服务器备份完成'; fi"

REM 上传压缩包到服务器
echo 📤 上传文件到服务器...
scp %ARCHIVE_NAME% %USER%@%SERVER%:/tmp/

if %ERRORLEVEL% neq 0 (
    echo ❌ 文件上传失败
    rd /s /q deploy_temp
    del %ARCHIVE_NAME%
    pause
    exit /b 1
)

REM 在服务器上解压并部署
echo 📂 在服务器上解压并部署...
ssh %USER%@%SERVER% "
    # 确保目标目录存在
    mkdir -p %REMOTE_PATH%
    
    # 清空现有网站文件（保留备份）
    rm -rf %REMOTE_PATH%/*
    
    # 解压新文件
    tar -xzf /tmp/%ARCHIVE_NAME% -C %REMOTE_PATH%/
    
    # 设置正确的权限
    chown -R www-data:www-data %REMOTE_PATH%/ 2>/dev/null || chown -R apache:apache %REMOTE_PATH%/ 2>/dev/null || echo '权限设置跳过'
    chmod -R 755 %REMOTE_PATH%/
    find %REMOTE_PATH% -type f -exec chmod 644 {} \;
    
    # 清理临时文件
    rm -f /tmp/%ARCHIVE_NAME%
    
    echo '部署完成'
"

if %ERRORLEVEL% neq 0 (
    echo ❌ 服务器部署失败
    rd /s /q deploy_temp
    del %ARCHIVE_NAME%
    pause
    exit /b 1
)

REM 重启Web服务器
echo 🔄 重启Web服务器...
ssh %USER%@%SERVER% "
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx
        echo 'Nginx已重新载入'
    elif systemctl is-active --quiet apache2; then
        systemctl reload apache2
        echo 'Apache已重新载入'
    elif systemctl is-active --quiet httpd; then
        systemctl reload httpd
        echo 'Apache(httpd)已重新载入'
    else
        echo 'Web服务器状态未知，请手动检查'
    fi
"

REM 清理本地临时文件
echo 🧹 清理临时文件...
rd /s /q deploy_temp
del %ARCHIVE_NAME%

echo 🎉 部署完成！
echo 🌐 网站地址: http://%SERVER%:6500
echo ✅ 请访问网站确认部署是否成功

pause