/**
 * CBEL Tracking System - 配置管理
 * 支持多种部署模式的统一配置
 */

export interface AppConfig {
  // 部署配置
  deploy: {
    target: 'static' | 'server';
    mode: 'development' | 'production';
  };
  
  // API配置
  api: {
    // 静态模式使用Workers代理
    baseURL: string;
    // 官方API地址
    officialAPI: string;
    // 请求超时时间
    timeout: number;
    // 重试配置
    retry: {
      maxAttempts: number;
      delay: number;
      backoff: number;
    };
  };
  
  // 域名配置
  domains: {
    main: string;
    api: string;
  };
  
  // 站点配置
  site: {
    title: string;
    subtitle: string;
    description: string;
    keywords: string;
    author: string;
    version: string;
  };
  
  // 品牌配置
  branding: {
    logoUrl: string;
    faviconUrl: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    companyName: string;
    companyFullName: string;
  };
  
  // 功能配置
  features: {
    batchQuery: {
      enabled: boolean;
      maxItems: number;
      separator: string;
    };
    autoFormat: {
      enabled: boolean;
      trimWhitespace: boolean;
      removeEmptyLines: boolean;
    };
    export: {
      enabled: boolean;
      formats: string[];
    };
    history: {
      enabled: boolean;
      maxItems: number;
      storageKey: string;
    };
  };
}

// 默认配置
const defaultConfig: AppConfig = {
  deploy: {
    target: (process.env.DEPLOY_TARGET as 'static' | 'server') || 'static',
    mode: (process.env.NODE_ENV as 'development' | 'production') || 'development',
  },
  
  api: {
    baseURL: process.env.DEPLOY_TARGET === 'static'
      ? 'https://cbel-track.20990909.xyz'
      : '/api',
    officialAPI: 'http://cbel.pgs-log.com/edi/pubTracking',
    timeout: 30000,
    retry: {
      maxAttempts: 3,
      delay: 1000,
      backoff: 1.5,
    },
  },

  domains: {
    main: 'tracking.pgs-cbel.com',
    api: 'cbel-track.20990909.xyz',
  },
  
  site: {
    title: 'CBEL 物流轨迹查询',
    subtitle: '专业、快速、准确的物流跟踪服务',
    description: 'CBEL物流轨迹查询系统 - 专业的物流跟踪服务',
    keywords: '物流查询,轨迹跟踪,CBEL,快递查询,订单跟踪',
    author: 'CBEL 物流科技',
    version: '2.0.0',
  },
  
  branding: {
    logoUrl: '/logo.svg',
    faviconUrl: '/favicon.ico',
    primaryColor: '#2563eb',
    secondaryColor: '#10b981',
    accentColor: '#f59e0b',
    companyName: 'CBEL',
    companyFullName: 'CBEL 物流科技有限公司',
  },
  
  features: {
    batchQuery: {
      enabled: true,
      maxItems: 50,
      separator: '\n',
    },
    autoFormat: {
      enabled: true,
      trimWhitespace: true,
      removeEmptyLines: true,
    },
    export: {
      enabled: true,
      formats: ['json', 'csv', 'txt'],
    },
    history: {
      enabled: true,
      maxItems: 100,
      storageKey: 'cbel_query_history',
    },
  },
};

// 配置管理类
class ConfigManager {
  private config: AppConfig;
  private listeners: Map<string, Set<(value: any) => void>> = new Map();

  constructor(initialConfig: AppConfig = defaultConfig) {
    this.config = { ...initialConfig };

    // 延迟加载存储的配置，避免SSR/CSR不匹配
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.loadStoredConfig();
      }, 0);
    }
  }

  /**
   * 获取配置值
   */
  get<T = any>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let value: any = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue as T;
      }
    }
    
    return value as T;
  }

  /**
   * 设置配置值
   */
  set(path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let target: any = this.config;
    
    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
    
    const oldValue = target[lastKey];
    target[lastKey] = value;
    
    // 触发监听器
    this.notifyListeners(path, value, oldValue);
    
    // 保存到本地存储
    if (typeof window !== 'undefined') {
      this.saveConfig();
    }
  }

  /**
   * 批量更新配置
   */
  update(updates: Record<string, any>): void {
    for (const [path, value] of Object.entries(updates)) {
      this.set(path, value);
    }
  }

  /**
   * 监听配置变更
   */
  listen(path: string, callback: (value: any) => void): () => void {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    this.listeners.get(path)!.add(callback);
    
    // 返回取消监听的函数
    return () => {
      this.listeners.get(path)?.delete(callback);
    };
  }

  /**
   * 获取完整配置
   */
  getAll(): AppConfig {
    return { ...this.config };
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.config = { ...defaultConfig };
    if (typeof window !== 'undefined') {
      this.saveConfig();
    }
  }

  private notifyListeners(path: string, newValue: any, oldValue: any): void {
    if (this.listeners.has(path)) {
      this.listeners.get(path)!.forEach(callback => {
        try {
          callback(newValue);
        } catch (error) {
          console.error('配置监听器执行错误:', error);
        }
      });
    }
  }

  private loadStoredConfig(): void {
    try {
      const stored = localStorage.getItem('cbel_config');
      if (stored) {
        const storedConfig = JSON.parse(stored);
        this.config = this.deepMerge(this.config, storedConfig);
      }
    } catch (error) {
      console.warn('加载本地配置失败:', error);
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('cbel_config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('保存配置失败:', error);
    }
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
}

// 创建全局配置管理器实例
export const configManager = new ConfigManager();

// 便捷的配置访问函数
export const getConfig = <T = any>(path: string, defaultValue?: T): T => 
  configManager.get(path, defaultValue);

export const setConfig = (path: string, value: any): void => 
  configManager.set(path, value);

export const updateConfig = (updates: Record<string, any>): void => 
  configManager.update(updates);

// 导出默认配置
export { defaultConfig };
export default configManager;
