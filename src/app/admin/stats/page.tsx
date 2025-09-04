'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { statsApi } from '@/lib/api-client';

interface StatsData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  total: number;
  lastUpdated: string;
}

interface ChartDataPoint {
  date: string;
  count: number;
}

export default function StatsPage() {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 加载统计数据
  useEffect(() => {
    loadStatsData();
    loadChartData();
  }, [selectedPeriod]);

  const loadStatsData = async () => {
    try {
      setLoading(true);
      const data = await statsApi.getSummary();
      setStatsData(data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const data = await statsApi.getChartData(selectedPeriod, 30);
      setChartData(data);
    } catch (error) {
      console.error('加载图表数据失败:', error);
    }
  };

  // 手动刷新数据
  const refreshData = async () => {
    try {
      setRefreshing(true);
      await Promise.all([loadStatsData(), loadChartData()]);
    } finally {
      setRefreshing(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    switch (selectedPeriod) {
      case 'daily':
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      case 'weekly':
        return `第${dateString.split('-W')[1]}周`;
      case 'monthly':
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' });
      case 'yearly':
        return dateString;
      default:
        return dateString;
    }
  };

  // 计算增长率
  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // 获取前一期数据用于计算增长率
  const getPreviousPeriodData = () => {
    if (!chartData || chartData.length < 2) return 0;
    return chartData[chartData.length - 2]?.count || 0;
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
      {/* 操作栏 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">查询统计分析</h2>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              刷新数据
            </button>
          </div>
          
          {statsData && (
            <div className="text-sm text-gray-500">
              最后更新: {new Date(statsData.lastUpdated).toLocaleString('zh-CN')}
            </div>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <EyeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">今日查询</p>
                <p className="text-2xl font-bold text-gray-900">{statsData.today.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">本周查询</p>
                <p className="text-2xl font-bold text-gray-900">{statsData.thisWeek.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">本月查询</p>
                <p className="text-2xl font-bold text-gray-900">{statsData.thisMonth.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">本年查询</p>
                <p className="text-2xl font-bold text-gray-900">{statsData.thisYear.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总查询量</p>
                <p className="text-2xl font-bold text-gray-900">{statsData.total.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图表区域 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">查询趋势图</h3>
          <div className="flex space-x-2">
            {[
              { key: 'daily', label: '日' },
              { key: 'weekly', label: '周' },
              { key: 'monthly', label: '月' },
              { key: 'yearly', label: '年' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as any)}
                className={`px-3 py-1 text-sm rounded-md ${
                  selectedPeriod === period.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* 简单的柱状图 */}
        <div className="space-y-4">
          {chartData.length > 0 ? (
            <div className="space-y-2">
              {chartData.slice(-15).map((item, index) => {
                const maxCount = Math.max(...chartData.map(d => d.count));
                const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-20 text-sm text-gray-600 text-right">
                      {formatDate(item.date)}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div
                        className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(width, 2)}%` }}
                      >
                        {item.count > 0 && (
                          <span className="text-white text-xs font-medium">
                            {item.count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              暂无数据
            </div>
          )}
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">详细数据</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  查询次数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  增长率
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chartData.slice(-10).reverse().map((item, index) => {
                const previousCount = index < chartData.length - 1 ? chartData[chartData.length - 2 - index]?.count || 0 : 0;
                const growthRate = calculateGrowthRate(item.count, previousCount);
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {index < chartData.length - 1 ? (
                        <span className={`${
                          growthRate > 0 ? 'text-green-600' : growthRate < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {growthRate > 0 ? '+' : ''}{growthRate}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
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
