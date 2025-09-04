/**
 * API客户端 - 统一的API调用接口
 * 支持静态部署和服务端部署两种模式
 */

import { getConfig } from './config';

// API响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

// 请求配置类型
export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
}

// API客户端类
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;

  constructor() {
    this.baseURL = getConfig('api.baseURL', '');
    this.timeout = getConfig('api.timeout', 30000);
    this.maxRetries = getConfig('api.retry.maxAttempts', 3);
  }

  /**
   * 获取完整的API URL
   */
  private getUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    // 如果是静态部署模式，使用Worker域名
    if (this.baseURL && this.baseURL !== '/api') {
      return `${this.baseURL}${endpoint}`;
    }
    
    // 否则使用相对路径
    return endpoint;
  }

  /**
   * 执行HTTP请求
   */
  private async executeRequest<T>(
    url: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, config.timeout || this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('请求超时，请稍后重试');
        }
        throw error;
      }
      
      throw new Error('网络请求失败');
    }
  }

  /**
   * 带重试的请求
   */
  private async requestWithRetry<T>(
    url: string,
    config: RequestConfig = {},
    attempt = 1
  ): Promise<ApiResponse<T>> {
    try {
      return await this.executeRequest<T>(url, config);
    } catch (error) {
      const maxRetries = config.retries || this.maxRetries;
      
      if (attempt < maxRetries) {
        const delay = getConfig('api.retry.delay', 1000) * Math.pow(
          getConfig('api.retry.backoff', 1.5), 
          attempt - 1
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.requestWithRetry<T>(url, config, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * GET请求
   */
  async get<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const url = this.getUrl(endpoint);
    const response = await this.requestWithRetry<T>(url, {
      ...config,
      method: 'GET',
    });

    if (!response.success) {
      throw new Error(response.error || '请求失败');
    }

    return response.data as T;
  }

  /**
   * POST请求
   */
  async post<T>(
    endpoint: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    const url = this.getUrl(endpoint);
    const response = await this.requestWithRetry<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.success) {
      throw new Error(response.error || '请求失败');
    }

    return response.data as T;
  }

  /**
   * PUT请求
   */
  async put<T>(
    endpoint: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    const url = this.getUrl(endpoint);
    const response = await this.requestWithRetry<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.success) {
      throw new Error(response.error || '请求失败');
    }

    return response.data as T;
  }

  /**
   * DELETE请求
   */
  async delete<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const url = this.getUrl(endpoint);
    const response = await this.requestWithRetry<T>(url, {
      ...config,
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.error || '请求失败');
    }

    return response.data as T;
  }
}

// 创建API客户端实例
const apiClient = new ApiClient();

// 具体的API方法
export const trackingApi = {
  /**
   * 查询物流信息
   */
  async query(trackingNumber: string) {
    return apiClient.get(`/api/tracking?trackingNumber=${encodeURIComponent(trackingNumber)}`);
  },
};

export const statsApi = {
  /**
   * 获取统计摘要
   */
  async getSummary() {
    return apiClient.get('/api/stats?type=summary');
  },

  /**
   * 获取图表数据
   */
  async getChartData(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    limit = 30
  ) {
    return apiClient.get(`/api/stats?type=chart&period=${period}&limit=${limit}`);
  },

  /**
   * 记录查询统计
   */
  async recordQuery(count = 1) {
    return apiClient.post('/api/stats', { count });
  },
};

export const configApi = {
  /**
   * 获取配置
   */
  async get() {
    return apiClient.get('/api/config');
  },

  /**
   * 保存配置
   */
  async save(config: any, password: string) {
    return apiClient.post('/api/config', { config, password });
  },
};

export const monitorApi = {
  /**
   * 获取监控数据
   */
  async get() {
    return apiClient.get('/api/monitor');
  },
};

// 导出API客户端实例
export default apiClient;
