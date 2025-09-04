#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { configManager, statsManager } from '../lib/database';

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
    copyright: '© 2025 CBEL 物流科技有限公司. 保留所有权利.'
  }
};

async function migrateData() {
  console.log('🚀 开始数据迁移...');
  
  const dataDir = path.join(process.cwd(), 'data');
  const configFile = path.join(dataDir, 'config.json');
  const statsFile = path.join(dataDir, 'stats.json');
  
  try {
    // 迁移配置数据
    console.log('📝 迁移配置数据...');
    let config = DEFAULT_CONFIG;
    
    if (fs.existsSync(configFile)) {
      try {
        const configData = fs.readFileSync(configFile, 'utf8');
        config = JSON.parse(configData);
        console.log('✅ 从现有配置文件读取数据');
      } catch (error) {
        console.log('⚠️  配置文件解析失败，使用默认配置');
      }
    } else {
      console.log('ℹ️  配置文件不存在，使用默认配置');
    }
    
    // 保存配置到数据库
    configManager.setConfig('site', config);
    console.log('✅ 配置数据迁移完成');
    
    // 迁移统计数据
    console.log('📊 迁移统计数据...');
    
    if (fs.existsSync(statsFile)) {
      try {
        const statsData = fs.readFileSync(statsFile, 'utf8');
        const stats = JSON.parse(statsData);
        
        // 迁移日统计
        if (stats.daily) {
          for (const [date, count] of Object.entries(stats.daily)) {
            // 直接插入到数据库，不使用recordQuery以避免重复计算
            const db = configManager['db']; // 访问数据库实例
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO stats (date, period_type, count, updated_at)
              VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `);
            stmt.run(date, 'daily', count);
          }
        }
        
        // 迁移周统计
        if (stats.weekly) {
          for (const [date, count] of Object.entries(stats.weekly)) {
            const db = configManager['db'];
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO stats (date, period_type, count, updated_at)
              VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `);
            stmt.run(date, 'weekly', count);
          }
        }
        
        // 迁移月统计
        if (stats.monthly) {
          for (const [date, count] of Object.entries(stats.monthly)) {
            const db = configManager['db'];
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO stats (date, period_type, count, updated_at)
              VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `);
            stmt.run(date, 'monthly', count);
          }
        }
        
        // 迁移年统计
        if (stats.yearly) {
          for (const [date, count] of Object.entries(stats.yearly)) {
            const db = configManager['db'];
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO stats (date, period_type, count, updated_at)
              VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `);
            stmt.run(date, 'yearly', count);
          }
        }
        
        console.log('✅ 统计数据迁移完成');
      } catch (error) {
        console.log('⚠️  统计文件解析失败:', error);
      }
    } else {
      console.log('ℹ️  统计文件不存在，跳过统计数据迁移');
    }
    
    // 验证迁移结果
    console.log('🔍 验证迁移结果...');
    
    const migratedConfig = configManager.getConfig('site');
    console.log('配置验证:', migratedConfig ? '✅ 成功' : '❌ 失败');
    
    const statsSummary = statsManager.getStatsSummary();
    console.log('统计验证:', `总查询量: ${statsSummary.total}`);
    
    console.log('🎉 数据迁移完成！');
    console.log('');
    console.log('📋 迁移摘要:');
    console.log(`- 配置数据: ${migratedConfig ? '已迁移' : '使用默认'}`);
    console.log(`- 统计数据: 总查询量 ${statsSummary.total} 次`);
    console.log(`- 数据库文件: ${path.join(process.cwd(), 'data', 'cbel-tracking.db')}`);
    console.log('');
    console.log('💡 提示:');
    console.log('- 原JSON文件已保留，可以手动删除');
    console.log('- 数据库文件位于 data/cbel-tracking.db');
    console.log('- 单机迁移时只需复制整个 data 目录');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateData().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('迁移失败:', error);
    process.exit(1);
  });
}

export { migrateData };
