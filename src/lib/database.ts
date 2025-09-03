import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'data', 'cbel-tracking.db');

// 确保数据目录存在
function ensureDataDir() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 数据库实例
let db: Database.Database | null = null;

// 获取数据库连接
export function getDatabase(): Database.Database {
  if (!db) {
    ensureDataDir();
    db = new Database(DB_PATH);
    
    // 启用WAL模式以提高并发性能
    db.pragma('journal_mode = WAL');
    
    // 初始化数据库表
    initializeTables();
  }
  
  return db;
}

// 初始化数据库表
function initializeTables() {
  if (!db) return;
  
  // 配置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 统计表
  db.exec(`
    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
      count INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, period_type)
    )
  `);
  
  // 查询日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS query_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_number TEXT NOT NULL,
      status TEXT NOT NULL, -- 'success', 'failed'
      response_time INTEGER, -- 响应时间(毫秒)
      error_message TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stats_date_period ON stats(date, period_type);
    CREATE INDEX IF NOT EXISTS idx_query_logs_created_at ON query_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_query_logs_tracking_number ON query_logs(tracking_number);
  `);
}

// 配置相关操作
export class ConfigManager {
  private db: Database.Database;
  
  constructor() {
    this.db = getDatabase();
  }
  
  // 获取配置
  getConfig(key: string): any {
    const stmt = this.db.prepare('SELECT value FROM config WHERE key = ?');
    const result = stmt.get(key) as { value: string } | undefined;
    
    if (result) {
      try {
        return JSON.parse(result.value);
      } catch (error) {
        console.error('解析配置失败:', error);
        return null;
      }
    }
    
    return null;
  }
  
  // 设置配置
  setConfig(key: string, value: any): boolean {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO config (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('保存配置失败:', error);
      return false;
    }
  }
  
  // 获取所有配置
  getAllConfig(): Record<string, any> {
    const stmt = this.db.prepare('SELECT key, value FROM config');
    const results = stmt.all() as { key: string; value: string }[];
    
    const config: Record<string, any> = {};
    
    for (const result of results) {
      try {
        config[result.key] = JSON.parse(result.value);
      } catch (error) {
        console.error(`解析配置 ${result.key} 失败:`, error);
      }
    }
    
    return config;
  }
}

// 统计相关操作
export class StatsManager {
  private db: Database.Database;
  
  constructor() {
    this.db = getDatabase();
  }
  
  // 记录查询统计
  recordQuery(count: number = 1): boolean {
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
      
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO stats (date, period_type, count, updated_at)
        VALUES (?, ?, COALESCE((SELECT count FROM stats WHERE date = ? AND period_type = ?), 0) + ?, CURRENT_TIMESTAMP)
      `);
      
      // 更新各个时间维度的统计
      for (const [periodType, date] of Object.entries(dates)) {
        stmt.run(date, periodType, date, periodType, count);
      }
      
      return true;
    } catch (error) {
      console.error('记录统计失败:', error);
      return false;
    }
  }
  
  // 获取统计摘要
  getStatsSummary(): any {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const week = this.getWeekNumber(now);
    
    const dates = {
      today: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
      thisWeek: `${year}-W${week.toString().padStart(2, '0')}`,
      thisMonth: `${year}-${month.toString().padStart(2, '0')}`,
      thisYear: year.toString()
    };
    
    const stmt = this.db.prepare('SELECT count FROM stats WHERE date = ? AND period_type = ?');
    
    const today = stmt.get(dates.today, 'daily') as { count: number } | undefined;
    const thisWeek = stmt.get(dates.thisWeek, 'weekly') as { count: number } | undefined;
    const thisMonth = stmt.get(dates.thisMonth, 'monthly') as { count: number } | undefined;
    const thisYear = stmt.get(dates.thisYear, 'yearly') as { count: number } | undefined;
    
    // 计算总数
    const totalStmt = this.db.prepare('SELECT SUM(count) as total FROM stats WHERE period_type = ?');
    const totalResult = totalStmt.get('daily') as { total: number } | undefined;
    
    return {
      today: today?.count || 0,
      thisWeek: thisWeek?.count || 0,
      thisMonth: thisMonth?.count || 0,
      thisYear: thisYear?.count || 0,
      total: totalResult?.total || 0,
      lastUpdated: new Date().toISOString()
    };
  }
  
  // 获取图表数据
  getChartData(period: 'daily' | 'weekly' | 'monthly' | 'yearly', limit: number = 30): any[] {
    const stmt = this.db.prepare(`
      SELECT date, count FROM stats 
      WHERE period_type = ? 
      ORDER BY date DESC 
      LIMIT ?
    `);
    
    const results = stmt.all(period, limit) as { date: string; count: number }[];
    
    return results.reverse().map(result => ({
      date: result.date,
      count: result.count
    }));
  }
  
  // 获取周数
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}

// 查询日志相关操作
export class QueryLogManager {
  private db: Database.Database;
  
  constructor() {
    this.db = getDatabase();
  }
  
  // 记录查询日志
  logQuery(trackingNumber: string, status: 'success' | 'failed', responseTime?: number, errorMessage?: string, ipAddress?: string, userAgent?: string): boolean {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO query_logs (tracking_number, status, response_time, error_message, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(trackingNumber, status, responseTime, errorMessage, ipAddress, userAgent);
      return true;
    } catch (error) {
      console.error('记录查询日志失败:', error);
      return false;
    }
  }
  
  // 获取最近查询记录
  getRecentQueries(limit: number = 10): any[] {
    const stmt = this.db.prepare(`
      SELECT tracking_number, status, response_time, error_message, created_at
      FROM query_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    
    const results = stmt.all(limit) as any[];
    
    return results.map(result => ({
      trackingNumber: result.tracking_number,
      status: result.status,
      responseTime: result.response_time,
      errorMessage: result.error_message,
      timestamp: result.created_at
    }));
  }
}

// 关闭数据库连接
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// 导出管理器实例
export const configManager = new ConfigManager();
export const statsManager = new StatsManager();
export const queryLogManager = new QueryLogManager();
