# 企业级多阶段Dockerfile for AssayBio Website
# 优化的生产环境容器构建配置

# ===========================================
# Stage 1: 依赖安装阶段
# ===========================================
FROM node:18-alpine AS deps

# 安全用户创建
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# 只复制package文件用于依赖安装
COPY apps/website/package*.json ./
COPY package*.json ./

# 安装依赖（优化缓存）
RUN npm ci --only=production --no-audit --prefer-offline && \
    npm cache clean --force

# ===========================================
# Stage 2: 构建阶段
# ===========================================
FROM node:18-alpine AS builder

# 设置构建参数和环境
ARG BUILD_VERSION=latest
ARG BUILD_DATE
ARG GIT_COMMIT
ARG NODE_ENV=production

ENV NODE_ENV=${NODE_ENV}
ENV VITE_BUILD_VERSION=${BUILD_VERSION}
ENV VITE_BUILD_DATE=${BUILD_DATE}
ENV VITE_GIT_COMMIT=${GIT_COMMIT}
ENV CI=true

WORKDIR /app

# 复制依赖和源码
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY apps/website/ ./apps/website/
COPY package*.json ./

# 安装构建依赖
RUN apk add --no-cache python3 make g++ git

# 安装项目依赖
RUN cd apps/website && npm ci --include=dev --no-audit

# 构建优化
RUN cd apps/website && \
    npm run type-check && \
    npm run build

# 验证构建产物
RUN ls -la apps/website/dist/ && \
    test -f apps/website/dist/index.html || exit 1

# ===========================================
# Stage 3: 运行时阶段
# ===========================================
FROM nginx:1.25-alpine AS production

# 元数据标签
LABEL maintainer="devops@assaybio.com" \
      version="${BUILD_VERSION}" \
      description="AssayBio企业级网站生产容器" \
      org.opencontainers.image.title="AssayBio Website" \
      org.opencontainers.image.description="上海安净生物技术有限公司官方网站" \
      org.opencontainers.image.vendor="上海安净生物技术有限公司"

# 安装运行时依赖和安全工具
RUN apk add --no-cache \
        curl \
        bash \
        tzdata \
        ca-certificates \
        dumb-init \
    && rm -rf /var/cache/apk/*

# 安全配置：创建非root用户
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-app nginx-app

# 时区设置
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建必要的目录
RUN mkdir -p /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/cache/nginx /var/log/nginx /var/run/nginx.pid

# 复制构建产物
COPY --from=builder --chown=nginx-app:nginx-app /app/apps/website/dist /usr/share/nginx/html

# 优化的Nginx配置
RUN cat > /etc/nginx/nginx.conf << 'EOF'
user nginx-app;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for" '
                   'rt=$request_time uct="$upstream_connect_time" '
                   'uht="$upstream_header_time" urt="$upstream_response_time"';
    
    access_log /var/log/nginx/access.log main;
    
    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 16M;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        application/javascript
        application/json
        application/xml+rss
        application/atom+xml
        image/svg+xml
        text/plain
        text/css
        text/xml
        text/javascript;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'self';" always;
    
    include /etc/nginx/conf.d/*.conf;
}
EOF

# 站点配置
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    
    # 安全配置
    server_tokens off;
    
    # 健康检查端点
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # 静态资源缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
        access_log off;
    }
    
    # SPA路由支持
    location / {
        try_files $uri $uri/ @fallback;
        add_header Cache-Control "no-cache";
    }
    
    location @fallback {
        rewrite ^.*$ /index.html last;
    }
    
    # API代理（如果需要）
    location /api/ {
        proxy_pass http://backend:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # 错误页面
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# 健康检查脚本
RUN cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash
set -e

# 检查Nginx进程
if ! pgrep nginx > /dev/null; then
    echo "Nginx进程未运行"
    exit 1
fi

# 检查HTTP响应
if ! curl -f http://localhost/health > /dev/null 2>&1; then
    echo "健康检查端点无响应"
    exit 1
fi

# 检查主页面
if ! curl -f http://localhost/ > /dev/null 2>&1; then
    echo "主页面无响应"
    exit 1
fi

echo "健康检查通过"
exit 0
EOF

RUN chmod +x /usr/local/bin/health-check.sh

# 启动脚本
RUN cat > /usr/local/bin/docker-entrypoint.sh << 'EOF'
#!/bin/bash
set -e

# 检查配置文件
nginx -t

# 创建PID文件
touch /var/run/nginx.pid
chown nginx-app:nginx-app /var/run/nginx.pid

echo "启动AssayBio网站容器..."
echo "构建版本: ${VITE_BUILD_VERSION:-unknown}"
echo "构建日期: ${VITE_BUILD_DATE:-unknown}"
echo "Git提交: ${VITE_GIT_COMMIT:-unknown}"

# 使用dumb-init作为PID 1
exec dumb-init nginx -g "daemon off;"
EOF

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 环境变量
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD /usr/local/bin/health-check.sh

# 切换到非root用户
USER nginx-app

# 暴露端口
EXPOSE 80

# 入口点
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
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
    }

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