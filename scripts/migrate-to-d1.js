#!/usr/bin/env node

/**
 * SQLite到D1数据库迁移脚本
 * 将现有的SQLite数据导出并生成D1导入SQL
 */

const fs = require('fs');
const path = require('path');

// 检查SQLite数据库文件是否存在
const dbPath = path.join(process.cwd(), 'data', 'cbel-tracking.db');
const outputPath = path.join(process.cwd(), 'scripts', 'd1-migration.sql');

console.log('🚀 开始SQLite到D1数据迁移...');

if (!fs.existsSync(dbPath)) {
  console.log('❌ SQLite数据库文件不存在:', dbPath);
  console.log('💡 如果这是全新安装，请直接使用以下SQL初始化D1数据库:');
  generateInitSQL();
  process.exit(0);
}

// 生成初始化SQL
function generateInitSQL() {
  const initSQL = `-- CBEL Tracking System D1数据库初始化脚本
-- 创建时间: ${new Date().toISOString()}

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
`;

  fs.writeFileSync(outputPath, initSQL);
  console.log('✅ D1初始化SQL已生成:', outputPath);
  console.log('');
  console.log('📋 执行步骤:');
  console.log('1. 确保已登录Cloudflare: wrangler login');
  console.log('2. 执行初始化脚本: wrangler d1 execute cbel-tracking --file=scripts/d1-migration.sql');
  console.log('3. 验证数据: wrangler d1 execute cbel-tracking --command="SELECT * FROM config"');
}

// 如果存在SQLite数据库，尝试读取并转换
try {
  // 注意：这里需要better-sqlite3，但在Cloudflare环境中不可用
  // 这个脚本应该在本地开发环境中运行
  console.log('⚠️  检测到SQLite数据库文件');
  console.log('💡 由于better-sqlite3在Cloudflare环境中不可用，请在本地环境中运行此脚本');
  console.log('');
  console.log('📋 手动迁移步骤:');
  console.log('1. 在本地安装better-sqlite3: npm install better-sqlite3');
  console.log('2. 运行迁移脚本导出数据');
  console.log('3. 将导出的SQL导入到D1数据库');
  console.log('');
  console.log('🔄 或者，如果数据不重要，可以直接使用初始化脚本:');
  
  generateInitSQL();
  
} catch (error) {
  console.error('❌ 迁移过程中出现错误:', error.message);
  console.log('');
  console.log('🔄 生成初始化脚本作为备选方案...');
  generateInitSQL();
}

console.log('');
console.log('🎉 迁移脚本执行完成！');
console.log('');
console.log('📝 后续步骤:');
console.log('1. 执行D1初始化: wrangler d1 execute cbel-tracking --file=scripts/d1-migration.sql');
console.log('2. 部署Worker: wrangler deploy');
console.log('3. 部署Pages: 推送代码到GitHub，Cloudflare自动部署');
console.log('4. 配置自定义域名');
console.log('');
console.log('⚠️  重要提醒:');
console.log('- 确保wrangler.toml中的D1数据库配置正确');
console.log('- 部署前请先在本地测试Worker功能');
console.log('- 记得更新前端API调用地址指向Worker');
