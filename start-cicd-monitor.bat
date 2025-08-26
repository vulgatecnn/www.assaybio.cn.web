@echo off
echo 🚀 启动GitHub CI/CD状态监控...
echo.
echo 📂 仓库: vulgatecnn/www.assaybio.cn.web
echo 🌐 服务器: http://192.3.11.106:6500/
echo ⏱️  检查间隔: 30秒
echo.
echo 按 Ctrl+C 停止监控
echo ===================================
echo.

node monitor-cicd-status.js

pause