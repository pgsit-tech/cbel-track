import { NextRequest, NextResponse } from 'next/server';
import { configManager } from '@/lib/database';

// 默认配置
const DEFAULT_CONFIG = {
  site: {
    title: 'CBEL 物流轨迹查询',
    subtitle: '专业、快速、准确的物流跟踪服务',
    logo: '/logo.png',
    favicon: '/favicon.ico',
    description: '专业的物流轨迹查询服务，为您提供最准确、最及时的货物跟踪信息'
  },
  contact: {
    phone: '400-888-8888',
    email: 'support@cbel.com',
    address: '中国·上海',
    workTime: '周一至周五 9:00-18:00'
  },
  footer: {
    company: 'CBEL 物流科技有限公司',
    copyright: '© 2025 CBEL 物流科技有限公司. 保留所有权利.',
    quickLinks: [
      { name: '服务条款', url: '#' },
      { name: '隐私政策', url: '#' },
      { name: '联系我们', url: '#' },
      { name: '技术支持', url: '#' }
    ]
  },
  features: [
    {
      title: '快速查询',
      description: '智能识别多种单号格式，秒级响应查询结果',
      icon: 'lightning'
    },
    {
      title: '准确可靠',
      description: '直连官方API，确保数据准确性和实时性',
      icon: 'shield'
    },
    {
      title: '批量处理',
      description: '支持最多50个单号同时查询，提高工作效率',
      icon: 'batch'
    }
  ]
};

// 读取配置
function readConfig() {
  try {
    const config = configManager.getConfig('site');
    return config || DEFAULT_CONFIG;
  } catch (error) {
    console.error('读取配置失败:', error);
    return DEFAULT_CONFIG;
  }
}

// 写入配置
function writeConfig(config: any) {
  try {
    return configManager.setConfig('site', config);
  } catch (error) {
    console.error('写入配置失败:', error);
    return false;
  }
}

// GET - 获取配置
export async function GET() {
  try {
    const config = readConfig();
    return NextResponse.json({
      success: true,
      data: config
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '获取配置失败'
    }, { status: 500 });
  }
}

// POST - 更新配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const currentConfig = readConfig();
    
    // 合并配置
    const newConfig = {
      ...currentConfig,
      ...body
    };
    
    const success = writeConfig(newConfig);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: '配置更新成功',
        data: newConfig
      });
    } else {
      return NextResponse.json({
        success: false,
        error: '配置保存失败'
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '更新配置失败'
    }, { status: 500 });
  }
}
