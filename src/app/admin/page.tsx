'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ServerIcon,
  EyeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { statsApi, monitorApi } from '@/lib/api-client';

// 模拟统计数据
const mockStats = {
  totalQueries: 15847,
  todayQueries: 234,
  successRate: 98.5,
  avgResponseTime: 1.2,
  activeUsers: 89,
  systemStatus: 'healthy'
};

// 模拟最近查询记录
const mockRecentQueries = [
  { id: 1, trackingNumber: 'CBSZSEUS25032380', timestamp: '2025-01-03 14:30:25', status: 'success', responseTime: 1.1 },
  { id: 2, trackingNumber: '2025515460', timestamp: '2025-01-03 14:29:18', status: 'success', responseTime: 0.9 },
  { id: 3, trackingNumber: 'CBSZSENL25081862', timestamp: '2025-01-03 14:28:45', status: 'success', responseTime: 1.3 },
  { id: 4, trackingNumber: 'INVALID123', timestamp: '2025-01-03 14:27:32', status: 'failed', responseTime: 0.5 },
  { id: 5, trackingNumber: 'CBSZSEGB25060521', timestamp: '2025-01-03 14:26:15', status: 'success', responseTime: 1.0 }
];

// 统计卡片组件
function StatCard({ title, value, icon: Icon, color, trend }: any) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'} flex items-center mt-1`}>
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              {trend > 0 ? '+' : ''}{trend}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// 查询记录表格组件
function QueryTable({ queries }: { queries: any[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">最近查询记录</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                运单号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                查询时间
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                响应时间
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {queries.map((query) => (
              <tr key={query.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{query.trackingNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{query.timestamp}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    query.status === 'success' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {query.status === 'success' ? (
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircleIcon className="h-3 w-3 mr-1" />
                    )}
                    {query.status === 'success' ? '成功' : '失败'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{query.responseTime}s</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 系统状态组件
function SystemStatus({ monitorData }: { monitorData: any }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            正常
          </span>
        );
      case 'unhealthy':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            异常
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            错误
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            未知
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <ServerIcon className="h-5 w-5 text-blue-600 mr-2" />
        系统状态
      </h3>
      <div className="space-y-4">
        {monitorData?.endpoints?.map((endpoint: any, index: number) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{endpoint.name}</span>
            {getStatusBadge(endpoint.status)}
          </div>
        ))}

        {monitorData?.summary && (
          <>
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">接口总数</span>
                <span className="text-sm text-gray-900">{monitorData.summary.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">正常接口</span>
                <span className="text-sm text-green-600">{monitorData.summary.healthy}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">平均响应时间</span>
                <span className="text-sm text-gray-900">{monitorData.summary.averageResponseTime}ms</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState(mockStats);
  const [recentQueries, setRecentQueries] = useState(mockRecentQueries);
  const [monitorData, setMonitorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 加载数据
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 并发加载统计数据和监控数据
      const [statsData, monitorData] = await Promise.all([
        statsApi.getSummary(),
        monitorApi.get()
      ]);

      setStats({
        totalQueries: statsData.total,
        todayQueries: statsData.today,
        successRate: 98.5, // 暂时使用固定值
        avgResponseTime: 1.2, // 暂时使用固定值
        activeUsers: 89, // 暂时使用固定值
        systemStatus: 'healthy'
      });

      setMonitorData(monitorData);
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
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
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">系统概览</h1>
        <p className="text-gray-600">实时监控系统运行状态和查询统计</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="总查询次数"
          value={stats.totalQueries.toLocaleString()}
          icon={DocumentTextIcon}
          color="bg-blue-500"
          trend={12.5}
        />
        <StatCard
          title="今日查询"
          value={stats.todayQueries}
          icon={EyeIcon}
          color="bg-green-500"
          trend={8.2}
        />
        <StatCard
          title="成功率"
          value={`${stats.successRate}%`}
          icon={CheckCircleIcon}
          color="bg-purple-500"
          trend={0.3}
        />
        <StatCard
          title="平均响应时间"
          value={`${stats.avgResponseTime}s`}
          icon={ClockIcon}
          color="bg-orange-500"
          trend={-5.1}
        />
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 查询记录表格 */}
        <div className="lg:col-span-2">
          <QueryTable queries={recentQueries} />
        </div>

        {/* 系统状态 */}
        <div>
          <SystemStatus monitorData={monitorData} />
        </div>
      </div>

      {/* 快速操作 */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/stats"
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
            查看详细统计
          </a>
          <a
            href="/admin/config"
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ServerIcon className="h-5 w-5 text-gray-400 mr-2" />
            网站配置
          </a>
          <a
            href="/admin/monitor"
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ServerIcon className="h-5 w-5 text-gray-400 mr-2" />
            接口管理
          </a>
        </div>
      </div>
    </div>
  );
}
