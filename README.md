# CBEL 物流轨迹查询系统

🚀 现代化的物流轨迹查询系统，基于 Next.js 14 构建，提供完整的管理后台和统计分析功能。

## ✨ 核心特性

### � 查询功能
- **智能识别**: 自动识别数字和字母数字两种运单号格式
- **批量查询**: 支持最多50个单号同时查询
- **实时跟踪**: 完整的物流轨迹记录展示
- **状态映射**: 智能转换数字状态为可读文字
- **响应式设计**: 完美适配桌面、平板、手机设备

### �️ 管理后台
- **安全登录**: 密码保护的管理系统
- **网站配置**: 动态修改网站标题、联系信息、页脚等
- **接口监控**: 实时检查API可用性和响应时间
- **统计分析**: 日/周/月/年查询统计和趋势图表
- **数据管理**: 完整的配置和统计数据管理

### 📊 数据统计
- **多维度统计**: 按日、周、月、年统计查询量
- **趋势分析**: 可视化图表展示查询趋势
- **实时更新**: 查询统计实时记录和更新
- **数据持久化**: SQLite数据库存储（需迁移到D1）

### 🎨 用户体验
- **现代化UI**: 基于Tailwind CSS的精美界面
- **交互式FAQ**: 完整的帮助中心系统
- **加载状态**: 优雅的加载动画和状态提示
- **错误处理**: 友好的错误提示和处理机制

## 🏗️ 技术栈

### 前端框架
- **Next.js 14** - React全栈框架，支持SSR和静态生成
- **TypeScript** - 类型安全的JavaScript超集
- **Tailwind CSS** - 原子化CSS框架
- **Lucide React** - 现代化图标库

### 数据存储
- **SQLite** - 本地数据库（当前实现）
- **Cloudflare D1** - 推荐的云端SQLite数据库
- **Better SQLite3** - 高性能Node.js SQLite驱动

### 部署平台
- **Cloudflare Pages** - 静态网站托管（推荐）
- **Cloudflare Workers** - 边缘计算平台
- **Docker** - 容器化部署支持

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone https://github.com/pgsit-tech/cbel-track.git
cd cbel-tracking

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 2. 管理后台访问

- **管理后台地址**: http://localhost:3000/admin
- **登录密码**: `admin123`
- **功能模块**:
  - 仪表板: 系统概览和快速操作
  - 网站配置: 修改网站标题、联系信息等
  - 接口管理: 监控API状态和响应时间
  - 统计分析: 查看查询统计和趋势图表

### 3. 测试数据

系统提供以下测试单号：
- `2025515460` - 数字格式单号
- `CBSZSEUS25032380` - 字母数字格式单号
- `CBSZSENL25081862` - 字母数字格式单号

### 4. 环境变量配置

创建 `.env.local` 文件（可选）：

```env
# 数据库配置（当前使用SQLite，建议迁移到D1）
DATABASE_URL=./data/cbel-tracking.db

# API配置
NEXT_PUBLIC_API_TIMEOUT=30000
```

## 📦 部署方案

### ⚠️ 重要提醒：数据库迁移

**当前问题**: 项目使用SQLite数据库，与Cloudflare Pages/Workers不兼容。

**解决方案**: 需要迁移到Cloudflare D1数据库：

```bash
# 1. 安装Wrangler CLI
npm install -g wrangler

# 2. 登录Cloudflare
wrangler login

# 3. 创建D1数据库
wrangler d1 create cbel-tracking

# 4. 修改代码使用D1 API
# 更新 src/lib/database.ts 文件

# 5. 配置wrangler.toml
# 添加D1数据库绑定
```

### 方案一：Cloudflare Pages + D1 (推荐)

**优势**:
- ✅ 完全免费（有限额）
- ✅ 全球CDN加速
- ✅ 自动HTTPS
- ✅ 边缘计算
- ✅ 自定义域名支持

**部署步骤**:
1. 完成D1数据库迁移
2. 推送代码到GitHub
3. 连接Cloudflare Pages到GitHub仓库
4. 配置构建设置
5. 绑定D1数据库

### 方案二：Docker部署

适用于VPS或本地部署：

```bash
# 使用Docker Compose
docker-compose up -d

# 或使用Docker
docker build -t cbel-tracking .
docker run -p 3000:3000 cbel-tracking
```

**优势**:
- ✅ 完整的Next.js功能
- ✅ 服务端渲染
- ✅ SQLite数据库可用
- ✅ 完全控制

## 📁 项目结构

```
cbel-tracking/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 主页面
│   │   ├── help/page.tsx         # 帮助中心
│   │   ├── admin/                # 管理后台
│   │   │   ├── page.tsx          # 仪表板
│   │   │   ├── config/page.tsx   # 网站配置
│   │   │   ├── monitor/page.tsx  # 接口管理
│   │   │   ├── stats/page.tsx    # 统计分析
│   │   │   └── layout.tsx        # 管理后台布局
│   │   └── api/                  # API路由
│   │       ├── tracking/route.ts # 查询API
│   │       ├── config/route.ts   # 配置API
│   │       ├── stats/route.ts    # 统计API
│   │       └── monitor/route.ts  # 监控API
│   ├── lib/
│   │   └── database.ts           # 数据库操作
│   └── scripts/
│       └── migrate-to-sqlite.ts  # 数据迁移脚本
├── data/                         # 数据文件
│   ├── cbel-tracking.db          # SQLite数据库
│   ├── config.json               # 配置备份
│   └── stats.json                # 统计备份
├── public/                       # 静态资源
├── package.json                  # 项目配置
├── next.config.ts                # Next.js配置
├── tailwind.config.ts            # Tailwind配置
├── wrangler.toml                 # Cloudflare Workers配置
└── PROJECT_STATUS_20250904.md    # 项目状态文档
```

## 🔧 开发指南

### 添加新功能

1. **新增页面**: 在 `src/app/` 下创建新的页面文件
2. **新增API**: 在 `src/app/api/` 下创建新的路由文件
3. **数据库操作**: 在 `src/lib/database.ts` 中添加新的数据库方法
4. **样式修改**: 使用Tailwind CSS类名进行样式调整

### 数据库操作

当前使用SQLite数据库，包含三个主要表：
- `config` - 网站配置数据
- `stats` - 查询统计数据
- `query_logs` - 查询日志记录

### API端点

- `GET /api/config` - 获取网站配置
- `POST /api/config` - 更新网站配置
- `GET /api/stats` - 获取统计数据
- `POST /api/stats` - 记录查询统计
- `GET /api/monitor` - 获取接口状态
- `POST /api/tracking` - 查询物流轨迹

## 🚨 已知问题

### 1. 数据库兼容性问题
- **问题**: SQLite不兼容Cloudflare Pages/Workers
- **影响**: 无法部署到Cloudflare平台
- **解决方案**: 迁移到Cloudflare D1数据库
- **优先级**: 高

### 2. 环境变量配置
- **问题**: 部分配置硬编码在代码中
- **解决方案**: 使用环境变量进行配置
- **优先级**: 中

## 📈 项目状态

- **完成度**: 85%
- **核心功能**: ✅ 完成
- **管理后台**: ✅ 完成
- **数据存储**: ⚠️ 需要迁移到D1
- **部署配置**: ❌ 待完成

详细状态请查看 `PROJECT_STATUS_20250904.md` 文件。

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- **项目仓库**: https://github.com/pgsit-tech/cbel-track
- **问题反馈**: https://github.com/pgsit-tech/cbel-track/issues
- **邮箱**: support@cbel.com

---

**开发时间**: 2025年9月4日
**最后更新**: 2025年9月4日
