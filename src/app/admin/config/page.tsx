'use client';

import { useState, useEffect } from 'react';
import {
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { configApi } from '@/lib/api-client';

interface SiteConfig {
  site: {
    title: string;
    subtitle: string;
    logo: string;
    favicon: string;
    description: string;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
    workTime: string;
  };
  footer: {
    company: string;
    copyright: string;
  };
}

export default function ConfigPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [password, setPassword] = useState('');

  // 加载配置
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await configApi.get();

      // 验证和清理数据结构，确保与接口匹配
      const cleanedData: SiteConfig = {
        site: {
          title: data.site?.title || 'CBEL 物流轨迹查询',
          subtitle: data.site?.subtitle || '专业、快速、准确的物流跟踪服务',
          logo: data.site?.logo || '/logo.png',
          favicon: data.site?.favicon || '/favicon.ico',
          description: data.site?.description || '专业的物流轨迹查询服务'
        },
        contact: {
          phone: data.contact?.phone || '400-888-8888',
          email: data.contact?.email || 'support@cbel.com',
          address: data.contact?.address || '中国·上海',
          workTime: data.contact?.workTime || '周一至周五 9:00-18:00'
        },
        footer: {
          company: data.footer?.company || 'CBEL 物流科技有限公司',
          copyright: data.footer?.copyright || '© 2025 CBEL 物流科技有限公司. 保留所有权利.'
        }
      };

      setConfig(cleanedData);
    } catch (error) {
      console.error('加载配置失败:', error);
      setMessage({ type: 'error', text: `加载配置失败: ${error instanceof Error ? error.message : '未知错误'}` });
    } finally {
      setLoading(false);
    }
  };

  // 保存配置
  const saveConfig = async () => {
    if (!config || !password) {
      setMessage({ type: 'error', text: '请输入管理员密码' });
      return;
    }

    try {
      setSaving(true);
      await configApi.save(config, password);
      setMessage({ type: 'success', text: '配置保存成功' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '保存配置失败' });
    } finally {
      setSaving(false);
    }
  };

  // 更新配置字段
  const updateConfig = (path: string[], value: any) => {
    if (!config) return;
    
    const newConfig = { ...config };
    let current: any = newConfig;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    setConfig(newConfig);
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-xl mb-4">⚠️</div>
        <p className="text-gray-500 mb-4">配置加载失败</p>
        <button
          onClick={loadConfig}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 消息提示 */}
      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* 网站基本信息 */}
      <div className="bg-white shadow-sm border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CogIcon className="h-5 w-5 text-blue-600 mr-2" />
          网站基本信息
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              网站标题
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.site.title}
              onChange={(e) => updateConfig(['site', 'title'], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              网站副标题
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.site.subtitle}
              onChange={(e) => updateConfig(['site', 'subtitle'], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo路径
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.site.logo}
              onChange={(e) => updateConfig(['site', 'logo'], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favicon路径
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.site.favicon}
              onChange={(e) => updateConfig(['site', 'favicon'], e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              网站描述
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.site.description}
              onChange={(e) => updateConfig(['site', 'description'], e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 联系信息 */}
      <div className="bg-white shadow-sm border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">联系信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              客服电话
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.contact.phone}
              onChange={(e) => updateConfig(['contact', 'phone'], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱地址
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.contact.email}
              onChange={(e) => updateConfig(['contact', 'email'], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              公司地址
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.contact.address}
              onChange={(e) => updateConfig(['contact', 'address'], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              工作时间
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.contact.workTime}
              onChange={(e) => updateConfig(['contact', 'workTime'], e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 页脚信息 */}
      <div className="bg-white shadow-sm border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">页脚信息</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                公司名称
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.footer.company}
                onChange={(e) => updateConfig(['footer', 'company'], e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                版权信息
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.footer.copyright}
                onChange={(e) => updateConfig(['footer', 'copyright'], e.target.value)}
              />
            </div>
          </div>


        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>
    </div>
  );
}
