#!/bin/bash

# CBEL Tracking System - 静态部署脚本
# 用于部署到Cloudflare Pages

set -e

echo "🚀 开始静态部署流程..."

# 检查环境
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: npm 未安装"
    exit 1
fi

if ! command -v wrangler &> /dev/null; then
    echo "❌ 错误: wrangler CLI 未安装"
    echo "请运行: npm install -g wrangler"
    exit 1
fi

# 设置环境变量
export DEPLOY_TARGET=static
export NODE_ENV=production

echo "📦 安装依赖..."
npm ci

echo "🔨 构建静态版本..."
npm run build:static

echo "📤 导出静态文件..."
npm run export

echo "🔧 部署Cloudflare Workers..."
wrangler deploy --env production

echo "📋 部署信息:"
echo "  - 部署模式: 静态 (Static)"
echo "  - 前端: Cloudflare Pages"
echo "  - API代理: Cloudflare Workers"
echo "  - 域名: tracking.pgs-log.cn"
echo "  - API域名: cbel-track.20990909.xyz"

echo "✅ 静态部署完成!"
echo ""
echo "📝 后续步骤:"
echo "1. 将 out/ 目录上传到 Cloudflare Pages"
echo "2. 配置自定义域名: tracking.pgs-log.cn"
echo "3. 验证 Workers 代理是否正常工作"
echo "4. 测试完整的查询流程"
