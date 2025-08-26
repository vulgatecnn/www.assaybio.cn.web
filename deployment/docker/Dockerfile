# AssayBio 官网 - 企业级多阶段Docker构建
# 针对Vue.js静态网站优化的生产就绪配置

# ====================
# 基础镜像阶段
# ====================
FROM node:18-alpine AS base
WORKDIR /app

# 安装系统依赖和安全更新
RUN apk update && apk upgrade && \
    apk add --no-cache \
    ca-certificates \
    tzdata && \
    rm -rf /var/cache/apk/*

# 设置时区
ENV TZ=Asia/Shanghai

# ====================
# 依赖安装阶段
# ====================
FROM base AS dependencies

# 优化npm配置
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000

# 复制package文件并安装依赖
COPY package*.json ./
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# ====================
# 构建阶段
# ====================
FROM dependencies AS builder

# 安装开发依赖
RUN npm ci --no-audit --no-fund

# 复制源代码
COPY . .

# 构建生产版本
ENV NODE_ENV=production
RUN npm run build && \
    npm run optimize && \
    ls -la dist/

# 清理不必要的文件
RUN rm -rf node_modules src tests docs .git* *.md

# ====================
# Nginx基础配置阶段
# ====================
FROM nginx:1.24-alpine AS nginx-base

# 安装额外工具
RUN apk add --no-cache \
    curl \
    ca-certificates \
    tzdata \
    logrotate && \
    rm -rf /var/cache/apk/*

# 设置时区
ENV TZ=Asia/Shanghai

# 创建nginx用户和必要目录
RUN addgroup -g 1000 -S nginx-app && \
    adduser -u 1000 -D -S -G nginx-app nginx-app && \
    mkdir -p /var/cache/nginx && \
    mkdir -p /var/log/nginx && \
    mkdir -p /etc/nginx/conf.d && \
    chown -R nginx-app:nginx-app /var/cache/nginx /var/log/nginx

# ====================
# 生产镜像阶段
# ====================
FROM nginx-base AS production

# 复制构建好的静态文件
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/*.html /usr/share/nginx/html/
COPY --from=builder /app/css /usr/share/nginx/html/css
COPY --from=builder /app/js /usr/share/nginx/html/js
COPY --from=builder /app/images /usr/share/nginx/html/images
COPY --from=builder /app/icons /usr/share/nginx/html/icons
COPY --from=builder /app/data /usr/share/nginx/html/data

# 复制nginx配置
COPY deployment/nginx/nginx.conf /etc/nginx/nginx.conf
COPY deployment/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY deployment/nginx/security.conf /etc/nginx/conf.d/security.conf
COPY deployment/nginx/performance.conf /etc/nginx/conf.d/performance.conf

# 复制健康检查脚本
COPY deployment/scripts/healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

# 设置正确的文件权限
RUN chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    find /usr/share/nginx/html -type f -name "*.html" -exec chmod 644 {} \; && \
    find /usr/share/nginx/html -type f -name "*.css" -exec chmod 644 {} \; && \
    find /usr/share/nginx/html -type f -name "*.js" -exec chmod 644 {} \; && \
    find /usr/share/nginx/html -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.gif" -o -name "*.svg" -o -name "*.ico" \) -exec chmod 644 {} \;

# 创建日志轮转配置
RUN echo '/var/log/nginx/*.log {' > /etc/logrotate.d/nginx && \
    echo '    daily' >> /etc/logrotate.d/nginx && \
    echo '    missingok' >> /etc/logrotate.d/nginx && \
    echo '    rotate 30' >> /etc/logrotate.d/nginx && \
    echo '    compress' >> /etc/logrotate.d/nginx && \
    echo '    delaycompress' >> /etc/logrotate.d/nginx && \
    echo '    notifempty' >> /etc/logrotate.d/nginx && \
    echo '    create 644 nginx-app nginx-app' >> /etc/logrotate.d/nginx && \
    echo '    postrotate' >> /etc/logrotate.d/nginx && \
    echo '        /bin/kill -USR1 `cat /var/run/nginx.pid 2>/dev/null` 2>/dev/null || true' >> /etc/logrotate.d/nginx && \
    echo '    endscript' >> /etc/logrotate.d/nginx && \
    echo '}' >> /etc/logrotate.d/nginx

# 环境变量
ENV NGINX_USER=nginx-app
ENV NGINX_GROUP=nginx-app
ENV NGINX_WORKER_PROCESSES=auto
ENV NGINX_WORKER_CONNECTIONS=1024
ENV NGINX_KEEPALIVE_TIMEOUT=30

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# 暴露端口
EXPOSE 80 443

# 添加标签元数据
LABEL maintainer="AssayBio DevOps <devops@assaybio.com>"
LABEL version="1.0.0"
LABEL description="AssayBio official website - Production ready container"
LABEL org.label-schema.name="assaybio-website"
LABEL org.label-schema.description="Shanghai AssayBio Technology Co., Ltd. Official Website"
LABEL org.label-schema.vendor="AssayBio"
LABEL org.label-schema.version="1.0.0"
LABEL org.label-schema.schema-version="1.0"

# 创建启动脚本
COPY deployment/scripts/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 切换到非root用户
USER nginx-app

# 启动容器
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]