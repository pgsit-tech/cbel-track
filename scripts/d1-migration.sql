-- CBEL Tracking System D1数据库初始化脚本
-- 创建时间: 2025-09-04T04:24:28.934Z

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

-- 插入默认配置
INSERT OR REPLACE INTO config (key, value, updated_at) VALUES 
('site', '{"title":"PGS 智能物流轨迹查询系统","subtitle":"全球领先的智能物流跟踪解决方案","description":"专业的物流轨迹查询平台，支持多种单号格式，提供实时跟踪服务。","keywords":"物流跟踪,货物查询,运输轨迹,CBEL","contact":{"email":"support@pgs-log.com","phone":"+86-400-123-4567","address":"上海市浦东新区张江高科技园区"},"features":{"realTimeTracking":true,"multiFormat":true,"globalCoverage":true,"apiAccess":true},"social":{"website":"https://www.pgs-log.com","wechat":"PGS-Logistics"}}', CURRENT_TIMESTAMP);

-- 完成初始化
-- 使用以下命令执行此脚本:
-- wrangler d1 execute cbel-tracking --file=scripts/d1-migration.sql
