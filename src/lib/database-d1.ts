/**
 * Cloudflare D1 数据库适配层
 * 替换原有的SQLite数据库操作
 */

// D1数据库类型定义
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1ExecResult>;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = any>(): Promise<D1Result<T>>;
}

interface D1Result<T = any> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: {
    changed_db: boolean;
    changes: number;
    duration: number;
    last_row_id: number;
    rows_read: number;
    rows_written: number;
  };
}

interface D1ExecResult {
  count: number;
  duration: number;
}

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
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  count INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, period_type)
);

-- 查询日志表
CREATE TABLE IF NOT EXISTS query_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_number TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed'
  response_time INTEGER, -- 响应时间(毫秒)
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
export async function initializeDatabase(db: D1Database): Promise<boolean> {
  try {
    await db.exec(INIT_SQL);
    return true;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return false;
  }
}

// 配置管理器
export class ConfigManager {
  private db: D1Database;
  
  constructor(db: D1Database) {
    this.db = db;
  }
  
  // 获取配置
  async getConfig(key: string): Promise<any> {
    try {
      const stmt = this.db.prepare('SELECT value FROM config WHERE key = ?');
      const result = await stmt.bind(key).first<{ value: string }>();
      
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
  
  // 设置配置
  async setConfig(key: string, value: any): Promise<boolean> {
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
  
  // 获取所有配置
  async getAllConfig(): Promise<Record<string, any>> {
    try {
      const stmt = this.db.prepare('SELECT key, value FROM config');
      const result = await stmt.all<{ key: string; value: string }>();
      
      const config: Record<string, any> = {};
      
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
export class StatsManager {
  private db: D1Database;
  
  constructor(db: D1Database) {
    this.db = db;
  }
  
  // 获取周数
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
  
  // 记录查询统计
  async recordQuery(count: number = 1): Promise<boolean> {
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
  
  // 获取统计摘要
  async getStatsSummary(): Promise<any> {
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
        todayStmt.bind(dates.daily, 'daily').first<{ count: number }>(),
        weekStmt.bind(dates.weekly, 'weekly').first<{ count: number }>(),
        monthStmt.bind(dates.monthly, 'monthly').first<{ count: number }>(),
        yearStmt.bind(dates.yearly, 'yearly').first<{ count: number }>(),
        totalStmt.bind('daily').first<{ total: number }>()
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
  
  // 获取图表数据
  async getChartData(period: 'daily' | 'weekly' | 'monthly' | 'yearly', limit: number = 30): Promise<any[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT date, count FROM stats 
        WHERE period_type = ? 
        ORDER BY date DESC 
        LIMIT ?
      `);
      
      const result = await stmt.bind(period, limit).all<{ date: string; count: number }>();
      
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
export class QueryLogManager {
  private db: D1Database;
  
  constructor(db: D1Database) {
    this.db = db;
  }
  
  // 记录查询日志
  async logQuery(
    trackingNumber: string, 
    status: 'success' | 'failed', 
    responseTime?: number, 
    errorMessage?: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<boolean> {
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
  
  // 获取最近查询记录
  async getRecentQueries(limit: number = 10): Promise<any[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT tracking_number, status, response_time, error_message, created_at
        FROM query_logs 
        ORDER BY created_at DESC 
        LIMIT ?
      `);
      
      const result = await stmt.all(limit);
      
      if (result.results) {
        return result.results.map((row: any) => ({
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
