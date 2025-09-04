/**
 * CBEL Tracking System - Cloudflare Workers API代理
 * 解决CORS跨域问题，代理官方API请求，提供完整的后端API功能
 */

// D1数据库适配层 - 直接在Worker中定义，避免导入问题

// 数据库初始化SQL
const INIT_SQL = `
-- 配置表
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 统计表
CREATE TABLE IF NOT EXISTS stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  period_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, period_type)
);

-- 查询日志表
CREATE TABLE IF NOT EXISTS query_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_number TEXT NOT NULL,
  status TEXT NOT NULL,
  response_time INTEGER,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_stats_date_period ON stats(date, period_type);
CREATE INDEX IF NOT EXISTS idx_query_logs_created_at ON query_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_query_logs_tracking_number ON query_logs(tracking_number);
`;

// 初始化数据库表
async function initializeDatabase(db) {
  try {
    await db.exec(INIT_SQL);
    return true;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return false;
  }
}

// 配置管理器
class ConfigManager {
  constructor(db) {
    this.db = db;
  }

  async getConfig(key) {
    try {
      const stmt = this.db.prepare('SELECT value FROM config WHERE key = ?');
      const result = await stmt.bind(key).first();

      if (result) {
        try {
          return JSON.parse(result.value);
        } catch (error) {
          console.error('解析配置失败:', error);
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('获取配置失败:', error);
      return null;
    }
  }

  async setConfig(key, value) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO config (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `);

      const result = await stmt.bind(key, JSON.stringify(value)).run();
      return result.success;
    } catch (error) {
      console.error('保存配置失败:', error);
      return false;
    }
  }

  async getAllConfig() {
    try {
      const stmt = this.db.prepare('SELECT key, value FROM config');
      const result = await stmt.all();

      const config = {};

      if (result.results) {
        for (const row of result.results) {
          try {
            config[row.key] = JSON.parse(row.value);
          } catch (error) {
            console.error(`解析配置 ${row.key} 失败:`, error);
          }
        }
      }

      return config;
    } catch (error) {
      console.error('获取所有配置失败:', error);
      return {};
    }
  }
}

// 统计管理器
class StatsManager {
  constructor(db) {
    this.db = db;
  }

  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  async recordQuery(count = 1) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const week = this.getWeekNumber(now);

      const dates = {
        daily: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        weekly: `${year}-W${week.toString().padStart(2, '0')}`,
        monthly: `${year}-${month.toString().padStart(2, '0')}`,
        yearly: year.toString()
      };

      const statements = [];

      for (const [periodType, date] of Object.entries(dates)) {
        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO stats (date, period_type, count, updated_at)
          VALUES (?, ?, COALESCE((SELECT count FROM stats WHERE date = ? AND period_type = ?), 0) + ?, CURRENT_TIMESTAMP)
        `);
        statements.push(stmt.bind(date, periodType, date, periodType, count));
      }

      const results = await this.db.batch(statements);
      return results.every(result => result.success);
    } catch (error) {
      console.error('记录查询统计失败:', error);
      return false;
    }
  }

  async getStatsSummary() {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const week = this.getWeekNumber(now);

      const dates = {
        daily: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        weekly: `${year}-W${week.toString().padStart(2, '0')}`,
        monthly: `${year}-${month.toString().padStart(2, '0')}`,
        yearly: year.toString()
      };

      const todayStmt = this.db.prepare('SELECT count FROM stats WHERE date = ? AND period_type = ?');
      const weekStmt = this.db.prepare('SELECT count FROM stats WHERE date = ? AND period_type = ?');
      const monthStmt = this.db.prepare('SELECT count FROM stats WHERE date = ? AND period_type = ?');
      const yearStmt = this.db.prepare('SELECT count FROM stats WHERE date = ? AND period_type = ?');
      const totalStmt = this.db.prepare('SELECT SUM(count) as total FROM stats WHERE period_type = ?');

      const [today, thisWeek, thisMonth, thisYear, total] = await Promise.all([
        todayStmt.bind(dates.daily, 'daily').first(),
        weekStmt.bind(dates.weekly, 'weekly').first(),
        monthStmt.bind(dates.monthly, 'monthly').first(),
        yearStmt.bind(dates.yearly, 'yearly').first(),
        totalStmt.bind('daily').first()
      ]);

      return {
        today: today?.count || 0,
        thisWeek: thisWeek?.count || 0,
        thisMonth: thisMonth?.count || 0,
        thisYear: thisYear?.count || 0,
        total: total?.total || 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('获取统计摘要失败:', error);
      return {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        thisYear: 0,
        total: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async getChartData(period, limit = 30) {
    try {
      const stmt = this.db.prepare(`
        SELECT date, count FROM stats
        WHERE period_type = ?
        ORDER BY date DESC
        LIMIT ?
      `);

      const result = await stmt.bind(period, limit).all();

      if (result.results) {
        return result.results.reverse().map(row => ({
          date: row.date,
          count: row.count
        }));
      }

      return [];
    } catch (error) {
      console.error('获取图表数据失败:', error);
      return [];
    }
  }
}

// 查询日志管理器
class QueryLogManager {
  constructor(db) {
    this.db = db;
  }

  async logQuery(trackingNumber, status, responseTime, errorMessage, ipAddress, userAgent) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO query_logs (tracking_number, status, response_time, error_message, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = await stmt.bind(trackingNumber, status, responseTime, errorMessage, ipAddress, userAgent).run();
      return result.success;
    } catch (error) {
      console.error('记录查询日志失败:', error);
      return false;
    }
  }

  async getRecentQueries(limit = 10) {
    try {
      const stmt = this.db.prepare(`
        SELECT tracking_number, status, response_time, error_message, created_at
        FROM query_logs
        ORDER BY created_at DESC
        LIMIT ?
      `);

      const result = await stmt.all(limit);

      if (result.results) {
        return result.results.map(row => ({
          trackingNumber: row.tracking_number,
          status: row.status,
          responseTime: row.response_time,
          errorMessage: row.error_message,
          timestamp: row.created_at
        }));
      }

      return [];
    } catch (error) {
      console.error('获取最近查询记录失败:', error);
      return [];
    }
  }
}

// 官方API配置
const OFFICIAL_API_URL = 'http://cbel.pgs-log.com/edi/pubTracking';
const ALLOWED_ORIGINS = [
  'https://tracking.pgs-log.cn',
  'https://cbel-track.pages.dev',
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
 * 处理跟踪查询API请求
 */
async function handleTrackingRequest(request, env) {
  try {
    const url = new URL(request.url);
    const trackingNumber = url.searchParams.get('trackingNumber');

    if (!trackingNumber) {
      return createErrorResponse('缺少trackingNumber参数', 400);
    }

    const startTime = Date.now();

    // 构建官方API请求
    const apiParams = new URLSearchParams({
      soNum: trackingNumber,
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
        'User-Agent': 'CBEL-Tracking-System/2.0'
      }
    });

    const responseTime = Date.now() - startTime;

    if (!apiResponse.ok) {
      // 记录失败日志
      const queryLogManager = new QueryLogManager(env.cbel_tracking);
      await queryLogManager.logQuery(
        trackingNumber,
        'failed',
        responseTime,
        `API请求失败: ${apiResponse.status}`,
        request.headers.get('CF-Connecting-IP'),
        request.headers.get('User-Agent')
      );

      return createErrorResponse(`API请求失败: ${apiResponse.status}`, apiResponse.status);
    }

    const data = await apiResponse.json();

    // 记录成功日志和统计
    const queryLogManager = new QueryLogManager(env.cbel_tracking);
    const statsManager = new StatsManager(env.cbel_tracking);

    await Promise.all([
      queryLogManager.logQuery(
        trackingNumber,
        'success',
        responseTime,
        null,
        request.headers.get('CF-Connecting-IP'),
        request.headers.get('User-Agent')
      ),
      statsManager.recordQuery(1)
    ]);

    // 返回成功响应
    return createSuccessResponse({
      success: true,
      trackingNumber: trackingNumber,
      data: data,
      timestamp: new Date().toISOString()
    }, request);

  } catch (error) {
    console.error('跟踪查询错误:', error);
    return createErrorResponse('服务器内部错误', 500);
  }
}

/**
 * 处理统计API请求
 */
async function handleStatsRequest(request, env) {
  try {
    const url = new URL(request.url);
    const method = request.method;

    const statsManager = new StatsManager(env.cbel_tracking);

    if (method === 'GET') {
      const type = url.searchParams.get('type') || 'summary';
      const period = url.searchParams.get('period');
      const limit = parseInt(url.searchParams.get('limit') || '30');

      if (type === 'summary') {
        const summary = await statsManager.getStatsSummary();
        return createSuccessResponse(summary, request);
      } else if (type === 'chart' && period) {
        const chartData = await statsManager.getChartData(period, limit);
        return createSuccessResponse(chartData, request);
      } else {
        const summary = await statsManager.getStatsSummary();
        return createSuccessResponse(summary, request);
      }
    } else if (method === 'POST') {
      const body = await request.json();
      const count = body.count || 1;

      const success = await statsManager.recordQuery(count);

      if (success) {
        const summary = await statsManager.getStatsSummary();
        return createSuccessResponse({
          message: '统计记录成功',
          data: summary
        }, request);
      } else {
        return createErrorResponse('统计记录失败', 500);
      }
    } else {
      return createErrorResponse('方法不被允许', 405);
    }
  } catch (error) {
    console.error('统计API错误:', error);
    return createErrorResponse('服务器内部错误', 500);
  }
}

/**
 * 处理配置API请求
 */
async function handleConfigRequest(request, env) {
  try {
    const method = request.method;
    const configManager = new ConfigManager(env.cbel_tracking);

    if (method === 'GET') {
      const config = await configManager.getAllConfig();
      return createSuccessResponse(config, request);
    } else if (method === 'POST') {
      const body = await request.json();

      // 简单的管理员验证（在生产环境中应该使用更安全的方式）
      if (body.password !== 'admin123') {
        return createErrorResponse('认证失败', 401);
      }

      if (body.config) {
        const success = await configManager.setConfig('site', body.config);
        if (success) {
          return createSuccessResponse({ message: '配置保存成功' }, request);
        } else {
          return createErrorResponse('配置保存失败', 500);
        }
      } else {
        return createErrorResponse('缺少配置数据', 400);
      }
    } else {
      return createErrorResponse('方法不被允许', 405);
    }
  } catch (error) {
    console.error('配置API错误:', error);
    return createErrorResponse('服务器内部错误', 500);
  }
}

/**
 * 处理监控API请求
 */
async function handleMonitorRequest(request, env) {
  try {
    const queryLogManager = new QueryLogManager(env.cbel_tracking);
    const recentQueries = await queryLogManager.getRecentQueries(20);

    return createSuccessResponse({
      recentQueries: recentQueries,
      timestamp: new Date().toISOString()
    }, request);
  } catch (error) {
    console.error('监控API错误:', error);
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
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const method = request.method;

  // 初始化数据库（如果需要）
  if (env.cbel_tracking) {
    await initializeDatabase(env.cbel_tracking);
  }

  // 处理CORS预检请求
  if (method === 'OPTIONS') {
    return handleCORS(request);
  }

  // 路由处理
  switch (url.pathname) {
    case '/':
      return new Response('CBEL Tracking API Proxy v2.0', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });

    case '/health':
      return handleHealthCheck();

    case '/api/tracking':
      if (method === 'GET') {
        return handleTrackingRequest(request, env);
      } else {
        return createErrorResponse('方法不被允许', 405);
      }

    case '/api/stats':
      return handleStatsRequest(request, env);

    case '/api/config':
      return handleConfigRequest(request, env);

    case '/api/monitor':
      if (method === 'GET') {
        return handleMonitorRequest(request, env);
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
async function handleRequestWithErrorHandling(request, env) {
  try {
    return await handleRequest(request, env);
  } catch (error) {
    console.error('请求处理错误:', error);
    return createErrorResponse('服务器内部错误', 500);
  }
}

// 导出默认处理器（新的Worker格式）
export default {
  async fetch(request, env, ctx) {
    return handleRequestWithErrorHandling(request, env);
  }
};

// 兼容旧的事件监听器格式
if (typeof addEventListener !== 'undefined') {
  addEventListener('fetch', event => {
    event.respondWith(handleRequestWithErrorHandling(event.request, event.env || {}));
  });
}
