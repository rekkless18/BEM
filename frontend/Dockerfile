# 前端Dockerfile - 多阶段构建
# 第一阶段：构建React应用
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖（包括开发依赖，因为构建需要 TypeScript）
RUN npm ci

# 复制源代码
COPY . .

# 设置构建时环境变量（从docker-compose传入）
ARG VITE_API_BASE_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_NAME
ARG VITE_APP_VERSION
ARG VITE_DEV_MODE

# 将ARG转换为ENV，使其在构建过程中可用
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_DEV_MODE=$VITE_DEV_MODE

# 构建React应用（现在环境变量在构建时可用）
RUN npm run build

# 第二阶段：nginx服务器
FROM nginx:alpine

# 复制自定义nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 从构建阶段复制构建产物到nginx静态文件目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露80端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]