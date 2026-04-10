# 🛒 AI 跨境选品助手

> 专为跨境电商卖家打造的 AI 选品分析工具，集成 MiniMax AI、Google Trends 实时数据、TikTok Shop 潜力评估、Amazon 数据框架与批量对比功能。

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue?logo=python)](https://python.org)
[![Tornado](https://img.shields.io/badge/Tornado-6.x-orange)](https://www.tornadoweb.org)
[![MiniMax AI](https://img.shields.io/badge/AI-MiniMax--Text--01-purple)](https://www.minimaxi.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## ✨ 核心功能

### 🤖 AI 深度分析
- 输入产品名称 + 目标市场，一键获得完整选品报告
- 由 **MiniMax-Text-01** 大模型驱动，支持中英文输入
- 涵盖市场热度、竞争格局、利润空间、季节性、差异化建议等多维度

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

## 🚀 拓展功能

### 📈 SerpAPI · Google Trends 实时数据
- 配置 `SERPAPI_KEY` 后自动获取真实 Google Trends 搜索趋势
- 同步抓取 Google Shopping 真实价格区间
- 未配置时自动降级为 AI 估算，**不影响基础功能**

### 🎵 TikTok Shop 潜力分析
每份报告包含专属 TikTok Shop 评估模块：
- 病毒传播潜力（高 / 中 / 低）
- 主要内容切入角度 & 推荐视频形式
- 话题标签建议 & 达人层级匹配
- 店铺佣金区间 & 直播带货潜力评估

### 🏪 Amazon 数据框架
- BSR 排名估算 & 月搜索量
- PPC 建议出价 & FBA 费用估算
- Buy Box 竞争分析 & 评论增速
- 配置 `AMAZON_ACCESS_KEY` 后可升级为真实 SP-API 数据

### 🔍 批量产品对比
- 历史分析页面支持**多选**（最多 6 个产品）
- 多色叠加雷达图，一眼看出各产品优劣势
- 维度得分对比表，最高分自动高亮标绿
- 专属对比页面 `#/compare?ids=...`

### 🏭 1688 供应商直达链接
- 每份报告底部自动生成供应商搜索入口
- 覆盖：**1688** · **阿里巴巴国际站** · **GlobalSources** · **Made-in-China**
- 按产品名称 + 类目自动拼接搜索 URL

### 🖨️ PDF 一键导出
- 点击「导出 PDF」，调用浏览器原生打印为 PDF
- 打印 CSS 自动隐藏导航与按钮，保留图表颜色
- **零依赖**，无需安装任何额外库

---

## 🏗️ 技术架构

```
ai-product-selector/
├── backend/
│   ├── main.py          # Tornado 6 异步 Web 服务
│   ├── ai_engine.py     # MiniMax API + SerpAPI + Amazon 数据层
│   ├── .env             # 本地密钥（不提交 Git）
│   └── .env.example     # 配置模板
├── frontend/
│   └── index.html       # 单文件 React 18 SPA（Babel 转译）
├── start.sh             # 一键启动脚本
└── README.md
```

**技术选型**

| 层 | 技术 | 说明 |
|---|---|---|
| 后端框架 | Python Tornado 6 | 异步非阻塞，仅用标准库 |
| 数据库 | SQLite3 | 零配置，Python 内置 |
| 前端框架 | React 18 + Babel | CDN via jsDelivr（国内可访问）|
| 图表 | 纯 SVG / CSS | 零外部依赖，不依赖 Recharts |
| AI 模型 | MiniMax-Text-01 | `api.minimax.chat/v1/chat/completions` |
| HTTP 客户端 | urllib（标准库） | 无需 requests 库 |

---

## ⚡ 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/ai-product-selector.git
cd ai-product-selector
```

### 2. 配置 API 密钥

```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env`：

```env
# 必填：MiniMax AI（前往 https://www.minimaxi.com 获取）
MINIMAX_API_KEY=your_minimax_api_key_here

# 可选：SerpAPI（获取真实 Google Trends 数据，每月 100 次免费）
SERPAPI_KEY=your_serpapi_key_here

# 可选：Amazon SP-API（获取真实 BSR 数据，需要卖家账户）
AMAZON_ACCESS_KEY=your_aws_access_key
AMAZON_SECRET_KEY=your_aws_secret_key
AMAZON_ASSOCIATE_TAG=your_associate_tag
```

### 3. 一键启动

```bash
chmod +x start.sh
./start.sh
```

浏览器访问 **http://localhost:8080**

> **前提条件**：Python 3.9+，已安装 Tornado（`pip install tornado`）

---

## 📡 API 接口文档

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 服务状态 + AI 模式 + SerpAPI/Amazon 启用状态 |
| `POST` | `/api/analyses` | 创建新分析任务（异步执行）|
| `GET` | `/api/analyses` | 获取历史分析列表 |
| `GET` | `/api/analyses/{id}` | 获取单条分析详情 |
| `POST` | `/api/analyses/{id}/reanalyze` | 重新分析 |
| `POST` | `/api/analyses/{id}/sentiment` | 独立情感分析 |
| `GET` | `/api/compare?ids=id1,id2,id3` | 批量对比（最多 6 个）|
| `GET` | `/api/supplier-links?name=...&category=...` | 获取供应商搜索链接 |

### 请求示例

```bash
# 创建分析
curl -X POST http://localhost:8080/api/analyses \
  -H "Content-Type: application/json" \
  -d '{"product_name": "硅藻土杯垫", "target_market": "US", "category": "家居"}'

# 批量对比
curl "http://localhost:8080/api/compare?ids=1,2,3"

# 获取供应商链接
curl "http://localhost:8080/api/supplier-links?name=硅藻土杯垫&category=家居"
```

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
- [ ] 用户账户系统
- [ ] 产品收藏夹 & 标签分类
- [ ] 定时追踪（产品趋势变化提醒）
- [ ] Shopify / WooCommerce 插件集成
- [ ] 多语言界面（EN / JP / DE）

---

## 📄 许可证

MIT License © 2024

---

<p align="center">
  ⚡ Powered by <a href="https://www.minimaxi.com">MiniMax AI</a> · 为跨境电商卖家而生
</p>
