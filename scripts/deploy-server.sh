#!/bin/bash

# CBEL Tracking System - 服务端部署脚本
# 用于VPS部署

set -e

echo "🚀 开始服务端部署流程..."

# 检查环境
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: Docker Compose 未安装"
    exit 1
fi

# 设置环境变量
export DEPLOY_TARGET=server
export NODE_ENV=production

echo "🛑 停止现有服务..."
docker-compose down --remove-orphans || true

echo "🔨 构建Docker镜像..."
docker-compose build --no-cache

echo "🚀 启动服务..."
docker-compose up -d

echo "⏳ 等待服务启动..."
sleep 30

echo "🔍 检查服务状态..."
docker-compose ps

echo "🏥 健康检查..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ 应用健康检查通过"
else
    echo "❌ 应用健康检查失败"
    echo "📋 查看日志:"
    docker-compose logs cbel-tracking
    exit 1
fi

echo "📋 部署信息:"
echo "  - 部署模式: 服务端 (Server)"
echo "  - 容器: Docker + Docker Compose"
echo "  - 端口: 80 (HTTP), 443 (HTTPS)"
echo "  - 应用端口: 3000"
echo "  - 反向代理: Nginx"

echo "✅ 服务端部署完成!"
echo ""
echo "📝 后续步骤:"
echo "1. 配置域名DNS指向服务器IP"
echo "2. 配置SSL证书"
echo "3. 测试完整的查询流程"
echo "4. 设置监控和日志"

echo ""
echo "🔧 常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  重启服务: docker-compose restart"
echo "  停止服务: docker-compose down"
echo "  更新服务: ./scripts/deploy-server.sh"
