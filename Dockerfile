# CBEL Tracking System - Docker配置
# 支持VPS部署的多阶段构建

FROM node:18-alpine AS base

# 安装依赖
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制package文件
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# 构建阶段
FROM base AS build
WORKDIR /app

# 复制源代码
COPY . .

# 设置环境变量
ENV DEPLOY_TARGET=server
ENV NODE_ENV=production

# 安装所有依赖并构建
RUN npm ci
RUN npm run build:server

# 运行时阶段
FROM base AS runtime
WORKDIR /app

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# 设置权限
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# 启动应用
CMD ["node", "server.js"]
