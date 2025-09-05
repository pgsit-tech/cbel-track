'use client';

import React, { useState } from 'react';
import { Search, RotateCcw, CheckCircle } from 'lucide-react';
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

// 完整的结果项组件 - 匹配截图样式
function SimpleResultItem({ result }: { result: any; index: number }) {
  // 安全获取字符串值
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return 'N/A'; // 对象类型返回N/A，避免渲染错误
  };

  // 安全格式化时间
  const formatTime = (timeStr: any): string => {
    try {
      if (!timeStr) return 'N/A';
      const timeString = String(timeStr);
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return timeString;
      return date.toLocaleDateString('zh-CN').replace(/\//g, '-') + ' ' +
             date.toLocaleTimeString('zh-CN', {
               hour: '2-digit',
               minute: '2-digit',
               second: '2-digit'
             });
    } catch {
      return String(timeStr || 'N/A');
    }
  };

  // 安全检查result结构
  if (!result || typeof result !== 'object') {
    return <div className="p-4 text-red-600">数据格式错误</div>;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* 顶部信息区域 */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-start gap-3">
          {/* 绿色勾选标记 */}
          <div className="flex-shrink-0 mt-1">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* 运单号 */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-600 mb-1">
              {safeString(result.trackingNumber)}
            </h3>
            <div className="text-sm text-gray-600">
              状态: <span className="text-blue-600">
                {result.success ? getStatusText(safeString(result.data?.status) || '运输中') : '查询失败'}
              </span>
            </div>
          </div>

          {/* 右侧信息 */}
          {result.success && result.data && (
            <div className="text-right text-sm">
              <div className="text-gray-600 mb-1">
                系统单号: <span className="text-blue-600">{safeString(result.data.jobNum)}</span>
              </div>
              <div className="text-gray-600 mb-1">
                客户单号: <span className="text-blue-600">{safeString(result.trackingNumber)}</span>
              </div>
              <div className="text-gray-600">
                件数: <span className="text-blue-600">{safeString(result.data.pkgNum)}</span>
              </div>
            </div>
          )}
        </div>

        {/* 路线信息 */}
        {result.success && result.data && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">始发地:</span>
                <span className="text-blue-600 ml-1">{safeString(result.data.depCountry)}</span>
              </div>
              <div>
                <span className="text-gray-600">目的港:</span>
                <span className="text-blue-600 ml-1">{safeString(result.data.destCountry)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 节点信息区域 */}
      {result.success && result.data ? (
        <div className="p-4">
          {result.data.trackings && Array.isArray(result.data.trackings) && result.data.trackings.length > 0 ? (
            <div className="space-y-3">
              {result.data.trackings.map((tracking: any, trackingIndex: number) => {
                // 安全处理tracking对象
                if (!tracking || typeof tracking !== 'object') {
                  return null;
                }

                return (
                  <div key={trackingIndex} className="flex items-start gap-3">
                    {/* 蓝色圆形标记 */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>

                    {/* 节点内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-800 leading-relaxed">
                        {safeString(tracking.context) || '暂无描述'}
                      </div>
                      <div className="text-xs text-orange-500 mt-1">
                        {formatTime(tracking.eventTime || tracking.time)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              暂无轨迹信息
            </div>
          )}

          {/* 快递单号信息 */}
          {result.data.expressNumbers && Array.isArray(result.data.expressNumbers) && result.data.expressNumbers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">派送/小单动态</div>
              <div className="space-y-2">
                {result.data.expressNumbers.map((expressNum: any, expIndex: number) => (
                  <div key={expIndex} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-blue-600 hover:underline cursor-pointer">
                      {safeString(expressNum)}
                    </span>
                    <span className="text-xs text-gray-500">({expIndex + 1})</span>
                    <a
                      href={`https://www.17track.net/zh-cn/track#nums=${safeString(expressNum)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      17TRACK
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4">
          <div className="text-sm text-red-600">
            {safeString(result.error) || '查询失败，请检查单号是否正确'}
          </div>
        </div>
      )}
    </div>
  );
}



export default function SimpleQuery() {
  const [trackingNumbers, setTrackingNumbers] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // 解析输入的单号，支持换行和逗号分隔
  const parseTrackingNumbers = (input: string): string[] => {
    return input
      .split(/[\n,，]/) // 支持换行、英文逗号、中文逗号
      .map(num => num.trim())
      .filter(num => num.length > 0);
  };

  const handleQuery = async () => {
    if (!trackingNumbers.trim()) return;

    setIsLoading(true);

    try {
      const numbers = parseTrackingNumbers(trackingNumbers);
      console.log(`开始并发查询 ${numbers.length} 个单号:`, numbers);

      // 并发查询所有单号
      const queryPromises = numbers.map(async (number) => {
        try {
          console.log(`查询单号: ${number}`);
          const result: any = await trackingApi.query(number);

          if (result.success && result.data && result.data.length > 0) {
            const trackingData = result.data[0];
            const latestTracking = trackingData.trackings && trackingData.trackings.length > 0
              ? trackingData.trackings[trackingData.trackings.length - 1]
              : null;

            return {
              trackingNumber: number,
              success: true,
              data: {
                status: trackingData.state || '运输中',
                depCountry: trackingData.depCountry || 'N/A',
                destCountry: trackingData.destCountry || 'N/A',
                location: `${trackingData.depCountry} → ${trackingData.destCountry}`,
                updateTime: latestTracking?.eventTime || trackingData.actTime || new Date().toISOString(),
                jobNum: trackingData.jobNum,
                pkgNum: trackingData.pkgNum,
                carrier: trackingData.carrier,
                trackings: trackingData.trackings || [],
                // 检查是否有快递单号信息
                expressNumbers: trackingData.expressNumbers || trackingData.subTrackings || [],
                latestEvent: latestTracking?.context || '暂无最新动态'
              },
              error: null,
              timestamp: Date.now()
            };
          } else {
            return {
              trackingNumber: number,
              success: false,
              data: null,
              error: result.error || '未找到该单号的物流信息',
              timestamp: Date.now()
            };
          }
        } catch (error) {
          console.error(`查询单号 ${number} 失败:`, error);
          return {
            trackingNumber: number,
            success: false,
            data: null,
            error: '网络错误或服务不可用',
            timestamp: Date.now()
          };
        }
      });

      // 等待所有查询完成
      const newResults = await Promise.all(queryPromises);
      console.log(`查询完成，成功: ${newResults.filter(r => r.success).length}，失败: ${newResults.filter(r => !r.success).length}`);

      // 调试：检查结果结构
      console.log('newResults:', newResults);
      newResults.forEach((result, index) => {
        console.log(`Result ${index}:`, result);
      });

      // 将新结果添加到列表顶部
      setResults(prev => [...newResults, ...prev]);

      // 清空输入框
      setTrackingNumbers('');
    } catch (error) {
      console.error('批量查询失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setTrackingNumbers('');
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && !isLoading) {
      e.preventDefault();
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
                  运单号码 ({parseTrackingNumbers(trackingNumbers).length}/50)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-none"
                  placeholder="请输入运单号码，支持多个单号：&#10;• 每行一个单号&#10;• 或用逗号分隔"
                  value={trackingNumbers}
                  onChange={(e) => setTrackingNumbers(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
                <div className="text-xs text-gray-500 mt-1">
                  支持换行或逗号分隔多个单号，按 Ctrl+Enter 快速查询
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleQuery}
                  disabled={isLoading || !trackingNumbers.trim()}
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
                {results.map((result, index) => {
                  try {
                    return <SimpleResultItem key={`result-${index}-${Date.now()}`} result={result} index={index} />;
                  } catch (error) {
                    console.error('渲染错误:', error, 'result:', result);
                    return (
                      <div key={`error-${index}`} className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-red-600">渲染错误: {String(error)}</div>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
