/**
 * CBEL Tracking System - API调用模块
 * 支持多种部署模式的统一API调用
 */

import { getConfig } from './config';
import { retry, formatTrackingNumber } from './utils';

// API响应类型定义
export interface TrackingEvent {
  time: string;
  location: string;
  description: string;
  status: string;
}

export interface TrackingSummary {
  origin?: string;
  destination?: string;
  service?: string;
  weight?: string;
  pieces?: string;
}

export interface TrackingStatus {
  code: string;
  text: string;
  description: string;
}

export interface TrackingResult {
  trackingNumber: string;
  success: boolean;
  timestamp: string;
  data?: any;
  status?: TrackingStatus;
  events?: TrackingEvent[];
  summary?: TrackingSummary;
  error?: string;
}

export interface BatchTrackingResult {
  index: number;
  trackingNumber: string;
  success: boolean;
  data?: TrackingResult;
  error?: string;
}

/**
 * API客户端类
 */
export class TrackingAPI {
  private cache = new Map<string, { data: TrackingResult; timestamp: number }>();
  private requestQueue = new Map<string, Promise<TrackingResult>>();

  /**
   * 查询单个轨迹信息
   */
  async queryTracking(
    trackingNumber: string,
    options: {
      forceRefresh?: boolean;
      timeout?: number;
    } = {}
  ): Promise<TrackingResult> {
    if (!trackingNumber || typeof trackingNumber !== 'string') {
      throw new Error('跟踪单号不能为空');
    }

    // 清理和格式化单号
    const cleanNumber = formatTrackingNumber(trackingNumber);
    
    // 检查缓存
    const cacheKey = `tracking_${cleanNumber}`;
    if (!options.forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < 300000) { // 5分钟缓存
        return cached.data;
      }
    }

    // 检查是否已有相同请求在进行中
    if (this.requestQueue.has(cleanNumber)) {
      return await this.requestQueue.get(cleanNumber)!;
    }

    // 创建请求Promise
    const requestPromise = this.performQuery(cleanNumber, options);
    this.requestQueue.set(cleanNumber, requestPromise);

    try {
      const result = await requestPromise;
      
      // 缓存结果
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } finally {
      // 清理请求队列
      this.requestQueue.delete(cleanNumber);
    }
  }

  /**
   * 批量查询轨迹信息
   */
  async queryBatchTracking(
    trackingNumbers: string[],
    options: {
      onProgress?: (completed: number, total: number) => void;
      concurrency?: number;
    } = {}
  ): Promise<BatchTrackingResult[]> {
    if (!Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
      throw new Error('跟踪单号数组不能为空');
    }

    const maxBatch = getConfig('features.batchQuery.maxItems', 50);
    if (trackingNumbers.length > maxBatch) {
      throw new Error(`批量查询最多支持${maxBatch}个单号`);
    }

    const results: BatchTrackingResult[] = [];
    const concurrency = Math.min(options.concurrency || 5, trackingNumbers.length);
    
    // 分批处理
    const chunks = this.chunkArray(trackingNumbers, concurrency);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (number, index) => {
        try {
          const result = await this.queryTracking(number);
          return {
            index: results.length + index,
            trackingNumber: number,
            success: true,
            data: result
          };
        } catch (error) {
          return {
            index: results.length + index,
            trackingNumber: number,
            success: false,
            error: (error as Error).message
          };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);

      // 更新进度
      if (options.onProgress) {
        options.onProgress(results.length, trackingNumbers.length);
      }
    }

    return results;
  }

  /**
   * 执行实际的API查询
   */
  private async performQuery(
    trackingNumber: string,
    options: { timeout?: number } = {}
  ): Promise<TrackingResult> {
    const apiBaseURL = getConfig('api.baseURL');
    const timeout = options.timeout || getConfig('api.timeout', 30000);
    const retryConfig = getConfig('api.retry');

    // 构建查询URL
    const queryUrl = `${apiBaseURL}/api/tracking`;
    const params = new URLSearchParams({
      trackingRef: trackingNumber,
      timestamp: Date.now().toString()
    });

    const fullUrl = `${queryUrl}?${params.toString()}`;

    try {
      const response = await retry(
        () => this.fetchWithTimeout(fullUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Origin': typeof window !== 'undefined' ? window.location.origin : '',
          }
        }, timeout),
        retryConfig.maxAttempts,
        retryConfig.delay,
        retryConfig.backoff
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // 验证响应数据
      if (!data || (data.code && data.code !== 200)) {
        throw new Error(data.message || data.error || '查询失败');
      }

      // 格式化返回数据
      return this.formatTrackingData(data, trackingNumber);

    } catch (error) {
      console.error('API查询失败:', error);

      // 如果是网络错误，尝试直接调用官方API
      if (error instanceof TypeError || (error as Error).message.includes('fetch')) {
        console.log('尝试直接调用官方API');
        return await this.queryOfficialAPI(trackingNumber, options);
      }

      throw error;
    }
  }

  /**
   * 直接调用官方API（备用方案）
   */
  private async queryOfficialAPI(
    trackingNumber: string,
    options: { timeout?: number } = {}
  ): Promise<TrackingResult> {
    const officialURL = getConfig('api.officialAPI');
    const timeout = options.timeout || getConfig('api.timeout', 30000);

    const params = new URLSearchParams({
      trackingRef: trackingNumber,
      host: 'cbel.pgs-log.com',
      noSubTracking: 'false',
      url: '/public-tracking'
    });

    const fullUrl = `${officialURL}?${params.toString()}`;

    try {
      const response = await this.fetchWithTimeout(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }, timeout);

      if (!response.ok) {
        throw new Error(`官方API错误 ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.formatTrackingData(data, trackingNumber);

    } catch (error) {
      console.error('官方API调用失败:', error);
      throw new Error('查询服务暂时不可用，请稍后重试');
    }
  }

  /**
   * 带超时的fetch请求
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 格式化轨迹数据
   */
  private formatTrackingData(rawData: any, trackingNumber: string): TrackingResult {
    const result: TrackingResult = {
      trackingNumber: trackingNumber,
      success: true,
      timestamp: new Date().toISOString(),
      data: rawData
    };

    // 提取关键信息
    if (rawData) {
      result.status = this.extractStatus(rawData);
      result.events = this.extractEvents(rawData);
      result.summary = this.extractSummary(rawData);
    }

    return result;
  }

  /**
   * 提取状态信息
   */
  private extractStatus(data: any): TrackingStatus {
    return {
      code: data.status || data.statusCode || 'unknown',
      text: data.statusText || data.status || '未知状态',
      description: data.description || ''
    };
  }

  /**
   * 提取事件列表
   */
  private extractEvents(data: any): TrackingEvent[] {
    if (data.events && Array.isArray(data.events)) {
      return data.events.map((event: any) => ({
        time: event.time || event.timestamp,
        location: event.location || event.place,
        description: event.description || event.desc,
        status: event.status
      }));
    }
    return [];
  }

  /**
   * 提取摘要信息
   */
  private extractSummary(data: any): TrackingSummary {
    return {
      origin: data.origin || data.from,
      destination: data.destination || data.to,
      service: data.service || data.serviceType,
      weight: data.weight,
      pieces: data.pieces || data.quantity
    };
  }

  /**
   * 数组分块
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 创建全局API实例
export const trackingAPI = new TrackingAPI();

// 便捷函数
export const queryTracking = (trackingNumber: string, options?: any) =>
  trackingAPI.queryTracking(trackingNumber, options);

export const queryBatchTracking = (trackingNumbers: string[], options?: any) =>
  trackingAPI.queryBatchTracking(trackingNumbers, options);
