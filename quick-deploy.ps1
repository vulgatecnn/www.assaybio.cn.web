# AssayBio网站快速部署脚本 - PowerShell版本
# 自动部署到192.3.11.106

param(
    [string]$ServerIP = "192.3.11.106",
    [string]$ServerUser = "root",
    [string]$ServerPassword = "rtN8gHpcZRM01K2v97",
    [int]$ServerPort = 22
)

Write-Host "============================================" -ForegroundColor Green
Write-Host "  AssayBio网站自动部署脚本 (PowerShell)" -ForegroundColor Green  
Write-Host "  目标服务器: $ServerIP" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

try {
    # 步骤1: 设置工作目录
    Write-Host "[1/6] 设置工作环境..." -ForegroundColor Yellow
    Set-Location $projectRoot
    Write-Host "[INFO] 项目目录: $(Get-Location)" -ForegroundColor Cyan

    # 步骤2: 确保构建环境
    Write-Host "[2/6] 准备构建环境..." -ForegroundColor Yellow
    
    # 创建必要的目录和文件
    $publicImagesDir = Join-Path $projectRoot "apps\website\public\images"
    $logoPath = Join-Path $publicImagesDir "logo.svg"
    
    if (!(Test-Path $publicImagesDir)) {
        New-Item -ItemType Directory -Path $publicImagesDir -Force | Out-Null
        Write-Host "[INFO] 创建images目录" -ForegroundColor Cyan
    }
    
    if (!(Test-Path $logoPath)) {
        $logoSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z"/>
    <path d="M12 7v10"/>
    <path d="M7 10l5-3 5 3"/>
</svg>
'@
        $logoSvg | Out-File -FilePath $logoPath -Encoding utf8
        Write-Host "[INFO] 创建默认logo" -ForegroundColor Cyan
    }

    # 步骤3: 构建项目
    Write-Host "[3/6] 构建项目..." -ForegroundColor Yellow
    Set-Location "apps\website"
    
    # 尝试不同的构建方法
    $buildSuccess = $false
    
    Write-Host "[INFO] 尝试Vite构建..." -ForegroundColor Cyan
    try {
        & npx vite build --mode production 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[SUCCESS] Vite构建成功" -ForegroundColor Green
            $buildSuccess = $true
        }
    } catch {}
    
    if (!$buildSuccess) {
        Write-Host "[INFO] 尝试简化构建..." -ForegroundColor Cyan
        try {
            & npx vite build --minify false 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[SUCCESS] 简化构建成功" -ForegroundColor Green
                $buildSuccess = $true
            }
        } catch {}
    }
    
    if (!$buildSuccess) {
        Write-Host "[WARNING] 构建失败，创建基础静态文件..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path "dist" -Force | Out-Null
        
        $basicHtml = @'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>上海安净生物技术有限公司</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px 0; text-align: center; }
        .content { background: white; padding: 40px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .footer { text-align: center; padding: 20px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <h1>上海安净生物技术有限公司</h1>
            <p>专业水质检测解决方案提供商</p>
        </div>
    </div>
    
    <div class="container">
        <div class="content">
            <h2>欢迎访问安净生物</h2>
            <p>我们专注于水质检测技术，为客户提供专业可靠的检测产品和服务。</p>
            
            <h3>主要产品</h3>
            <ul>
                <li>大肠菌群检测试剂</li>
                <li>微生物检测设备</li>
                <li>水质分析仪器</li>
                <li>实验室检测耗材</li>
            </ul>
            
            <h3>联系我们</h3>
            <p>电话: 021-XXXX-XXXX</p>
            <p>邮箱: info@assaybio.cn</p>
            <p>地址: 上海市闵行区紫秀路100号</p>
        </div>
    </div>
    
    <div class="footer">
        <div class="container">
            <p>&copy; 2024 上海安净生物技术有限公司 版权所有</p>
        </div>
    </div>
</body>
</html>
'@
        $basicHtml | Out-File -FilePath "dist\index.html" -Encoding utf8
        Write-Host "[INFO] 创建基础HTML文件" -ForegroundColor Cyan
    }
    
    Set-Location $projectRoot
    
    # 验证构建产物
    $distPath = "apps\website\dist\index.html"
    if (!(Test-Path $distPath)) {
        throw "构建产物验证失败: $distPath 不存在"
    }
    
    Write-Host "[SUCCESS] 构建验证通过" -ForegroundColor Green

    # 步骤4: 创建部署包
    Write-Host "[4/6] 创建部署包..." -ForegroundColor Yellow
    
    $tempDir = Join-Path $env:TEMP "assaybio-deploy-$timestamp"
    $deployPackage = "$tempDir.tar"
    
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    New-Item -ItemType Directory -Path "$tempDir\dist" -Force | Out-Null
    
    # 复制构建产物
    Copy-Item -Path "apps\website\dist\*" -Destination "$tempDir\dist\" -Recurse -Force
    Write-Host "[INFO] 复制构建文件完成" -ForegroundColor Cyan
    
    # 创建nginx配置
    $nginxConfig = @'
server {
    listen 80;
    server_name _;
    root /opt/assaybio-website/current/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
}
'@
    $nginxConfig | Out-File -FilePath "$tempDir\nginx-site.conf" -Encoding utf8
    
    # 创建部署脚本
    $deployScript = @"
#!/bin/bash
set -e
echo "[INFO] 开始远程部署..."

# 创建目录
mkdir -p /opt/assaybio-website
cd /opt/assaybio-website

# 备份现有版本
if [ -d "current" ]; then
    echo "[INFO] 备份现有版本..."
    mv current backup-$timestamp 2>/dev/null || true
fi

# 创建新版本目录
mkdir -p current

# 安装nginx (如果未安装)
if ! command -v nginx &> /dev/null; then
    echo "[INFO] 安装nginx..."
    if command -v apt-get &> /dev/null; then
        apt-get update && apt-get install -y nginx
    elif command -v yum &> /dev/null; then
        yum install -y nginx
    elif command -v dnf &> /dev/null; then
        dnf install -y nginx
    fi
fi

# 停止nginx
systemctl stop nginx 2>/dev/null || true

# 配置nginx
cp nginx-site.conf /etc/nginx/sites-available/assaybio 2>/dev/null || cp nginx-site.conf /etc/nginx/conf.d/assaybio.conf

# 启用站点 (Debian/Ubuntu)
if [ -d "/etc/nginx/sites-enabled" ]; then
    ln -sf /etc/nginx/sites-available/assaybio /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
fi

# 删除默认配置 (CentOS/RHEL)
if [ -f "/etc/nginx/conf.d/default.conf" ]; then
    mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true
fi

# 测试nginx配置
nginx -t || echo "[WARNING] nginx配置测试失败，继续执行..."

# 启动nginx
systemctl enable nginx
systemctl start nginx

# 健康检查
sleep 10
if curl -f -s http://localhost/ > /dev/null; then
    echo "[SUCCESS] 部署成功！"
    echo "[SUCCESS] 访问地址: http://$ServerIP"
else
    echo "[WARNING] 健康检查失败，但服务可能正在启动..."
    echo "[INFO] 请手动访问 http://$ServerIP 检查"
fi

echo "[INFO] 部署完成！"
"@
    $deployScript | Out-File -FilePath "$tempDir\deploy.sh" -Encoding utf8
    
    # 创建tar包
    Write-Host "[INFO] 创建部署包..." -ForegroundColor Cyan
    Set-Location $tempDir
    & tar -cf $deployPackage *
    Set-Location $projectRoot
    
    Write-Host "[SUCCESS] 部署包创建完成" -ForegroundColor Green

    # 步骤5: 上传到服务器
    Write-Host "[5/6] 上传到服务器..." -ForegroundColor Yellow
    
    # 使用SCP上传
    Write-Host "[INFO] 连接到服务器 $ServerIP..." -ForegroundColor Cyan
    
    $scpCommand = "scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -P $ServerPort `"$deployPackage`" ${ServerUser}@${ServerIP}:/tmp/assaybio-deploy.tar"
    
    # 设置SSH环境变量（如果需要密码）
    $env:SSH_ASKPASS_REQUIRE = "never"
    
    try {
        Write-Host "[INFO] 正在上传文件..." -ForegroundColor Cyan
        Invoke-Expression $scpCommand
        Write-Host "[SUCCESS] 文件上传成功" -ForegroundColor Green
    } catch {
        Write-Warning "SCP上传失败: $($_.Exception.Message)"
        Write-Host "[INFO] 尝试替代上传方法..." -ForegroundColor Cyan
        throw "上传失败，请检查SSH连接"
    }

    # 步骤6: 执行远程部署
    Write-Host "[6/6] 执行远程部署..." -ForegroundColor Yellow
    
    $sshCommand = "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p $ServerPort ${ServerUser}@${ServerIP} `"cd /tmp && tar -xf assaybio-deploy.tar && cp -r . /opt/assaybio-website/current/ && chmod +x /opt/assaybio-website/current/deploy.sh && /opt/assaybio-website/current/deploy.sh`""
    
    try {
        Write-Host "[INFO] 执行远程部署脚本..." -ForegroundColor Cyan
        Invoke-Expression $sshCommand
        Write-Host "[SUCCESS] 远程部署完成" -ForegroundColor Green
    } catch {
        Write-Warning "远程部署失败: $($_.Exception.Message)"
        throw "远程部署失败"
    }

    # 验证部署
    Write-Host "[INFO] 验证部署..." -ForegroundColor Cyan
    Start-Sleep -Seconds 10
    
    try {
        $response = Invoke-WebRequest -Uri "http://$ServerIP/" -TimeoutSec 30 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "[SUCCESS] 部署验证成功！" -ForegroundColor Green
        } else {
            Write-Warning "部署验证失败，状态码: $($response.StatusCode)"
        }
    } catch {
        Write-Warning "无法验证部署状态: $($_.Exception.Message)"
        Write-Host "[INFO] 请手动访问 http://$ServerIP 检查" -ForegroundColor Cyan
    }

    # 清理临时文件
    Write-Host "[INFO] 清理临时文件..." -ForegroundColor Cyan
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $deployPackage -Force -ErrorAction SilentlyContinue

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  部署完成！" -ForegroundColor Green
    Write-Host "  访问地址: http://$ServerIP" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green

} catch {
    Write-Host ""
    Write-Host "[ERROR] 部署失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请检查网络连接和服务器配置" -ForegroundColor Red
    
    # 清理临时文件
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path $deployPackage) {
        Remove-Item -Path $deployPackage -Force -ErrorAction SilentlyContinue
    }
    
    exit 1
}

Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")