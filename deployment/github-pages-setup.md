# 🚀 GitHub Pages 部署指南

## 一键部署到GitHub Pages

GitHub Pages是最简单的静态网站部署方案，完全免费！

## 📋 设置步骤

### 1. 推送代码到GitHub
```bash
# 如果还没有推送到GitHub
git add .
git commit -m "初始化AssayBio网站"
git branch -M main
git remote add origin https://github.com/your-username/assaybio.git
git push -u origin main
```

### 2. 启用GitHub Pages
1. 去GitHub仓库页面
2. 点击 **Settings** 标签
3. 在左侧找到 **Pages**
4. 在 **Source** 下选择：
   - **GitHub Actions** (推荐新方法)
   - 或 **Deploy from a branch** → **gh-pages**

### 3. 触发部署
```bash
# 只需要推送代码，就会自动部署
git add .
git commit -m "更新网站内容"
git push origin main
```

## 🌐 访问您的网站

部署完成后，您的网站将在以下地址访问：
```
https://your-username.github.io/assaybio/
```

## 🔧 自定义域名（可选）

### 1. 添加CNAME记录
在您的域名DNS设置中添加：
```
Type: CNAME
Name: www
Value: your-username.github.io
```

### 2. 在GitHub配置自定义域名
1. 进入仓库的 **Settings** → **Pages**
2. 在 **Custom domain** 输入：`www.assaybio.cn`
3. 勾选 **Enforce HTTPS**

### 3. 添加CNAME文件
```bash
echo "www.assaybio.cn" > CNAME
git add CNAME
git commit -m "添加自定义域名"
git push origin main
```

## 📁 项目结构建议

为了更好地管理GitHub Pages部署，建议以下结构：

```
assaybio/
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml      # GitHub Pages部署
│       └── deploy-gh-pages.yml   # 传统gh-pages部署
├── web/                          # 爬虫下载内容
│   └── assaybio_structured/     # 最新爬取结果
├── test_homepage_fixed/          # 测试内容
├── src/                          # 源代码（如果有）
├── deployment/                   # 部署配置
├── CNAME                        # 自定义域名
├── README.md
└── index.html                   # 网站入口
```

## 🔄 部署工作流程

### 方式1：直接部署爬虫内容
```bash
# 1. 运行爬虫获取最新内容
python web/web_crawler_v3.py http://www.assaybio.cn/ -d 5 -o web/latest

# 2. 提交并推送
git add .
git commit -m "更新网站内容"
git push origin main

# 3. GitHub Actions自动部署
```

### 方式2：本地构建后部署
```bash
# 1. 本地构建
npm run build  # 如果有构建脚本

# 2. 复制爬虫内容到构建目录
cp -r web/latest/* dist/

# 3. 推送代码，自动部署
git add .
git commit -m "更新并构建网站"
git push origin main
```

## ⚡ 优势对比

| 特性 | GitHub Pages | 自建服务器 |
|------|-------------|-----------|
| 💰 成本 | **免费** | 需要服务器费用 |
| 🛠️ 维护 | **零维护** | 需要维护 |
| 🔒 SSL | **自动HTTPS** | 需要配置 |
| 🌍 CDN | **全球CDN** | 需要配置 |
| 🚀 部署 | **git push即可** | 需要Hook脚本 |
| 📊 监控 | GitHub提供 | 需要自己配置 |
| 🔄 回滚 | Git历史回滚 | 需要备份策略 |

## 🎯 使用场景推荐

### GitHub Pages 适合：
- ✅ 静态网站（您的情况）
- ✅ 个人/企业展示站
- ✅ 文档站点
- ✅ 简单的企业官网
- ✅ 快速原型展示

### 自建服务器适合：
- 🔧 需要后端API
- 🔧 复杂的服务端逻辑
- 🔧 大文件存储
- 🔧 特殊的服务器配置

## 🚀 立即开始

**最简单的方法：**

1. **选择部署方式** - 推荐使用 `.github/workflows/deploy-pages.yml`

2. **设置GitHub Pages**：
   ```bash
   # 仓库 → Settings → Pages → Source → GitHub Actions
   ```

3. **推送代码**：
   ```bash
   git add .
   git commit -m "启用GitHub Pages"
   git push origin main
   ```

4. **等待部署** - 查看 Actions 标签页的部署进度

5. **访问网站** - `https://your-username.github.io/assaybio/`

**🎉 现在您只需要 `git push` 就能自动部署到全球CDN了！**

## 🔍 故障排除

### 常见问题：

1. **404错误** - 检查index.html是否在根目录
2. **Actions失败** - 查看Actions标签页的错误日志  
3. **自定义域名不生效** - 检查DNS设置和CNAME文件
4. **HTTPS证书问题** - 等待24小时自动配置

### 检查清单：

- ✅ 代码已推送到main分支
- ✅ GitHub Pages已在Settings中启用  
- ✅ 有index.html文件在根目录或构建输出目录
- ✅ Actions工作流程执行成功
- ✅ 域名DNS配置正确（如果使用自定义域名）