'use client';

import { useState, useEffect } from 'react';
import {
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ClockIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

interface EndpointStatus {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'error';
  statusCode: number;
  responseTime: number;
  lastChecked: string;
  error: string | null;
  details: {
    ok: boolean;
    status: number;
    statusText: string;
    hasData: boolean;
  };
}

interface MonitorData {
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    error: number;
    averageResponseTime: number;
    lastChecked: string;
  };
  endpoints: EndpointStatus[];
}

export default function MonitorPage() {
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // 加载监控数据
  useEffect(() => {
    loadMonitorData();
  }, []);

  // 自动刷新
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadMonitorData();
      }, 30000); // 30秒刷新一次
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadMonitorData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/monitor');
      const data = await response.json();
      
      if (data.success) {
        setMonitorData(data.data);
      }
    } catch (error) {
      console.error('加载监控数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 手动检查所有接口
  const checkAllEndpoints = async () => {
    try {
      setChecking(true);
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMonitorData(data.data);
      }
    } catch (error) {
      console.error('检查接口失败:', error);
    } finally {
      setChecking(false);
    }
  };

  // 检查单个接口
  const checkSingleEndpoint = async (endpointName: string) => {
    try {
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: endpointName }),
      });
      
      const data = await response.json();
      
      if (data.success && monitorData) {
        // 更新单个接口的状态
        const updatedEndpoints = monitorData.endpoints.map(endpoint =>
          endpoint.name === endpointName ? data.data : endpoint
        );
        
        setMonitorData({
          ...monitorData,
          endpoints: updatedEndpoints
        });
      }
    } catch (error) {
      console.error('检查接口失败:', error);
    }
  };

  // 获取状态图标和样式
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'healthy':
        return {
          icon: CheckCircleIcon,
          text: '正常',
          className: 'bg-green-100 text-green-800',
          iconClassName: 'text-green-500'
        };
      case 'unhealthy':
        return {
          icon: ExclamationTriangleIcon,
          text: '异常',
          className: 'bg-yellow-100 text-yellow-800',
          iconClassName: 'text-yellow-500'
        };
      case 'error':
        return {
          icon: XCircleIcon,
          text: '错误',
          className: 'bg-red-100 text-red-800',
          iconClassName: 'text-red-500'
        };
      default:
        return {
          icon: ExclamationTriangleIcon,
          text: '未知',
          className: 'bg-gray-100 text-gray-800',
          iconClassName: 'text-gray-500'
        };
    }
  };

  // 格式化时间
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 概览统计 */}
      {monitorData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ServerIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">接口总数</p>
                <p className="text-2xl font-bold text-gray-900">{monitorData.summary.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">正常接口</p>
                <p className="text-2xl font-bold text-green-600">{monitorData.summary.healthy}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">异常接口</p>
                <p className="text-2xl font-bold text-red-600">
                  {monitorData.summary.unhealthy + monitorData.summary.error}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">平均响应时间</p>
                <p className="text-2xl font-bold text-gray-900">{monitorData.summary.averageResponseTime}ms</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 操作栏 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={checkAllEndpoints}
              disabled={checking}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              {checking ? '检查中...' : '检查所有接口'}
            </button>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoRefresh" className="ml-2 text-sm text-gray-700">
                自动刷新 (30秒)
              </label>
            </div>
          </div>

          {monitorData?.summary && (
            <div className="text-sm text-gray-500">
              最后更新: {formatTime(monitorData.summary.lastChecked)}
            </div>
          )}
        </div>
      </div>

      {/* 接口列表 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">接口监控详情</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  接口名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  响应时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态码
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最后检查
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monitorData?.endpoints?.map((endpoint, index) => {
                const statusDisplay = getStatusDisplay(endpoint.status);
                const StatusIcon = statusDisplay.icon;
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{endpoint.name}</div>
                        <div className="text-sm text-gray-500">{endpoint.url}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                        <StatusIcon className={`h-3 w-3 mr-1 ${statusDisplay.iconClassName}`} />
                        {statusDisplay.text}
                      </span>
                      {endpoint.error && (
                        <div className="text-xs text-red-600 mt-1">{endpoint.error}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <SignalIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{endpoint.responseTime}ms</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${
                        endpoint.statusCode >= 200 && endpoint.statusCode < 300
                          ? 'text-green-600'
                          : endpoint.statusCode >= 400
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                        {endpoint.statusCode || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(endpoint.lastChecked)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => checkSingleEndpoint(endpoint.name)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        重新检查
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
