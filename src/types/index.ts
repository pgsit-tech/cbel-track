/**
 * CBEL Tracking System - TypeScript类型定义
 */

// 基础类型
export type DeployTarget = 'static' | 'server';
export type Environment = 'development' | 'production';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ExportFormat = 'json' | 'csv' | 'txt';

// 轨迹查询相关类型
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

// 查询选项
export interface QueryOptions {
  forceRefresh?: boolean;
  timeout?: number;
}

export interface BatchQueryOptions {
  onProgress?: (completed: number, total: number) => void;
  concurrency?: number;
}

// 配置相关类型
export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoff: number;
}

export interface APIConfig {
  baseURL: string;
  officialAPI: string;
  timeout: number;
  retry: RetryConfig;
}

export interface DeployConfig {
  target: DeployTarget;
  mode: Environment;
}

export interface DomainConfig {
  main: string;
  api: string;
}

export interface SiteConfig {
  title: string;
  subtitle: string;
  description: string;
  keywords: string;
  author: string;
  version: string;
}

export interface BrandingConfig {
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  companyName: string;
  companyFullName: string;
}

export interface BatchQueryConfig {
  enabled: boolean;
  maxItems: number;
  separator: string;
}

export interface AutoFormatConfig {
  enabled: boolean;
  trimWhitespace: boolean;
  removeEmptyLines: boolean;
}

export interface ExportConfig {
  enabled: boolean;
  formats: ExportFormat[];
}

export interface HistoryConfig {
  enabled: boolean;
  maxItems: number;
  storageKey: string;
}

export interface FeaturesConfig {
  batchQuery: BatchQueryConfig;
  autoFormat: AutoFormatConfig;
  export: ExportConfig;
  history: HistoryConfig;
}

export interface AppConfig {
  deploy: DeployConfig;
  api: APIConfig;
  domains: DomainConfig;
  site: SiteConfig;
  branding: BrandingConfig;
  features: FeaturesConfig;
}

// UI组件相关类型
export interface ToastOptions {
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

// 表单相关类型
export interface TrackingFormData {
  trackingNumbers: string;
  autoFormat: boolean;
  showDetails: boolean;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
  cleaned?: string;
}

// 历史记录类型
export interface QueryHistoryItem {
  id: string;
  trackingNumbers: string[];
  timestamp: string;
  results?: BatchTrackingResult[];
}

// 管理员相关类型
export interface AdminUser {
  username: string;
  role: 'admin' | 'user';
  lastLogin?: string;
}

export interface AdminConfig {
  site: Partial<SiteConfig>;
  branding: Partial<BrandingConfig>;
  features: Partial<FeaturesConfig>;
}

// 统计数据类型
export interface QueryStats {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageResponseTime: number;
  popularTrackingNumbers: string[];
}

export interface SystemStats {
  uptime: number;
  memoryUsage: number;
  cacheSize: number;
  activeConnections: number;
}

// 导出数据类型
export interface ExportData {
  format: ExportFormat;
  filename: string;
  content: string;
  mimeType: string;
}

// 错误类型
export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// 响应类型
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  timestamp: string;
}

// 分页类型
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 搜索类型
export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  dateRange?: {
    start: string;
    end: string;
  };
}

// 主题类型
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  borderRadius: string;
  fontFamily: string;
}

// 通知类型
export interface NotificationConfig {
  enabled: boolean;
  types: {
    success: boolean;
    error: boolean;
    warning: boolean;
    info: boolean;
  };
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  duration: number;
}

// 缓存类型
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'lfu';
}

// 日志类型
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enabled: boolean;
  maxEntries: number;
  persistToStorage: boolean;
}

// 性能监控类型
export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage: number;
  timestamp: string;
}

// 用户偏好类型
export interface UserPreferences {
  theme: ThemeConfig;
  notifications: NotificationConfig;
  language: string;
  timezone: string;
  autoSave: boolean;
  compactMode: boolean;
}

// 系统信息类型
export interface SystemInfo {
  version: string;
  buildTime: string;
  environment: Environment;
  deployTarget: DeployTarget;
  features: string[];
  dependencies: Record<string, string>;
}
