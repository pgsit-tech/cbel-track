/**
 * CBEL Tracking System - Cloudflare Workers API代理
 * 解决CORS跨域问题，代理官方API请求
 */

// 官方API配置
const OFFICIAL_API_URL = 'http://cbel.pgs-log.com/edi/pubTracking';
const ALLOWED_ORIGINS = [
  'https://tracking.pgs-log.cn',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// CORS头部配置
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin, Referer',
  'Access-Control-Max-Age': '86400',
};

/**
 * 处理CORS预检请求
 */
function handleCORS(request) {
  const origin = request.headers.get('Origin');
  
  // 检查来源是否被允许
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return new Response(null, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Access-Control-Allow-Origin': origin,
      }
    });
  }
  
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS
  });
}

/**
 * 处理API代理请求
 */
async function handleAPIRequest(request) {
  try {
    const url = new URL(request.url);
    const trackingRef = url.searchParams.get('trackingRef');
    
    if (!trackingRef) {
      return createErrorResponse('缺少跟踪单号参数', 400);
    }
    
    // 构建官方API请求
    const apiParams = new URLSearchParams({
      trackingRef: trackingRef,
      host: 'cbel.pgs-log.com',
      noSubTracking: 'false',
      url: '/public-tracking'
    });
    
    const apiUrl = `${OFFICIAL_API_URL}?${apiParams.toString()}`;
    
    // 发起API请求
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'CBEL-Tracking-Proxy/1.0'
      }
    });
    
    if (!apiResponse.ok) {
      return createErrorResponse(`API请求失败: ${apiResponse.status}`, apiResponse.status);
    }
    
    const data = await apiResponse.json();
    
    // 返回成功响应
    return createSuccessResponse(data, request);
    
  } catch (error) {
    console.error('API代理错误:', error);
    return createErrorResponse('服务器内部错误', 500);
  }
}

/**
 * 创建成功响应
 */
function createSuccessResponse(data, request) {
  const origin = request.headers.get('Origin');
  
  return new Response(JSON.stringify({
    success: true,
    data: data,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...(origin && ALLOWED_ORIGINS.includes(origin) && {
        'Access-Control-Allow-Origin': origin
      })
    }
  });
}

/**
 * 创建错误响应
 */
function createErrorResponse(message, status = 400) {
  return new Response(JSON.stringify({
    success: false,
    error: {
      code: status,
      message: message,
      timestamp: new Date().toISOString()
    }
  }), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  });
}

/**
 * 处理健康检查
 */
function handleHealthCheck() {
  return new Response(JSON.stringify({
    status: 'healthy',
    service: 'CBEL Tracking Proxy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  });
}

/**
 * 主要的请求处理函数
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const method = request.method;
  
  // 处理CORS预检请求
  if (method === 'OPTIONS') {
    return handleCORS(request);
  }
  
  // 路由处理
  switch (url.pathname) {
    case '/':
      return new Response('CBEL Tracking API Proxy', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
      
    case '/health':
      return handleHealthCheck();
      
    case '/api/tracking':
      if (method === 'GET') {
        return handleAPIRequest(request);
      } else {
        return createErrorResponse('方法不被允许', 405);
      }
      
    default:
      return createErrorResponse('路径未找到', 404);
  }
}

/**
 * 错误处理包装器
 */
async function handleRequestWithErrorHandling(request) {
  try {
    return await handleRequest(request);
  } catch (error) {
    console.error('请求处理错误:', error);
    return createErrorResponse('服务器内部错误', 500);
  }
}

// 导出事件监听器
addEventListener('fetch', event => {
  event.respondWith(handleRequestWithErrorHandling(event.request));
});

// 如果在Node.js环境中运行（用于测试）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleRequest,
    handleAPIRequest,
    handleCORS,
    createSuccessResponse,
    createErrorResponse
  };
}
