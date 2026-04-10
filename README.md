# AI 选品决策工具

> 面向跨境电商卖家的 AI Native 选品分析平台  
> 整合竞品数据、评论情感分析与搜索趋势，由 MiniMax AI 给出可执行的选品评分与理由

![Python](https://img.shields.io/badge/Python-3.8+-blue) ![Tornado](https://img.shields.io/badge/Tornado-6.x-orange) ![React](https://img.shields.io/badge/React-18-61dafb) ![SQLite](https://img.shields.io/badge/SQLite-3-lightgrey) ![MiniMax](https://img.shields.io/badge/AI-MiniMax--Text--01-blueviolet)

---

## 项目背景

传统选品工具（JungleScout、Helium10）只提供原始数据，用户还是要靠主观判断。本工具的核心差异：**AI 做最后一步决策**。

每次分析输出：

- 📊 **综合评分**（0–100）——五维加权，量化结论
- 🏷️ **选品建议**——强力推荐 / 推荐 / 持续观察 / 不建议
- ✅ **具体选品理由**——AI 提炼的核心支撑点
- ⚠️ **风险提示**——市场、竞争、供应链潜在风险
- 💡 **差异化机会点**——可直接执行的产品优化方向
- 🏪 **竞品分析**——竞品价格、评分、月销量
- 📈 **搜索趋势**——关键词热度与增长方向

---

## 技术架构

```
ai-product-selector/
├── backend/
│   ├── main.py          # Tornado 异步 HTTP 服务 + 全部 API 路由
│   ├── ai_engine.py     # MiniMax AI 分析引擎（含 Demo 降级模式）
│   ├── .env             # API Key 配置（不提交到 Git）
│   ├── .env.example     # 配置模板
│   └── ai_selector.db   # SQLite 数据库（运行时自动创建）
├── frontend/
│   └── index.html       # 单文件前端（React 18 + Tailwind + 纯 SVG 图表）
├── start.sh             # 一键启动脚本
└── README.md
```

### 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 后端框架 | Python Tornado 6 | 原生异步，无需额外依赖 |
| 数据库 | SQLite3（stdlib） | 零配置，单文件存储 |
| AI 引擎 | MiniMax-Text-01 | 产品分析、情感评分、趋势研判 |
| 前端 | React 18（jsDelivr CDN） | 单文件，无需 Node.js / npm |
| 图表 | 纯 SVG + CSS | 零外部依赖，雷达图 + 条形图 |
| 样式 | Tailwind CSS Play CDN | 无需构建工具 |

---

## 快速启动

### 前置要求

- Python 3.8+
- Tornado（`pip3 install tornado`）
- 现代浏览器（Chrome / Firefox / Safari）

### 一键启动

```bash
# 1. 克隆项目
git clone https://github.com/your-username/ai-product-selector.git
cd ai-product-selector

# 2. 配置 MiniMax API Key（可选，不配置则以 Demo 模式运行）
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入你的 Key：
# MINIMAX_API_KEY=sk-...

# 3. 启动
chmod +x start.sh
./start.sh
```

浏览器访问 **http://localhost:8080**

> 无 API Key 时以 **Demo 模式** 运行，自动生成结构真实的模拟选品数据，功能完整可体验。

---

## 接入 MiniMax AI

1. 前往 [MiniMax 开放平台](https://www.minimaxi.com) 获取 API Key
2. 编辑 `backend/.env`：
   ```
   MINIMAX_API_KEY=sk-...
   ```
3. 重启服务，底部状态栏显示 "⚡ MiniMax AI 已启用" 即表示生效

---

## API 文档

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查，返回 AI 模式（minimax / demo） |
| GET | `/api/dashboard` | 仪表盘汇总统计 |
| GET | `/api/analyses` | 分析列表（支持 search / category / recommendation / starred 筛选） |
| POST | `/api/analyses` | 新建分析（后台异步 AI 处理，立即返回 pending 状态） |
| GET | `/api/analyses/:id` | 获取单条分析详情 |
| PATCH | `/api/analyses/:id` | 更新（收藏 / 类目 / 备注） |
| DELETE | `/api/analyses/:id` | 删除 |
| POST | `/api/analyses/:id/reanalyze` | 重新触发 AI 分析 |
| GET | `/api/analyses/:id/sentiment` | 情感分析详情 |
| GET | `/api/categories` | 获取已有类目列表 |

### 创建分析 — 请求体示例

```json
{
  "name": "Portable Neck Fan",
  "category": "Electronics",
  "target_market": "US",
  "description": "Wearable bladeless fan for summer outdoor use",
  "reviews": [
    "Love this! Very quiet and portable.",
    "Battery dies after 3 hours, disappointed."
  ]
}
```

### 支持的目标市场

`CN` 🇨🇳 中国 · `US` 🇺🇸 美国 · `EU` 🇪🇺 欧盟 · `UK` 🇬🇧 英国 · `AU` 🇦🇺 澳大利亚 · `CA` 🇨🇦 加拿大 · `JP` 🇯🇵 日本 · `GLOBAL` 🌍 全球

---

## AI 评分维度

| 维度 | 权重 | 说明 |
|------|------|------|
| 市场需求 | 25% | 搜索量、购买意愿、细分市场规模 |
| 竞争空间 | 20% | 分数越高表示竞争越小、越易切入 |
| 利润空间 | 20% | 基于价格带与供应链成本估算 |
| 趋势热度 | 20% | 近期 Google / Amazon / TikTok 趋势方向 |
| 消费口碑 | 15% | 竞品评论情感分析提炼 |

**综合评分解读**

| 分数 | 建议 | 含义 |
|------|------|------|
| 80+ | ⭐ 强力推荐 | 多维优势明显，可优先投入 |
| 65–79 | ✅ 推荐 | 有机会，做好差异化可入场 |
| 50–64 | 👀 持续观察 | 风险较高，建议再观察一段时间 |
| <50 | ❌ 不建议 | 多维指标偏弱，风险大于机会 |

---

## 数据库 Schema

```sql
CREATE TABLE product_analyses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    target_market TEXT DEFAULT 'US',
    description TEXT,
    overall_score REAL,
    market_demand_score REAL,
    competition_score REAL,
    profit_margin_score REAL,
    trend_score REAL,
    sentiment_score REAL,
    ai_summary TEXT,
    ai_recommendation TEXT,    -- STRONG_BUY / BUY / HOLD / AVOID
    ai_reasons TEXT,           -- JSON array
    ai_risks TEXT,             -- JSON array
    ai_opportunities TEXT,     -- JSON array
    estimated_monthly_sales INTEGER,
    avg_price_usd REAL,
    competition_count INTEGER,
    top_competitors TEXT,      -- JSON array
    trend_keywords TEXT,       -- JSON array
    seasonality TEXT,
    platform_insights TEXT,    -- JSON object
    status TEXT DEFAULT 'pending',
    is_starred INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
);
```

---

## 扩展方向

- 接入 SerpAPI 获取真实 Google Trends 数据
- 接入 Amazon SP-API 获取真实 BSR 与评论
- 批量选品对比（多产品横向评分雷达图）
- 供应商推荐（1688 对应类目直链）
- 选品报告 PDF 一键导出
- 支持 TikTok Shop 平台专项分析

---

## .gitignore 建议

发布到 GitHub 前，确保 `backend/.env`（含 API Key）已在 `.gitignore` 中：

```gitignore
backend/.env
backend/ai_selector.db
__pycache__/
*.pyc
.DS_Store
```

---

## License

MIT
