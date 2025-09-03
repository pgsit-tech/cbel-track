/**
 * CBEL Tracking API Route
 * Next.js API路由，用于代理官方API调用，解决CORS问题
 */

import { NextRequest, NextResponse } from 'next/server';

const OFFICIAL_API_URL = 'http://cbel.pgs-log.com/edi/pubTracking';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingNumber = searchParams.get('trackingNumber');

    if (!trackingNumber) {
      return NextResponse.json(
        { 
          success: false, 
          error: '缺少trackingNumber参数' 
        },
        { status: 400 }
      );
    }

    // 构建官方API URL
    const apiUrl = new URL(OFFICIAL_API_URL);
    apiUrl.searchParams.set('soNum', trackingNumber);
    apiUrl.searchParams.set('host', 'cbel.pgs-log.com');
    apiUrl.searchParams.set('noSubTracking', 'false');
    apiUrl.searchParams.set('url', '/public-tracking');

    console.log(`API代理请求: ${trackingNumber} -> ${apiUrl.toString()}`);

    // 调用官方API
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CBEL-Tracking-System/2.0'
      }
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 格式化响应数据
    const result = {
      success: true,
      trackingNumber: trackingNumber,
      data: data,
      timestamp: new Date().toISOString()
    };

    console.log(`查询成功: ${trackingNumber}, 找到: ${data[0]?.notFound ? '否' : '是'}`);

    // 记录查询统计
    try {
      await fetch(`${request.nextUrl.origin}/api/stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: 1 }),
      });
    } catch (error) {
      // 统计记录失败不影响主要功能
      console.error('记录统计失败:', error);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('API代理错误:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// 支持OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
