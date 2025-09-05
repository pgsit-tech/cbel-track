'use client';

import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, CheckCircle, Clock, MapPin, Package } from 'lucide-react';
import { trackingApi } from '@/lib/api-client';

// 状态映射函数
const getStatusText = (status: string | number): string => {
  const statusMap: Record<string, string> = {
    '0': '待处理',
    '1': '运输中',
    '2': '运输中',
    '3': '已完成',
    '4': '异常',
    '5': '取消',
    '运输中': '运输中',
    '已完成': '已完成',
    '待处理': '待处理',
    '异常': '异常',
    '取消': '取消'
  };

  return statusMap[String(status)] || String(status);
};

// 简化的结果项组件
function SimpleResultItem({ result, index }: { result: any; index: number }) {
  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* 绿色勾选标记 */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 min-w-0">
          {/* 第一行：编号和状态 */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {result.trackingNumber}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              result.success 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {result.success ? getStatusText(result.data?.status || '运输中') : '查询失败'}
            </span>
          </div>

          {result.success && result.data ? (
            <>
              {/* 第二行：路线信息 */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                <span>{result.data.location}</span>
                {result.data.jobNum && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {result.data.jobNum}
                  </span>
                )}
              </div>

              {/* 第三行：最新动态 */}
              <div className="text-sm text-gray-700 mb-2">
                <span className="font-medium">最新:</span> {result.data.latestEvent}
              </div>

              {/* 第四行：更新时间 */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>更新时间: {formatTime(result.data.updateTime)}</span>
                {result.data.pkgNum && (
                  <span className="ml-2 flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {result.data.pkgNum}个包裹
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-red-600">
              {result.error || '查询失败，请检查单号是否正确'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SimpleQuery() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleQuery = async () => {
    if (!trackingNumber.trim()) return;

    setIsLoading(true);

    try {
      const number = trackingNumber.trim();
      console.log(`查询单号: ${number}`);
      
      const result = await trackingApi.query(number);

      if (result.success && result.data && result.data.length > 0) {
        const trackingData = result.data[0];
        const latestTracking = trackingData.trackings && trackingData.trackings.length > 0
          ? trackingData.trackings[trackingData.trackings.length - 1]
          : null;

        const newResult = {
          trackingNumber: number,
          success: true,
          data: {
            status: trackingData.state || '运输中',
            location: `${trackingData.depCountry} → ${trackingData.destCountry}`,
            updateTime: latestTracking?.eventTime || trackingData.actTime || new Date().toISOString(),
            jobNum: trackingData.jobNum,
            pkgNum: trackingData.pkgNum,
            latestEvent: latestTracking?.context || '暂无最新动态'
          },
          error: null,
          timestamp: Date.now()
        };

        // 添加到结果列表顶部，保持最新查询在前
        setResults(prev => [newResult, ...prev]);
      } else {
        const errorResult = {
          trackingNumber: number,
          success: false,
          data: null,
          error: result.error || '未找到该单号的物流信息',
          timestamp: Date.now()
        };
        setResults(prev => [errorResult, ...prev]);
      }

      // 清空输入框
      setTrackingNumber('');
    } catch (error) {
      console.error(`查询单号 ${trackingNumber} 失败:`, error);
      const errorResult = {
        trackingNumber: trackingNumber.trim(),
        success: false,
        data: null,
        error: '网络错误或服务不可用',
        timestamp: Date.now()
      };
      setResults(prev => [errorResult, ...prev]);
      setTrackingNumber('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setTrackingNumber('');
    setResults([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleQuery();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* 左侧查询面板 */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* 标题 */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">查件系统</h1>
          </div>

          {/* 查询表单 */}
          <div className="p-6 flex-1">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  运单号码
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入运单号码"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleQuery}
                  disabled={isLoading || !trackingNumber.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="w-4 h-4" />
                  {isLoading ? '查询中...' : '查询'}
                </button>
                <button
                  onClick={handleClear}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  清空
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧结果面板 */}
        <div className="flex-1 flex flex-col">
          {/* 结果头部 */}
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">查询结果</h2>
              <span className="text-sm text-gray-500">
                当前共 {results.length} 条查询记录
              </span>
            </div>
          </div>

          {/* 结果列表 */}
          <div className="flex-1 p-6 overflow-y-auto">
            {results.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无查询记录</p>
                  <p className="text-sm mt-2">请在左侧输入运单号码进行查询</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <SimpleResultItem key={`${result.trackingNumber}-${result.timestamp}`} result={result} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
