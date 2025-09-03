'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { 
  QuestionMarkCircleIcon, 
  DocumentTextIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// FAQ数据
const faqData = [
  {
    id: 1,
    question: "支持哪些类型的运单号？",
    answer: "我们支持两种主要格式的运单号：\n1. 纯数字格式：如 2025515420\n2. 字母数字混合格式：如 CBSZSEUS25032380\n系统会自动识别运单号格式并调用相应的查询接口。"
  },
  {
    id: 2,
    question: "可以同时查询多少个运单号？",
    answer: "系统支持批量查询，最多可以同时查询50个运单号。请在输入框中每行输入一个运单号，系统会并发处理所有查询请求。"
  },
  {
    id: 3,
    question: "查询结果显示哪些信息？",
    answer: "查询结果包含以下信息：\n• 订单基本信息（始发地、目的地、状态、包裹数）\n• 物流进度（订舱、提货、离港、到港、转运、派送完成）\n• 完整轨迹记录（详细的时间节点和事件描述）\n• 最新动态（最近的物流更新信息）"
  },
  {
    id: 4,
    question: "为什么有些运单号查询不到结果？",
    answer: "可能的原因包括：\n1. 运单号输入错误，请检查格式和数字\n2. 运单号尚未在系统中生成记录\n3. 运单号已过期或已删除\n4. 网络连接问题导致查询失败\n请确认运单号正确后重试，如仍有问题请联系客服。"
  },
  {
    id: 5,
    question: "数据更新频率是多少？",
    answer: "我们的系统直接连接官方API，数据实时同步。物流信息通常在实际事件发生后的1-2小时内更新到系统中。"
  },
  {
    id: 6,
    question: "如何理解物流状态？",
    answer: "物流状态说明：\n• 待处理：订单已创建，等待处理\n• 运输中：货物正在运输途中\n• 已完成：货物已成功送达收货人\n• 异常：运输过程中出现异常情况\n• 取消：订单已被取消"
  }
];

// FAQ组件
function FAQItem({ faq }: { faq: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-gray-900">{faq.question}</span>
        {isOpen ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <div className="text-gray-600 whitespace-pre-line">
            {faq.answer}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CBEL 物流轨迹查询</h1>
                <p className="text-sm text-gray-600 hidden sm:block">帮助中心</p>
              </div>
            </div>

            <nav className="flex items-center space-x-6">
              <a href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                返回首页
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">帮助中心</h1>
          <p className="text-lg text-gray-600">
            欢迎使用CBEL物流轨迹查询系统，这里有您需要的所有帮助信息
          </p>
        </div>

        {/* 快速导航 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">使用指南</h3>
            </div>
            <p className="text-gray-600 mb-4">
              详细的使用说明和操作步骤，帮助您快速上手系统功能。
            </p>
            <a href="#usage" className="text-blue-600 hover:text-blue-700 font-medium">
              查看详情 →
            </a>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <QuestionMarkCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">常见问题</h3>
            </div>
            <p className="text-gray-600 mb-4">
              用户最常遇到的问题和解决方案，快速找到您需要的答案。
            </p>
            <a href="#faq" className="text-blue-600 hover:text-blue-700 font-medium">
              查看详情 →
            </a>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <PhoneIcon className="h-8 w-8 text-purple-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">联系我们</h3>
            </div>
            <p className="text-gray-600 mb-4">
              如果您需要进一步的帮助，请通过以下方式联系我们的客服团队。
            </p>
            <a href="#contact" className="text-blue-600 hover:text-blue-700 font-medium">
              查看详情 →
            </a>
          </div>
        </div>

        {/* 使用指南 */}
        <section id="usage" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
            使用指南
          </h2>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  第一步：输入运单号
                </h3>
                <p className="text-gray-600 mb-2">
                  在首页的输入框中输入您要查询的运单号。系统支持：
                </p>
                <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
                  <li>单个运单号查询</li>
                  <li>批量查询（最多50个，每行一个）</li>
                  <li>自动识别数字和字母数字格式</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  第二步：点击查询
                </h3>
                <p className="text-gray-600">
                  点击"查询轨迹"按钮，系统会自动处理您的查询请求。批量查询时，系统会并发处理所有运单号以提高查询效率。
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  第三步：查看结果
                </h3>
                <p className="text-gray-600 mb-2">
                  查询完成后，您可以看到：
                </p>
                <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
                  <li>订单基本信息（状态、包裹数、路线）</li>
                  <li>物流进度可视化（6个主要节点）</li>
                  <li>最新动态信息</li>
                  <li>完整轨迹记录（点击展开查看详情）</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 常见问题 */}
        <section id="faq" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <QuestionMarkCircleIcon className="h-6 w-6 text-green-600 mr-2" />
            常见问题
          </h2>
          
          <div className="space-y-4">
            {faqData.map((faq) => (
              <FAQItem key={faq.id} faq={faq} />
            ))}
          </div>
        </section>

        {/* 联系我们 */}
        <section id="contact" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <PhoneIcon className="h-6 w-6 text-purple-600 mr-2" />
            联系我们
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">客服联系方式</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">客服热线：400-888-8888</span>
                </div>
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">邮箱：support@cbel.com</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">服务时间：周一至周五 9:00-18:00</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">技术支持</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-gray-600 mb-1">如遇技术问题，请提供：</p>
                    <ul className="list-disc list-inside text-sm text-gray-500 ml-2">
                      <li>具体的运单号</li>
                      <li>问题描述和截图</li>
                      <li>使用的浏览器版本</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 注意事项 */}
        <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
            重要提示
          </h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>请确保运单号输入正确，避免查询失败</li>
            <li>系统数据直连官方API，确保信息准确性</li>
            <li>批量查询时请耐心等待，避免重复提交</li>
            <li>如遇查询异常，请稍后重试或联系客服</li>
          </ul>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>© 2025 CBEL 物流科技有限公司. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
