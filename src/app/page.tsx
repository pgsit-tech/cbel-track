'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Clock, MapPin, Package, Truck, Ship, Plane, FileText, CheckCircle } from 'lucide-react';
import { trackingApi, configApi } from '@/lib/api-client';

// 节点标签映射和图标配置
const NODE_CONFIG = {
  // 入仓相关
  'wmsIn': { label: '入仓', icon: Package, color: 'bg-blue-100 text-blue-800' },
  'pickup': { label: '提货', icon: Truck, color: 'bg-green-100 text-green-800' },
  'Booked': { label: '已预订', icon: Package, color: 'bg-gray-100 text-gray-800' },

  // 运输相关
  'etd': { label: '预计离港', icon: Ship, color: 'bg-orange-100 text-orange-800' },
  'atd': { label: '实际离港', icon: Ship, color: 'bg-red-100 text-red-800' },
  'eta': { label: '预计到港', icon: Ship, color: 'bg-yellow-100 text-yellow-800' },
  'arrivedPod': { label: '到港', icon: Ship, color: 'bg-purple-100 text-purple-800' },

  // 配送相关
  'transferOut': { label: '转运出库', icon: Truck, color: 'bg-indigo-100 text-indigo-800' },
  'Deliveried': { label: '已送达', icon: MapPin, color: 'bg-green-100 text-green-800' },
  'delivered': { label: '已送达', icon: MapPin, color: 'bg-green-100 text-green-800' },

  // 航空相关
  'flight': { label: '航班', icon: Plane, color: 'bg-sky-100 text-sky-800' },
  'airDeparture': { label: '航班起飞', icon: Plane, color: 'bg-blue-100 text-blue-800' },
  'airArrival': { label: '航班到达', icon: Plane, color: 'bg-green-100 text-green-800' },

  // 默认
  'default': { label: '物流节点', icon: MapPin, color: 'bg-gray-100 text-gray-800' }
};

// 状态映射函数
const getStatusText = (status: string | number): string => {
  const statusMap: Record<string, string> = {
    '0': '待处理',
    '1': '运输中',
    '2': '运输中',
    '3': '已完成',
    '4': '异常',
    '5': '取消',
    // 添加可能的文字状态
    '运输中': '运输中',
    '已完成': '已完成',
    '待处理': '待处理',
    '异常': '异常',
    '取消': '取消'
  };

  return statusMap[String(status)] || String(status);
};

// 获取节点配置
function getNodeConfig(node: string) {
  return NODE_CONFIG[node as keyof typeof NODE_CONFIG] || NODE_CONFIG.default;
}

// 进度时间轴组件
function ProgressTimeline({ orderData }: { orderData: any }) {
  const trackings = orderData.trackings || [];
  const headNodes = orderData.headNodes || [];

  // 定义主要节点的映射
  const mainSteps = [
    { key: 'Booked', label: '订舱', icon: Package },
    { key: 'pickup', label: '提货', icon: Truck }, // 修复：使用正确的节点名称
    { key: 'atd', label: '离港', icon: Ship },
    { key: 'arrivedPod', label: '到港', icon: Ship },
    { key: 'transferOut', label: '转运', icon: Truck },
    { key: 'Deliveried', label: '派送完成', icon: CheckCircle }
  ];

  // 从轨迹中找到对应的节点
  const getStepStatus = (stepKey: string) => {
    // 首先从headNodes中查找（包含主要节点如订舱、提货、离港等）
    const headNode = headNodes.find((node: any) => node.node === stepKey);
    if (headNode && headNode.time) {
      return {
        completed: true,
        date: headNode.time.replace(/-/g, '/'),
        time: headNode.time
      };
    }

    // 如果headNodes中没有找到或时间为空，再从trackings中查找
    const tracking = trackings.find((t: any) => t.node === stepKey);
    if (tracking) {
      return {
        completed: true,
        date: new Date(tracking.eventTime || tracking.time).toLocaleDateString('zh-CN'),
        time: tracking.eventTime || tracking.time
      };
    }

    // 特殊处理：如果是到港步骤且headNodes中时间为空，从trackings中查找实际到港信息
    if (stepKey === 'arrivedPod' && headNode && !headNode.time) {
      const arrivalTracking = trackings.find((t: any) =>
        t.context && t.context.includes('实际到港时间') || t.context && t.context.includes('Actual Arrival Date')
      );
      if (arrivalTracking) {
        // 从context中提取日期，格式如："实际到港时间 Actual Arrival Date：2025-04-12"
        const dateMatch = arrivalTracking.context.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          return {
            completed: true,
            date: dateMatch[1].replace(/-/g, '/'),
            time: dateMatch[1]
          };
        }
      }
    }

    return { completed: false, date: '', time: null };
  };

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
      <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        物流进度
      </h4>
      <div className="flex items-start justify-between relative px-6">
        {/* 完整的进度线 - 贯穿所有节点 */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-300"></div>

        {mainSteps.map((step) => {
          const status = getStepStatus(step.key);
          const IconComponent = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                status.completed
                  ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}>
                <IconComponent className="h-5 w-5" />
              </div>
              <div className="mt-2 text-center min-h-[3rem] flex flex-col justify-start">
                <div className={`text-xs font-medium ${status.completed ? 'text-blue-600' : 'text-gray-400'}`}>
                  {step.label}
                </div>
                {(status.date || step.key === 'Booked') && (
                  <div className="text-xs text-gray-500 mt-1">
                    {status.date}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 结果项组件
function TrackingResultItem({ result, index }: { result: any; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`p-4 rounded-lg border ${
        result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full ${
          result.success ? 'bg-green-500' : 'bg-red-500'
        }`}></span>
        <span className="font-medium text-lg">订单轨迹 {result.trackingNumber}</span>
        {result.success && result.data && result.data.jobNum && (
          <span className="font-mono text-green-600">{result.data.jobNum}</span>
        )}
        <span className={`text-sm ${
          result.success ? 'text-green-600' : 'text-red-600'
        }`}>
          {result.success ? '查询成功' : '查询失败'}
        </span>

        {/* 功能按钮组 */}
        <div className="ml-auto flex items-center gap-2">
          {result.success && (
            <button className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm">
              <FileText className="h-3 w-3" />
              签收单
            </button>
          )}
          {result.success && result.data && result.data.trackings && result.data.trackings.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  收起详情
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  展开详情 ({result.data.trackings.length}条)
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {result.success && result.data ? (
        <div className="space-y-4">
          {/* 订单基本信息 */}
          <div className="bg-blue-50 p-3 rounded-lg">
            {/* 2行2列网格布局，所有内容左对齐 */}
            <div className="grid grid-cols-2 gap-y-1 gap-x-4">
              {/* 第一行第一列：订单信息标题 */}
              <div className="text-sm font-medium text-blue-800">订单信息</div>
              {/* 第一行第二列：状态 */}
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-600">状态:</span>
                <span className="text-blue-600 font-medium">{getStatusText(result.data.status)}</span>
              </div>

              {/* 第二行第一列：始发地-目的地 */}
              <div className="text-sm text-blue-700">
                {result.data.location}
              </div>
              {/* 第二行第二列：包裹数 */}
              {result.data.pkgNum ? (
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-600">包裹数:</span>
                  <span className="text-orange-600 font-medium">{result.data.pkgNum}个</span>
                </div>
              ) : (
                <div></div>
              )}
            </div>
          </div>

          {/* 进度时间轴 */}
          {result.data.trackings && result.data.trackings.length > 0 && (
            <ProgressTimeline orderData={result.data} />
          )}



          {/* 最新动态 */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-1">最新动态</div>
            <div className="text-sm text-gray-600">{result.data.latestEvent}</div>
            <div className="text-xs text-gray-500 mt-2">
              更新时间: {new Date(result.data.updateTime).toLocaleString('zh-CN')}
            </div>
          </div>

          {/* 展开的详细轨迹 */}
          {isExpanded && result.data.trackings && result.data.trackings.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                完整轨迹记录 ({result.data.trackings.length}条)
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {result.data.trackings.map((tracking: any, trackingIndex: number) => {
                  const nodeConfig = getNodeConfig(tracking.node || '');
                  const IconComponent = nodeConfig.icon;

                  return (
                    <div key={trackingIndex} className="flex gap-3 p-3 bg-white rounded border-l-4 border-blue-200 hover:shadow-sm transition-shadow">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center shadow-sm">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(tracking.eventTime || tracking.time).toLocaleString('zh-CN')}
                          </span>
                          {tracking.node && (
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${nodeConfig.color}`}>
                              {nodeConfig.label}
                            </span>
                          )}
                          {/* 特殊处理：实际到港标签 */}
                          {!tracking.node && tracking.context &&
                           (tracking.context.includes('实际到港时间') || tracking.context.includes('Actual Arrival Date')) && (
                            <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
                              实际到港
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed mb-1">
                          {tracking.context}
                        </p>
                        {tracking.remark && (
                          <p className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            💡 备注: {tracking.remark}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-red-600">
          {result.error || '查询失败，请检查单号是否正确'}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [trackingNumbers, setTrackingNumbers] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // 加载网站配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await configApi.get();
        setSiteConfig(config);
      } catch (error) {
        console.error('加载配置失败:', error);
        // 即使加载失败，也设置一个默认配置以避免闪烁
        setSiteConfig({
          site: {
            title: 'CBEL 物流轨迹查询',
            subtitle: '专业、快速、准确的物流跟踪服务',
            logo: '',
            favicon: '',
            description: '专业的物流轨迹查询服务'
          },
          contact: {
            phone: '400-888-8888',
            email: 'support@cbel.com',
            address: '中国·上海',
            workingHours: ''
          },
          footer: {
            company: 'CBEL 物流科技',
            copyright: '© 2025 CBEL 物流科技有限公司. 保留所有权利.'
          }
        });
      } finally {
        setConfigLoading(false);
      }
    };
    loadConfig();
  }, []);

  const siteTitle = siteConfig?.site?.title || 'CBEL 物流轨迹查询';
  const siteSubtitle = siteConfig?.site?.subtitle || '';

  // 动态设置页面标题
  useEffect(() => {
    document.title = siteTitle;
  }, [siteTitle]);

  // 动态设置favicon
  useEffect(() => {
    if (siteConfig?.site?.favicon) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = siteConfig.site.favicon;
      } else {
        // 如果没有favicon link标签，创建一个
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = siteConfig.site.favicon;
        document.head.appendChild(newFavicon);
      }
    }
  }, [siteConfig?.site?.favicon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumbers.trim()) return;

    setIsLoading(true);

    try {
      const numbers = trackingNumbers.split('\n').filter(n => n.trim());
      const apiResults = [];

      // 逐个查询每个单号
      for (let i = 0; i < numbers.length; i++) {
        const number = numbers[i].trim();

        try {
          console.log(`查询单号: ${number}`);
          // 使用新的API客户端
          const result = await trackingApi.query(number);

          if (result.success && result.data && result.data.length > 0) {
            const trackingData = result.data[0]; // API返回的是数组，取第一个元素

            // 获取最新的轨迹信息
            const latestTracking = trackingData.trackings && trackingData.trackings.length > 0
              ? trackingData.trackings[trackingData.trackings.length - 1]
              : null;

            apiResults.push({
              trackingNumber: number,
              success: true,
              data: {
                status: trackingData.state || '运输中',
                location: `${trackingData.depCountry} → ${trackingData.destCountry}`,
                updateTime: latestTracking?.eventTime || trackingData.actTime || new Date().toISOString(),
                jobNum: trackingData.jobNum,
                carrier: trackingData.carrier,
                pkgNum: trackingData.pkgNum,
                shipmentType: trackingData.shipmentType,
                trackings: trackingData.trackings || [],
                headNodes: trackingData.headNodes || [], // 添加headNodes数据
                latestEvent: latestTracking?.context || '暂无最新动态'
              },
              error: null
            });
          } else {
            apiResults.push({
              trackingNumber: number,
              success: false,
              data: null,
              error: result.error || '未找到该单号的物流信息'
            });
          }
        } catch (error) {
          console.error(`查询单号 ${number} 失败:`, error);
          apiResults.push({
            trackingNumber: number,
            success: false,
            data: null,
            error: '网络错误或服务不可用'
          });
        }

        // 添加延迟避免请求过快
        if (i < numbers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setResults(apiResults);

    } catch (error) {
      console.error('批量查询失败:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 如果配置还在加载中，显示加载界面
  if (configLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            {siteConfig?.site?.darkLogo ? (
              <img
                src={siteConfig.site.darkLogo}
                alt="Logo"
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  // 如果深色Logo加载失败，显示默认logo
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center"
              style={{ display: siteConfig?.site?.darkLogo ? 'none' : 'flex' }}
            >
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900">{siteConfig?.footer?.company || 'CBEL 物流科技'}</h1>
              {siteConfig?.site?.description && (
                <p className="text-sm text-gray-600">{siteConfig.site.description}</p>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center py-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {siteTitle}
            </h2>
            {siteSubtitle && (
              <p className="text-lg text-gray-600 mb-8 mx-auto">
                {siteSubtitle}
              </p>
            )}
          </div>
        </section>

        {/* Search Form */}
        <section>
          <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  跟踪单号 ({trackingNumbers.split('\n').filter(n => n.trim()).length}/50)
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md min-h-[120px]"
                  placeholder="请输入跟踪单号，支持多个单号（每行一个）"
                  value={trackingNumbers}
                  onChange={(e) => setTrackingNumbers(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setTrackingNumbers('')}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isLoading}
                >
                  清空
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading || !trackingNumbers.trim()}
                >
                  {isLoading ? '查询中...' : '查询轨迹'}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Results */}
        {results.length > 0 && (
          <section>
            <div className="w-full max-w-4xl mx-auto space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">查询结果</h3>
                <div className="grid gap-4">
                  {results.map((result, index) => (
                    <TrackingResultItem key={index} result={result} index={index} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}


      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-2">{siteConfig?.footer?.company || 'CBEL 物流科技'}</h3>
                {siteConfig?.site?.description && (
                  <p className="text-gray-400">{siteConfig.site.description}</p>
                )}
              </div>
            </div>

            <div>
              <h5 className="text-lg font-semibold mb-4">联系信息</h5>
              <ul className="space-y-2 text-gray-400">
                <li>邮箱: {siteConfig?.contact?.email || 'support@cbel.com'}</li>
                <li>电话: {siteConfig?.contact?.phone || '400-888-8888'}</li>
                <li>地址: {siteConfig?.contact?.address || '中国·上海'}</li>
                {siteConfig?.contact?.workTime && (
                  <li>工作时间: {siteConfig.contact.workTime}</li>
                )}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>{siteConfig?.footer?.copyright || '© 2025 CBEL 物流科技有限公司. 保留所有权利.'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
