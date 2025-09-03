import { NextRequest, NextResponse } from 'next/server';

// 接口配置
const API_ENDPOINTS = [
  {
    name: '数字单号查询接口',
    url: 'https://cbel.pgs-log.com/api/tracking/query',
    method: 'POST',
    testData: { trackingNumber: '2025515460' },
    timeout: 10000
  },
  {
    name: '字母单号查询接口',
    url: 'https://cbel.pgs-log.com/api/tracking/query',
    method: 'POST',
    testData: { trackingNumber: 'CBSZSEUS25032380' },
    timeout: 10000
  }
];

// 检查单个接口
async function checkEndpoint(endpoint: any) {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);
    
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(endpoint.testData),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    const isHealthy = response.ok;
    let responseData = null;
    
    try {
      responseData = await response.json();
    } catch (e) {
      // 忽略JSON解析错误
    }
    
    return {
      name: endpoint.name,
      url: endpoint.url,
      status: isHealthy ? 'healthy' : 'unhealthy',
      statusCode: response.status,
      responseTime,
      lastChecked: new Date().toISOString(),
      error: null,
      details: {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        hasData: !!responseData
      }
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return {
      name: endpoint.name,
      url: endpoint.url,
      status: 'error',
      statusCode: 0,
      responseTime,
      lastChecked: new Date().toISOString(),
      error: error.message || '请求失败',
      details: {
        ok: false,
        status: 0,
        statusText: 'Network Error',
        hasData: false
      }
    };
  }
}

// 检查所有接口
async function checkAllEndpoints() {
  const results = await Promise.all(
    API_ENDPOINTS.map(endpoint => checkEndpoint(endpoint))
  );
  
  const summary = {
    total: results.length,
    healthy: results.filter(r => r.status === 'healthy').length,
    unhealthy: results.filter(r => r.status === 'unhealthy').length,
    error: results.filter(r => r.status === 'error').length,
    averageResponseTime: Math.round(
      results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
    ),
    lastChecked: new Date().toISOString()
  };
  
  return {
    summary,
    endpoints: results
  };
}

// GET - 获取接口监控状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (endpoint) {
      // 检查特定接口
      const targetEndpoint = API_ENDPOINTS.find(e => e.name === endpoint);
      if (!targetEndpoint) {
        return NextResponse.json({
          success: false,
          error: '接口不存在'
        }, { status: 404 });
      }
      
      const result = await checkEndpoint(targetEndpoint);
      return NextResponse.json({
        success: true,
        data: result
      });
    } else {
      // 检查所有接口
      const results = await checkAllEndpoints();
      return NextResponse.json({
        success: true,
        data: results
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '接口监控检查失败'
    }, { status: 500 });
  }
}

// POST - 手动触发接口检查
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;
    
    if (endpoint) {
      // 检查特定接口
      const targetEndpoint = API_ENDPOINTS.find(e => e.name === endpoint);
      if (!targetEndpoint) {
        return NextResponse.json({
          success: false,
          error: '接口不存在'
        }, { status: 404 });
      }
      
      const result = await checkEndpoint(targetEndpoint);
      return NextResponse.json({
        success: true,
        message: '接口检查完成',
        data: result
      });
    } else {
      // 检查所有接口
      const results = await checkAllEndpoints();
      return NextResponse.json({
        success: true,
        message: '所有接口检查完成',
        data: results
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '接口检查失败'
    }, { status: 500 });
  }
}
