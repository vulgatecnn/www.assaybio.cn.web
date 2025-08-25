#!/bin/bash

# AssayBio 本地Git配置脚本

echo "🔧 配置本地Git远程仓库..."

# 1. 添加生产服务器远程仓库
echo "📡 添加生产服务器..."
git remote add production user@your-server.com:/var/git/assaybio.git

# 如果已存在，则更新
git remote set-url production user@your-server.com:/var/git/assaybio.git

# 2. 添加开发服务器（可选）
echo "🧪 添加开发服务器（可选）..."
# git remote add staging user@staging-server.com:/var/git/assaybio-staging.git

# 3. 查看远程仓库配置
echo "📋 当前远程仓库配置:"
git remote -v

echo ""
echo "✅ Git配置完成！"
echo ""
echo "📖 使用说明："
echo "  部署到生产环境: git push production main"
echo "  部署到开发环境: git push staging main"
echo ""
echo "⚠️  请确保："
echo "  1. SSH密钥已配置"
echo "  2. 服务器用户名和地址正确"
echo "  3. 服务器端Hook脚本已安装"
echo ""