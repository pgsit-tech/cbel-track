/**
 * CBEL Tracking System - 轨迹查询状态管理
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  TrackingResult, 
  BatchTrackingResult, 
  QueryHistoryItem,
  LoadingState,
  TrackingFormData 
} from '@/types';
import { trackingAPI } from '@/lib/api';
import { generateId, parseBatchInput } from '@/lib/utils';

interface TrackingState {
  // 表单状态
  formData: TrackingFormData;
  
  // 查询状态
  isLoading: boolean;
  loadingMessage: string;
  progress: number;
  
  // 查询结果
  currentResults: BatchTrackingResult[];
  selectedResult: TrackingResult | null;
  
  // 历史记录
  queryHistory: QueryHistoryItem[];
  
  // 错误状态
  error: string | null;
  
  // 统计信息
  stats: {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
  };
}

interface TrackingActions {
  // 表单操作
  updateFormData: (data: Partial<TrackingFormData>) => void;
  resetForm: () => void;
  
  // 查询操作
  queryTracking: (trackingNumbers: string[]) => Promise<void>;
  queryTrackingNumber: (trackingNumber: string) => Promise<TrackingResult>;
  
  // 结果操作
  selectResult: (result: TrackingResult | null) => void;
  clearResults: () => void;
  
  // 历史记录操作
  addToHistory: (item: QueryHistoryItem) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  
  // 错误处理
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // 加载状态
  setLoading: (isLoading: boolean, message?: string, progress?: number) => void;
  
  // 统计操作
  updateStats: (successful: number, failed: number) => void;
  resetStats: () => void;
}

type TrackingStore = TrackingState & TrackingActions;

const initialFormData: TrackingFormData = {
  trackingNumbers: '',
  autoFormat: true,
  showDetails: true,
};

const initialState: TrackingState = {
  formData: initialFormData,
  isLoading: false,
  loadingMessage: '',
  progress: 0,
  currentResults: [],
  selectedResult: null,
  queryHistory: [],
  error: null,
  stats: {
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
  },
};

export const useTrackingStore = create<TrackingStore>()(
  devtools(
    (set, get) => ({
        ...initialState,

        // 表单操作
        updateFormData: (data) => {
          set((state) => ({
            formData: { ...state.formData, ...data }
          }), false, 'updateFormData');
        },

        resetForm: () => {
          set({ formData: initialFormData }, false, 'resetForm');
        },

        // 查询操作
        queryTracking: async (trackingNumbers: string[]) => {
          const { setLoading, setError, addToHistory, updateStats } = get();
          
          try {
            setLoading(true, '正在查询轨迹信息...', 0);
            setError(null);

            const results = await trackingAPI.queryBatchTracking(
              trackingNumbers,
              {
                onProgress: (completed, total) => {
                  const progress = Math.round((completed / total) * 100);
                  setLoading(true, `正在查询... (${completed}/${total})`, progress);
                }
              }
            );

            // 统计成功和失败的查询
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;

            set({ 
              currentResults: results,
              selectedResult: null 
            }, false, 'queryTracking');

            // 添加到历史记录
            const historyItem: QueryHistoryItem = {
              id: generateId(),
              trackingNumbers,
              timestamp: new Date().toISOString(),
              results
            };
            addToHistory(historyItem);

            // 更新统计
            updateStats(successful, failed);

            setLoading(false);

          } catch (error) {
            console.error('查询失败:', error);
            setError((error as Error).message);
            setLoading(false);
          }
        },

        queryTrackingNumber: async (trackingNumber: string) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true, '正在查询单个轨迹...', 0);
            setError(null);

            const result = await trackingAPI.queryTracking(trackingNumber);
            
            setLoading(false);
            return result;

          } catch (error) {
            console.error('单个查询失败:', error);
            setError((error as Error).message);
            setLoading(false);
            throw error;
          }
        },

        // 结果操作
        selectResult: (result) => {
          set({ selectedResult: result }, false, 'selectResult');
        },

        clearResults: () => {
          set({ 
            currentResults: [], 
            selectedResult: null 
          }, false, 'clearResults');
        },

        // 历史记录操作
        addToHistory: (item) => {
          set((state) => {
            const newHistory = [item, ...state.queryHistory];
            // 限制历史记录数量
            const maxItems = 100;
            if (newHistory.length > maxItems) {
              newHistory.splice(maxItems);
            }
            return { queryHistory: newHistory };
          }, false, 'addToHistory');
        },

        removeFromHistory: (id) => {
          set((state) => ({
            queryHistory: state.queryHistory.filter(item => item.id !== id)
          }), false, 'removeFromHistory');
        },

        clearHistory: () => {
          set({ queryHistory: [] }, false, 'clearHistory');
        },

        // 错误处理
        setError: (error) => {
          set({ error }, false, 'setError');
        },

        clearError: () => {
          set({ error: null }, false, 'clearError');
        },

        // 加载状态
        setLoading: (isLoading, message = '', progress = 0) => {
          set({ 
            isLoading, 
            loadingMessage: message, 
            progress 
          }, false, 'setLoading');
        },

        // 统计操作
        updateStats: (successful, failed) => {
          set((state) => ({
            stats: {
              totalQueries: state.stats.totalQueries + successful + failed,
              successfulQueries: state.stats.successfulQueries + successful,
              failedQueries: state.stats.failedQueries + failed,
            }
          }), false, 'updateStats');
        },

        resetStats: () => {
          set({
            stats: {
              totalQueries: 0,
              successfulQueries: 0,
              failedQueries: 0,
            }
          }, false, 'resetStats');
        },
      }),
    {
      name: 'tracking-store',
    }
  )
);

// 便捷的选择器hooks
export const useTrackingForm = () => useTrackingStore((state) => ({
  formData: state.formData,
  updateFormData: state.updateFormData,
  resetForm: state.resetForm,
}));

export const useTrackingQuery = () => useTrackingStore((state) => ({
  isLoading: state.isLoading,
  loadingMessage: state.loadingMessage,
  progress: state.progress,
  error: state.error,
  queryTracking: state.queryTracking,
  queryTrackingNumber: state.queryTrackingNumber,
  setError: state.setError,
  clearError: state.clearError,
}));

export const useTrackingResults = () => useTrackingStore((state) => ({
  currentResults: state.currentResults,
  selectedResult: state.selectedResult,
  selectResult: state.selectResult,
  clearResults: state.clearResults,
}));

export const useTrackingHistory = () => useTrackingStore((state) => ({
  queryHistory: state.queryHistory,
  addToHistory: state.addToHistory,
  removeFromHistory: state.removeFromHistory,
  clearHistory: state.clearHistory,
}));

export const useTrackingStats = () => useTrackingStore((state) => ({
  stats: state.stats,
  updateStats: state.updateStats,
  resetStats: state.resetStats,
}));

// 工具函数
export const parseTrackingInput = (input: string): string[] => {
  return parseBatchInput(input);
};

export const formatTrackingResults = (results: BatchTrackingResult[]) => {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    successRate: results.length > 0 ? (successful.length / results.length) * 100 : 0,
    results: {
      successful,
      failed
    }
  };
};
