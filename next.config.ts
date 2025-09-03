import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 根据环境变量决定输出模式
  output: process.env.DEPLOY_TARGET === 'static' ? 'export' : 'standalone',

  // 静态导出配置
  ...(process.env.DEPLOY_TARGET === 'static' && {
    trailingSlash: true,
    images: {
      unoptimized: true
    }
  }),

  // VPS部署配置
  ...(process.env.DEPLOY_TARGET === 'server' && {
    experimental: {
      serverComponentsExternalPackages: ['sharp']
    }
  }),

  // 通用配置
  reactStrictMode: true,

  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    DEPLOY_TARGET: process.env.DEPLOY_TARGET || 'static',
  },


};

export default nextConfig;
