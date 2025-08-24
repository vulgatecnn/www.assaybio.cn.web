# 多阶段构建 - 优化生产镜像大小
# 构建阶段
FROM node:18-alpine AS build-stage

# 设置工作目录
WORKDIR /app

# 安装构建工具
RUN apk add --no-cache git

# 复制package文件
COPY package*.json ./

# 安装依赖（使用npm ci获得更快且可靠的构建）
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build:prod

# 生产阶段
FROM nginx:1.25-alpine AS production-stage

# 安装必要工具
RUN apk add --no-cache curl

# 复制自定义nginx配置
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制构建结果
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 创建非root用户
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001

# 设置正确的文件权限
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d
    
# 创建pid文件目录
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# 暴露端口
EXPOSE 80

# 切换到非root用户
USER nginx

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]