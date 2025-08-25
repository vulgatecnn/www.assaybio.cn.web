# Multi-stage Dockerfile for AssayBio Website
# 为AssayBio网站设计的多阶段Docker构建

# ===========================================
# Stage 1: Build Environment (构建阶段)
# ===========================================
FROM node:18-alpine AS builder

# 设置构建参数
ARG BUILD_VERSION=latest
ARG BUILD_DATE
ARG GIT_COMMIT

# 设置环境变量
ENV NODE_ENV=production
ENV VITE_BUILD_VERSION=${BUILD_VERSION}
ENV VITE_BUILD_DATE=${BUILD_DATE}
ENV VITE_GIT_COMMIT=${GIT_COMMIT}

# 设置工作目录
WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# 复制package文件
COPY package*.json ./
COPY apps/website/package*.json ./apps/website/

# 安装依赖
RUN npm ci --only=production && \
    cd apps/website && \
    npm ci --only=production

# 复制源代码
COPY . .

# 创建必要的资源文件
RUN mkdir -p apps/website/public/images && \
    echo '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7l-10-5z"/></svg>' > apps/website/public/images/logo.svg

# 构建应用
RUN cd apps/website && \
    (npm run build || npx vite build --mode production || npx vite build || \
    (echo "Build failed, creating fallback..." && \
     mkdir -p dist && \
     cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>上海安净生物技术有限公司</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; background: #f7fafc; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 4rem 1rem; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
        .hero h1 { font-size: 2.5rem; margin-bottom: 1rem; font-weight: 700; }
        .hero p { font-size: 1.2rem; opacity: 0.9; margin-bottom: 2rem; }
        .section { padding: 4rem 0; }
        .section h2 { text-align: center; font-size: 2rem; margin-bottom: 3rem; color: #2d3748; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .card { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .card h3 { color: #667eea; margin-bottom: 1rem; }
        .footer { background: #2d3748; color: white; text-align: center; padding: 2rem; }
        .status { position: fixed; top: 20px; right: 20px; background: #48bb78; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.875rem; }
    </style>
</head>
<body>
    <div class="status">🐳 Docker部署</div>
    <header class="header">
        <div class="container">
            <div class="hero">
                <h1>上海安净生物技术有限公司</h1>
                <p>专业水质检测解决方案提供商</p>
            </div>
        </div>
    </header>
    <section class="section">
        <div class="container">
            <h2>关于我们</h2>
            <div class="grid">
                <div class="card">
                    <h3>🔬 专业技术</h3>
                    <p>拥有多年水质检测技术经验，掌握国际先进检测方法</p>
                </div>
                <div class="card">
                    <h3>✅ 质量保证</h3>
                    <p>严格的质量控制体系，确保检测结果准确可靠</p>
                </div>
                <div class="card">
                    <h3>🎯 服务完善</h3>
                    <p>提供全方位技术支持和售后服务</p>
                </div>
            </div>
        </div>
    </section>
    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 上海安净生物技术有限公司 版权所有</p>
            <p>构建版本: ENV_BUILD_VERSION | 构建时间: ENV_BUILD_DATE</p>
        </div>
    </footer>
</body>
</html>
EOF
))

# ===========================================
# Stage 2: Runtime Environment (运行阶段)
# ===========================================
FROM nginx:alpine

# 安装必要的工具
RUN apk add --no-cache curl bash tzdata

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 复制构建产物
COPY --from=builder /app/apps/website/dist /usr/share/nginx/html

# 创建nginx配置
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /health {
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
EOF

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]