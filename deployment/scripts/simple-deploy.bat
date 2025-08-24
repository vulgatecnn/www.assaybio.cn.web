@echo off
:: AssayBio简单部署脚本 - Windows版本
:: 部署到192.3.11.106服务器

echo [INFO] 开始AssayBio网站自动部署...

:: 配置变量
set SERVER_IP=192.3.11.106
set SERVER_USER=root
set SERVER_PORT=22
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

:: 检查必要工具
echo [INFO] 检查必要工具...
where ssh >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] SSH不可用，请安装OpenSSH或Git Bash
    pause
    exit /b 1
)

where scp >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] SCP不可用，请安装OpenSSH或Git Bash
    pause
    exit /b 1
)

:: 进入项目目录
cd /d "%~dp0\..\.."
echo [INFO] 项目目录: %cd%

:: 尝试构建项目
echo [INFO] 开始构建项目...

:: 尝试不同的构建命令
npm run build 2>nul
if %errorlevel% equ 0 (
    echo [INFO] 使用npm run build构建成功
    goto :build_success
)

cd apps\website
npm run build 2>nul
if %errorlevel% equ 0 (
    echo [INFO] 在website目录构建成功
    cd ..\..
    goto :build_success
)

:: 尝试直接使用vite构建
npx vite build 2>nul
if %errorlevel% equ 0 (
    echo [INFO] 使用vite build构建成功
    cd ..\..
    goto :build_success
)

echo [ERROR] 构建失败，请检查构建配置
pause
exit /b 1

:build_success
echo [INFO] 项目构建完成

:: 创建部署包
echo [INFO] 创建部署包...
set TEMP_DIR=%TEMP%\assaybio-deploy-%TIMESTAMP%
set DEPLOY_PACKAGE=%TEMP%\assaybio-deploy-%TIMESTAMP%.zip

mkdir "%TEMP_DIR%" 2>nul

:: 复制构建产物
if exist "apps\website\dist" (
    echo [INFO] 复制website/dist目录...
    xcopy /E /Y "apps\website\dist" "%TEMP_DIR%\dist\"
) else if exist "dist" (
    echo [INFO] 复制dist目录...
    xcopy /E /Y "dist" "%TEMP_DIR%\dist\"
) else (
    echo [ERROR] 找不到构建产物目录
    pause
    exit /b 1
)

:: 复制部署配置
if exist "deployment\docker" (
    xcopy /E /Y "deployment\docker" "%TEMP_DIR%\docker\"
)

:: 创建部署脚本
echo [INFO] 创建远程部署脚本...
(
echo #!/bin/bash
echo set -e
echo echo "[INFO] 开始远程部署..."
echo.
echo # 创建目录
echo mkdir -p /opt/assaybio-website
echo cd /opt/assaybio-website
echo.
echo # 备份现有版本
echo if [ -d "current" ]; then
echo     echo "[INFO] 备份现有版本..."
echo     mv current backup-%TIMESTAMP% 2^>/dev/null ^|^| true
echo fi
echo.
echo # 创建新版本目录
echo mkdir -p current
echo cd current
echo.
echo # 检查并安装nginx
echo if ! command -v nginx ^&^> /dev/null; then
echo     echo "[INFO] 安装nginx..."
echo     if command -v apt-get ^&^> /dev/null; then
echo         apt-get update ^&^& apt-get install -y nginx
echo     elif command -v yum ^&^> /dev/null; then
echo         yum install -y nginx
echo     fi
echo fi
echo.
echo # 配置nginx
echo cat ^> /etc/nginx/sites-available/assaybio ^<^< 'NGINXCONF'
echo server {
echo     listen 80;
echo     server_name _;
echo     root /opt/assaybio-website/current;
echo     index index.html;
echo.
echo     location / {
echo         try_files $uri $uri/ /index.html;
echo     }
echo.
echo     location ~* \.\(css^|js^|png^|jpg^|jpeg^|gif^|ico^|svg\)$ {
echo         expires 1y;
echo         add_header Cache-Control "public, immutable";
echo     }
echo }
echo NGINXCONF
echo.
echo # 启用站点
echo ln -sf /etc/nginx/sites-available/assaybio /etc/nginx/sites-enabled/ 2^>/dev/null ^|^| true
echo rm -f /etc/nginx/sites-enabled/default 2^>/dev/null ^|^| true
echo.
echo # 测试nginx配置
echo nginx -t
echo.
echo # 重启nginx
echo systemctl enable nginx
echo systemctl restart nginx
echo.
echo # 健康检查
echo sleep 5
echo if curl -f -s http://localhost/ ^> /dev/null; then
echo     echo "[INFO] 部署成功！"
echo     echo "[INFO] 访问地址: http://%SERVER_IP%"
echo else
echo     echo "[WARNING] 健康检查失败，请检查服务状态"
echo fi
echo.
echo echo "[INFO] 部署完成！"
) > "%TEMP_DIR%\remote-deploy.sh"

:: 打包文件（使用PowerShell压缩）
echo [INFO] 打包文件...
powershell -command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%DEPLOY_PACKAGE%'"

:: 检查SSH连接
echo [INFO] 检查SSH连接...
ssh -o ConnectTimeout=10 -p %SERVER_PORT% %SERVER_USER%@%SERVER_IP% "echo 'SSH连接成功'" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] SSH连接失败，请检查：
    echo 1. 服务器IP: %SERVER_IP%
    echo 2. 用户名: %SERVER_USER%
    echo 3. SSH密钥配置
    echo 4. 网络连接
    pause
    exit /b 1
)

:: 上传部署包
echo [INFO] 上传部署包到服务器...
scp -P %SERVER_PORT% "%DEPLOY_PACKAGE%" %SERVER_USER%@%SERVER_IP%:/tmp/assaybio-deploy.zip
if %errorlevel% neq 0 (
    echo [ERROR] 文件上传失败
    pause
    exit /b 1
)

:: 远程执行部署
echo [INFO] 执行远程部署...
ssh -p %SERVER_PORT% %SERVER_USER%@%SERVER_IP% "cd /tmp && unzip -o assaybio-deploy.zip && cp -r * /opt/assaybio-website/current/ && chmod +x /opt/assaybio-website/current/remote-deploy.sh && /opt/assaybio-website/current/remote-deploy.sh && rm -f assaybio-deploy.zip"

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] ================================
    echo [SUCCESS] 部署完成！
    echo [SUCCESS] 访问地址: http://%SERVER_IP%
    echo [SUCCESS] ================================
    echo.
) else (
    echo [ERROR] 远程部署失败
)

:: 清理临时文件
echo [INFO] 清理临时文件...
rmdir /s /q "%TEMP_DIR%" 2>nul
del "%DEPLOY_PACKAGE%" 2>nul

echo [INFO] 部署流程完成
pause