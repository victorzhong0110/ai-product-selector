# 🛒 AI 跨境选品助手

> 专为跨境电商卖家打造的 AI 选品分析工具，集成 MiniMax AI、用户账户系统、产品标签管理、定时趋势追踪、Shopify/WooCommerce 导出、四语言界面与自定义 API Key 配置。

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue?logo=python)](https://python.org)
[![Tornado](https://img.shields.io/badge/Tornado-6.x-orange)](https://www.tornadoweb.org)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![MiniMax AI](https://img.shields.io/badge/AI-MiniMax--Text--01-purple)](https://www.minimaxi.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## ✨ 核心功能

### 🤖 AI 深度分析
- 输入产品名称 + 目标市场，一键获得完整选品报告
- 由 **MiniMax-Text-01** 大模型驱动，支持中英文输入
- 涵盖市场热度、竞争格局、利润空间、季节性、差异化建议等多维度
- 未配置 API Key 时自动降级为演示模式，**不影响界面体验**

### 📊 八维评分雷达图
- 纯 SVG 绘制，**零外部依赖**，中国网络环境无障碍加载
- 评分维度：市场需求 · 竞争强度 · 利润空间 · 季节性 · 差异化 · 供应链 · 物流友好度 · 品牌潜力

### 🌍 八大目标市场
| 代码 | 市场 | 代码 | 市场 |
|------|------|------|------|
| CN | 🇨🇳 中国（国内电商） | US | 🇺🇸 美国 |
| UK | 🇬🇧 英国 | DE | 🇩🇪 德国 |
| JP | 🇯🇵 日本 | FR | 🇫🇷 法国 |
| CA | 🇨🇦 加拿大 | AU | 🇦🇺 澳大利亚 |

---

## 🆕 新增功能

### 👤 用户账户系统
- 注册 / 登录 / 个人中心，JWT 认证（stdlib HMAC-SHA256，**无需额外依赖**）
- 密码使用 PBKDF2-SHA256 + 随机盐加密存储
- 未登录用户仍可使用基础分析功能（访客模式兼容）
- Navbar 右上角显示用户头像菜单（含退出登录）

### 🏷️ 产品收藏夹 & 标签分类
- 登录后可为产品创建自定义标签（自选颜色）
- 在产品详情页一键关联 / 取消标签
- 选品库支持按标签筛选，产品卡片展示彩色标签 pills

### ⏰ 定时趋势追踪
- 在产品详情页订阅追踪，可选频率：**24h / 72h / 168h**
- 后端 Tornado 后台 Worker 每小时轮询到期任务，自动重新分析
- 通过 `/api/tracking` 查看和管理所有追踪订阅

### 🛍️ Shopify / WooCommerce 导出
- 产品详情页一键导出标准格式 JSON：
  - **Shopify**：`title` · `body_html` · `vendor` · `product_type` · `tags` · `variants`（含价格）
  - **WooCommerce**：`name` · `description` · `regular_price` · `meta_data`（含全部 AI 评分）
- 支持复制到剪贴板 或 下载 `.json` 文件

### 🌐 多语言界面
- 界面支持 **中文 / English / 日本語 / Deutsch** 四语言无缝切换
- Navbar 右侧旗帜下拉菜单：🇨🇳 🇺🇸 🇯🇵 🇩🇪
- 语言偏好持久化到 `localStorage`，刷新不丢失
- 覆盖全部页面文案：导航栏、仪表盘、表单、状态标签、按钮等 80+ 字符串

### 🔑 自定义 API Key 设置
- 进入 **设置页面（⚙️）** 即可输入自己的 MiniMax API Key
- 登录用户：Key 加密存储于服务端 `user_settings` 表，分析时优先使用
- 访客用户：Key 存储于 `localStorage`，在请求中附带传递
- 密码框 + 显示/隐藏切换，不明文展示

---

## 🚀 其他拓展功能

### 📈 SerpAPI · Google Trends 实时数据
- 配置 `SERPAPI_KEY` 后自动获取真实 Google Trends 搜索趋势
- 未配置时自动降级为 AI 估算，**不影响基础功能**

### 🎵 TikTok Shop 潜力分析
- 病毒传播潜力（高 / 中 / 低）
- 内容切入角度 · 话题标签建议 · 达人层级匹配
- 店铺佣金区间 & 直播带货潜力评估

### 🏪 Amazon 数据框架
- BSR 排名估算 · PPC 建议出价 · FBA 费用估算
- Buy Box 竞争分析 & 评论增速
- 配置 `AMAZON_ACCESS_KEY` 后可升级为真实 SP-API 数据

### 🔍 批量产品对比
- 历史分析页面支持多选（最多 6 个产品）
- 多色叠加雷达图，维度得分对比表，最高分自动高亮

### 🏭 供应商直达链接
- 自动生成：**1688** · **阿里巴巴国际站** · **GlobalSources** · **Made-in-China**

### 🖨️ PDF 一键导出
- 调用浏览器原生打印为 PDF，打印 CSS 自动优化布局，**零依赖**

---

## 🏗️ 技术架构

```
ai-product-selector/
├── backend/
│   ├── main.py          # Tornado 6 异步 Web 服务（路由 + 所有 Handler）
│   ├── ai_engine.py     # MiniMax API + SerpAPI + Amazon 数据层
│   ├── .env             # 本地密钥（不提交 Git）
│   └── .env.example     # 配置模板
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # 路由 + Context Provider
│   │   ├── i18n.js              # 四语言翻译词典
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx  # JWT 认证状态
│   │   │   └── LangContext.jsx  # 语言切换状态
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AnalysisList.jsx
│   │   │   ├── AnalysisDetail.jsx
│   │   │   ├── NewAnalysis.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Settings.jsx
│   │   └── components/
│   │       ├── Navbar.jsx
│   │       ├── ProductCard.jsx
│   │       ├── ScoreGauge.jsx
│   │       └── RecommendationBadge.jsx
│   └── package.json
├── start.sh             # 一键启动脚本
└── README.md
```

**技术选型**

| 层 | 技术 | 说明 |
|---|---|---|
| 后端框架 | Python Tornado 6 | 异步非阻塞，仅用标准库 |
| 认证 | HMAC-SHA256 JWT + PBKDF2 | 无需 PyJWT，stdlib only |
| 数据库 | SQLite3 | 零配置，Python 内置 |
| 前端框架 | React 18 + Vite 5 | 现代构建工具链 |
| 样式 | Tailwind CSS 3 | 按需编译，体积极小 |
| 图表 | Recharts + 纯 SVG | 国内 CDN 友好 |
| AI 模型 | MiniMax-Text-01 | `api.minimax.chat/v1/chat/completions` |
| HTTP 客户端 | urllib（标准库） | 无需 requests 库 |

---

## ⚡ 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/ai-product-selector.git
cd ai-product-selector
```

### 2. 配置 API 密钥（可选）

```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env`：

```env
# 可选：MiniMax AI（前往 https://www.minimaxi.com 获取，不填则使用演示模式）
MINIMAX_API_KEY=your_minimax_api_key_here

# 可选：JWT 签名密钥（生产环境请务必修改）
JWT_SECRET=change-this-in-production

# 可选：SerpAPI（获取真实 Google Trends 数据，每月 100 次免费）
SERPAPI_KEY=your_serpapi_key_here

# 可选：Amazon SP-API（获取真实 BSR 数据，需要卖家账户）
AMAZON_ACCESS_KEY=your_aws_access_key
AMAZON_SECRET_KEY=your_aws_secret_key
AMAZON_ASSOCIATE_TAG=your_associate_tag
```

> 也可以在启动后进入 **设置页面（⚙️）** 直接在界面中填写 MiniMax API Key，无需修改文件。

### 3. 安装前端依赖

```bash
cd frontend && npm install
```

### 4. 一键启动

```bash
cd ..
chmod +x start.sh
./start.sh
```

浏览器访问 **http://localhost:8080**

> **前提条件**：Python 3.9+，Node.js 18+，已安装 Tornado（`pip install tornado`）

---

## 📡 API 接口文档

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/auth/register` | 注册新账户 `{email, username, password}` |
| `POST` | `/api/auth/login` | 登录 `{email, password}` → `{token, user}` |
| `GET` | `/api/auth/me` | 获取当前登录用户信息（需 Bearer Token）|

### 用户设置

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/settings` | 获取用户设置（API Key 脱敏返回）|
| `PUT` | `/api/settings` | 更新设置 `{minimax_api_key, language}` |

### 分析

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/analyses` | 创建新分析任务（异步执行）|
| `GET` | `/api/analyses` | 获取历史分析列表，支持 `tag_id` 筛选 |
| `GET` | `/api/analyses/{id}` | 获取单条分析详情 |
| `PATCH` | `/api/analyses/{id}` | 更新（标星、类目、描述）|
| `DELETE` | `/api/analyses/{id}` | 删除分析 |
| `POST` | `/api/analyses/{id}/reanalyze` | 重新分析 |
| `GET` | `/api/analyses/{id}/sentiment` | 获取情感分析结果 |
| `GET` | `/api/analyses/{id}/export/shopify` | 导出 Shopify Product JSON |
| `GET` | `/api/analyses/{id}/export/woocommerce` | 导出 WooCommerce Product JSON |

### 标签

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/tags` | 获取当前用户全部标签 |
| `POST` | `/api/tags` | 创建标签 `{name, color}` |
| `DELETE` | `/api/tags/{id}` | 删除标签 |
| `GET` | `/api/analyses/{id}/tags` | 获取产品已关联标签 |
| `POST` | `/api/analyses/{id}/tags` | 关联标签 `{tag_id}` |
| `DELETE` | `/api/analyses/{id}/tags/{tag_id}` | 取消关联标签 |

### 定时追踪

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/tracking` | 获取追踪订阅列表 |
| `POST` | `/api/tracking` | 订阅追踪 `{analysis_id, frequency_hours}` |
| `DELETE` | `/api/tracking/{id}` | 取消追踪订阅 |

### 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 服务状态 + AI 模式 |
| `GET` | `/api/dashboard` | 仪表盘统计数据 |
| `GET` | `/api/categories` | 获取全部产品类目 |

---

## 🎯 评分维度说明

| 维度 | 说明 | 参考权重 |
|------|------|---------|
| 市场需求 | 当前搜索热度 & 市场规模 | ★★★★★ |
| 竞争强度 | 现有卖家数量 & 入场难度 | ★★★★☆ |
| 利润空间 | 毛利率估算 & 定价弹性 | ★★★★★ |
| 季节性 | 全年销售稳定性 | ★★★☆☆ |
| 差异化 | 产品改良空间 & 独特性 | ★★★★☆ |
| 供应链 | 国内供应商成熟度 | ★★★☆☆ |
| 物流友好度 | 体积重量 & 运费成本 | ★★★☆☆ |
| 品牌潜力 | 长期品牌建设可行性 | ★★★★☆ |

---

## 🔧 可选集成配置

### SerpAPI（Google Trends 真实数据）
1. 前往 [serpapi.com](https://serpapi.com) 注册，每月 **100 次免费额度**
2. 在 `.env` 中设置 `SERPAPI_KEY=sk-...`
3. 重启服务，健康检查返回 `"serp_enabled": true`

### Amazon SP-API（真实 BSR 数据）
1. 需要 Amazon 卖家账户 + AWS IAM 凭证 + SP-API 授权
2. 详见 [Amazon SP-API 文档](https://developer-docs.amazon.com/sp-api/docs/get-started)
3. 配置 `.env` 中的三个 Amazon 变量后重启服务

---

## 🗺️ 开发路线图

- [x] MiniMax AI 分析引擎
- [x] 八维评分雷达图（纯 SVG）
- [x] 八大目标市场（含中国、日本）
- [x] SerpAPI Google Trends 实时数据
- [x] TikTok Shop 潜力分析模块
- [x] Amazon 数据框架（AI 估算 + SP-API 接口预留）
- [x] 批量产品对比（多色叠加雷达，最多 6 个）
- [x] 1688 / 阿里巴巴 / GlobalSources 供应商直达链接
- [x] PDF 一键导出（浏览器原生打印）
- [x] 用户账户系统（JWT 认证）
- [x] 产品收藏夹 & 标签分类
- [x] 定时追踪（产品趋势变化提醒）
- [x] Shopify / WooCommerce 导出集成
- [x] 多语言界面（EN / JP / DE / 中文）
- [x] 界面内自定义 API Key 设置

---

## 📄 许可证

MIT License © 2024

---

<p align="center">
  ⚡ Powered by <a href="https://www.minimaxi.com">MiniMax AI</a> · 为跨境电商卖家而生
</p>
