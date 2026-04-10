"""
AI 选品决策工具 — Backend API
Tornado + SQLite3 (stdlib only, no external packages needed)
"""
import tornado.ioloop
import tornado.web
import tornado.gen
import sqlite3
import json
import uuid
import os
import random
import asyncio
import urllib.request
import urllib.error
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

# ─── Config ───────────────────────────────────────────

# Load .env manually (no python-dotenv needed)
_env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(_env_path):
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "ai_selector.db")
PORT = int(os.getenv("PORT", 8000))
executor = ThreadPoolExecutor(max_workers=4)

# Import AI engine after env is loaded
from ai_engine import analyze_product_with_minimax, analyze_sentiment_minimax, has_api_key, MINIMAX_MODEL

# ─── Database ─────────────────────────────────────────

def get_conn():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    conn.execute("""
    CREATE TABLE IF NOT EXISTS product_analyses (
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
        ai_recommendation TEXT,
        ai_reasons TEXT,
        ai_risks TEXT,
        ai_opportunities TEXT,
        estimated_monthly_sales INTEGER,
        avg_price_usd REAL,
        competition_count INTEGER,
        top_competitors TEXT,
        trend_keywords TEXT,
        seasonality TEXT,
        platform_insights TEXT,
        status TEXT DEFAULT 'pending',
        is_starred INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
    )
    """)
    conn.execute("""
    CREATE TABLE IF NOT EXISTS review_batches (
        id TEXT PRIMARY KEY,
        product_analysis_id TEXT,
        source TEXT,
        reviews_raw TEXT,
        sentiment_breakdown TEXT,
        top_pain_points TEXT,
        top_praises TEXT,
        created_at TEXT
    )
    """)
    conn.commit()
    conn.close()
    print("✅ Database initialized at", DATABASE_PATH)

def row_to_dict(row):
    if row is None:
        return None
    d = dict(row)
    for json_field in ['ai_reasons','ai_risks','ai_opportunities','top_competitors','trend_keywords','platform_insights']:
        if d.get(json_field) and isinstance(d[json_field], str):
            try:
                d[json_field] = json.loads(d[json_field])
            except Exception:
                pass
    d['is_starred'] = bool(d.get('is_starred', 0))
    return d

# ─── AI Engine (Demo Mode) ─────────────────────────────

DEMO_CATEGORIES = {
    "Electronics":       {"demand":(70,90),"competition":(40,65),"margin":(45,70),"trend":(60,85),"price":(15,120)},
    "Home & Garden":     {"demand":(60,80),"competition":(50,70),"margin":(50,75),"trend":(55,80),"price":(10,80)},
    "Sports & Outdoors": {"demand":(65,85),"competition":(45,65),"margin":(55,80),"trend":(65,88),"price":(12,100)},
    "Beauty & Health":   {"demand":(72,92),"competition":(55,75),"margin":(60,85),"trend":(70,92),"price":(8,60)},
    "Pet Supplies":      {"demand":(68,88),"competition":(40,60),"margin":(52,78),"trend":(72,90),"price":(6,50)},
    "General":           {"demand":(60,85),"competition":(45,70),"margin":(48,75),"trend":(58,82),"price":(10,90)},
}

def rand(lo, hi):
    return round(random.uniform(lo, hi), 1)

def generate_demo_analysis(name, category):
    cat = DEMO_CATEGORIES.get(category, DEMO_CATEGORIES["General"])
    demand   = rand(*cat["demand"])
    compete  = rand(*cat["competition"])
    margin   = rand(*cat["margin"])
    trend    = rand(*cat["trend"])
    sentiment= rand(65, 92)
    overall  = round(demand*0.25 + compete*0.20 + margin*0.20 + trend*0.20 + sentiment*0.15, 1)

    rec = "STRONG_BUY" if overall>=78 else "BUY" if overall>=65 else "HOLD" if overall>=50 else "AVOID"
    price = rand(*cat["price"])

    competitors = []
    names = ["BrandX Store","TechPro Direct","ValueGoods Co.","PrimeSeller"]
    ratings = [4.2, 4.5, 3.8, 4.7]
    for i in range(3):
        competitors.append({
            "name": names[i],
            "price_usd": round(price * random.uniform(0.8, 1.3), 2),
            "rating": ratings[i],
            "review_count": random.randint(400, 9000),
            "monthly_sales_est": random.randint(300, 5600),
            "strengths": ["Strong brand recognition","Fast shipping","Good reviews"],
            "weaknesses": ["Higher price point","Limited variants"]
        })

    keywords = [
        {"keyword": f"{name.lower()} review",        "volume":"HIGH",   "growth":"+32%","platform":"Google"},
        {"keyword": f"best {name.lower()} 2024",     "volume":"MEDIUM", "growth":"+18%","platform":"Google"},
        {"keyword": f"{name.lower()} unboxing",      "volume":"HIGH",   "growth":"+55%","platform":"TikTok"},
        {"keyword": f"buy {name.lower()} online",    "volume":"MEDIUM", "growth":"+12%","platform":"Amazon"},
    ]

    summary = (
        f"**{name}** shows {'strong' if overall>=70 else 'moderate'} potential in the "
        f"{category} category. With an overall score of {overall}/100, this product "
        f"{'is well-positioned for launch' if rec in ['STRONG_BUY','BUY'] else 'requires further validation'}. "
        f"Market demand is {'high' if demand>75 else 'moderate'} and competition is "
        f"{'manageable' if compete>55 else 'intense'}."
    )

    return {
        "overall_score": overall,
        "market_demand_score": demand,
        "competition_score": compete,
        "profit_margin_score": margin,
        "trend_score": trend,
        "sentiment_score": sentiment,
        "ai_recommendation": rec,
        "ai_summary": summary,
        "ai_reasons": [
            f"Strong search interest with {int(demand)}% demand index in {category}",
            "Manageable competition landscape with room for differentiation",
            f"Healthy profit margins at {int(margin)}% score",
            "Trending upward on TikTok and Amazon searches in past 90 days",
        ],
        "ai_risks": [
            "Seasonal demand fluctuation may impact Q1 revenue",
            "Copycat products from low-cost suppliers risk price erosion",
            "Amazon algorithm changes may affect organic visibility",
        ],
        "ai_opportunities": [
            "Bundle with complementary accessories to increase AOV",
            "TikTok Shop influencer campaign for viral reach",
            "Private label version with unique color / feature differentiation",
        ],
        "estimated_monthly_sales": random.randint(300, 8000),
        "avg_price_usd": price,
        "competition_count": random.randint(20, 500),
        "top_competitors": competitors,
        "trend_keywords": keywords,
        "seasonality": random.choice(["HIGH","MEDIUM","LOW"]),
        "platform_insights": {
            "amazon":  {"avg_rating": round(random.uniform(3.9,4.6),1), "opportunity": "Long-tail keyword gap in subcategory search"},
            "tiktok":  {"hashtag_views": f"{random.randint(10,500)}M",  "opportunity": "Organic unboxing + lifestyle demo content"},
            "shopify": {"avg_conversion": f"{round(random.uniform(1.5,4.2),1)}%", "opportunity": "DTC brand differentiation through storytelling"},
        }
    }

async def run_analysis_async(analysis_id, name, category, target_market, description, reviews):
    """Run AI analysis in background — uses MiniMax API or demo fallback"""
    conn = get_conn()
    try:
        conn.execute("UPDATE product_analyses SET status='analyzing', updated_at=? WHERE id=?",
                     (datetime.utcnow().isoformat(), analysis_id))
        conn.commit()

        # Call MiniMax (or demo fallback if no key)
        result = await analyze_product_with_minimax(
            name, category or "General", target_market or "US", description, reviews
        )

        conn.execute("""
        UPDATE product_analyses SET
            overall_score=?, market_demand_score=?, competition_score=?,
            profit_margin_score=?, trend_score=?, sentiment_score=?,
            ai_summary=?, ai_recommendation=?,
            ai_reasons=?, ai_risks=?, ai_opportunities=?,
            estimated_monthly_sales=?, avg_price_usd=?, competition_count=?,
            top_competitors=?, trend_keywords=?, seasonality=?, platform_insights=?,
            status='completed', updated_at=?
        WHERE id=?
        """, (
            result["overall_score"], result["market_demand_score"], result["competition_score"],
            result["profit_margin_score"], result["trend_score"], result["sentiment_score"],
            result["ai_summary"], result["ai_recommendation"],
            json.dumps(result["ai_reasons"]), json.dumps(result["ai_risks"]),
            json.dumps(result["ai_opportunities"]),
            result["estimated_monthly_sales"], result["avg_price_usd"], result["competition_count"],
            json.dumps(result["top_competitors"]), json.dumps(result["trend_keywords"]),
            result["seasonality"], json.dumps(result["platform_insights"]),
            datetime.utcnow().isoformat(), analysis_id
        ))
        conn.commit()
        print(f"✅ Analysis done: {name} — {result['ai_recommendation']} ({result['overall_score']})")
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        conn.execute("UPDATE product_analyses SET status='failed', updated_at=? WHERE id=?",
                     (datetime.utcnow().isoformat(), analysis_id))
        conn.commit()
    finally:
        conn.close()

# ─── Base Handler ─────────────────────────────────────

class BaseHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Content-Type", "application/json")
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def options(self, *args):
        self.set_status(204)
        self.finish()

    def json(self, data, status=200):
        self.set_status(status)
        self.write(json.dumps(data, default=str))

    def error(self, message, status=400):
        self.set_status(status)
        self.write(json.dumps({"detail": message}))

    def get_body(self):
        try:
            return json.loads(self.request.body)
        except Exception:
            return {}

# ─── Handlers ─────────────────────────────────────────

class HealthHandler(BaseHandler):
    def get(self):
        self.json({
            "status": "ok",
            "ai_mode": "minimax" if has_api_key() else "demo",
            "timestamp": datetime.utcnow().isoformat()
        })

class DashboardHandler(BaseHandler):
    def get(self):
        conn = get_conn()
        total = conn.execute("SELECT COUNT(*) FROM product_analyses").fetchone()[0]
        completed = conn.execute("SELECT COUNT(*) FROM product_analyses WHERE status='completed'").fetchone()[0]
        strong_buy = conn.execute("SELECT COUNT(*) FROM product_analyses WHERE ai_recommendation='STRONG_BUY'").fetchone()[0]
        avg_row = conn.execute("SELECT AVG(overall_score) FROM product_analyses WHERE overall_score IS NOT NULL").fetchone()[0]
        avg_score = round(avg_row, 1) if avg_row else 0.0
        cats = conn.execute("""
            SELECT category, COUNT(*) as cnt FROM product_analyses
            WHERE category IS NOT NULL GROUP BY category ORDER BY cnt DESC LIMIT 5
        """).fetchall()
        conn.close()
        self.json({
            "total_analyses": total,
            "completed": completed,
            "strong_buy_count": strong_buy,
            "avg_score": avg_score,
            "top_categories": [{"category": r[0], "count": r[1]} for r in cats]
        })

class AnalysisListHandler(BaseHandler):
    def get(self):
        skip = int(self.get_argument("skip", 0))
        limit = int(self.get_argument("limit", 20))
        category = self.get_argument("category", None)
        recommendation = self.get_argument("recommendation", None)
        starred = self.get_argument("starred", None)
        search = self.get_argument("search", None)

        conn = get_conn()
        where = []
        params = []
        if category:
            where.append("category=?"); params.append(category)
        if recommendation:
            where.append("ai_recommendation=?"); params.append(recommendation)
        if starred is not None:
            where.append("is_starred=?"); params.append(1 if starred.lower()=="true" else 0)
        if search:
            where.append("name LIKE ?"); params.append(f"%{search}%")

        where_clause = ("WHERE " + " AND ".join(where)) if where else ""
        total = conn.execute(f"SELECT COUNT(*) FROM product_analyses {where_clause}", params).fetchone()[0]
        rows = conn.execute(
            f"SELECT * FROM product_analyses {where_clause} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            params + [limit, skip]
        ).fetchall()
        conn.close()
        self.json({"total": total, "items": [row_to_dict(r) for r in rows]})

    async def post(self):
        body = self.get_body()
        name = (body.get("name") or "").strip()
        if not name:
            return self.error("产品名称不能为空")

        analysis_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        conn = get_conn()
        conn.execute("""
        INSERT INTO product_analyses (id, name, category, target_market, description, status, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?)
        """, (analysis_id, name, body.get("category"), body.get("target_market","US"),
              body.get("description"), "pending", now, now))
        conn.commit()
        row = conn.execute("SELECT * FROM product_analyses WHERE id=?", (analysis_id,)).fetchone()
        conn.close()

        # Kick off background analysis
        asyncio.ensure_future(run_analysis_async(
            analysis_id, name,
            body.get("category","General"),
            body.get("target_market","US"),
            body.get("description"),
            body.get("reviews"),
        ))

        self.json(row_to_dict(row), status=201)

class AnalysisDetailHandler(BaseHandler):
    def get(self, analysis_id):
        conn = get_conn()
        row = conn.execute("SELECT * FROM product_analyses WHERE id=?", (analysis_id,)).fetchone()
        conn.close()
        if not row:
            return self.error("Analysis not found", 404)
        self.json(row_to_dict(row))

    def patch(self, analysis_id):
        body = self.get_body()
        conn = get_conn()
        row = conn.execute("SELECT * FROM product_analyses WHERE id=?", (analysis_id,)).fetchone()
        if not row:
            conn.close()
            return self.error("Analysis not found", 404)
        sets = []
        params = []
        if "is_starred" in body:
            sets.append("is_starred=?"); params.append(1 if body["is_starred"] else 0)
        if "category" in body:
            sets.append("category=?"); params.append(body["category"])
        if "description" in body:
            sets.append("description=?"); params.append(body["description"])
        if sets:
            sets.append("updated_at=?"); params.append(datetime.utcnow().isoformat())
            params.append(analysis_id)
            conn.execute(f"UPDATE product_analyses SET {', '.join(sets)} WHERE id=?", params)
            conn.commit()
        row = conn.execute("SELECT * FROM product_analyses WHERE id=?", (analysis_id,)).fetchone()
        conn.close()
        self.json(row_to_dict(row))

    def delete(self, analysis_id):
        conn = get_conn()
        conn.execute("DELETE FROM product_analyses WHERE id=?", (analysis_id,))
        conn.commit()
        conn.close()
        self.set_status(204)
        self.finish()

class ReanalyzeHandler(BaseHandler):
    async def post(self, analysis_id):
        conn = get_conn()
        row = conn.execute("SELECT * FROM product_analyses WHERE id=?", (analysis_id,)).fetchone()
        if not row:
            conn.close()
            return self.error("Analysis not found", 404)
        conn.execute("""
            UPDATE product_analyses SET status='pending', overall_score=NULL, ai_recommendation=NULL, updated_at=?
            WHERE id=?
        """, (datetime.utcnow().isoformat(), analysis_id))
        conn.commit()
        row = conn.execute("SELECT * FROM product_analyses WHERE id=?", (analysis_id,)).fetchone()
        d = row_to_dict(row)
        conn.close()

        asyncio.ensure_future(run_analysis_async(
            analysis_id, d["name"], d.get("category","General"),
            d.get("target_market","US"), d.get("description"), None
        ))
        self.json(d)

class SentimentHandler(BaseHandler):
    def get(self, analysis_id):
        conn = get_conn()
        row = conn.execute("SELECT * FROM review_batches WHERE product_analysis_id=?", (analysis_id,)).fetchone()
        conn.close()
        if not row:
            self.json({"message": "No reviews submitted for this product"})
        else:
            d = dict(row)
            for f in ["reviews_raw","sentiment_breakdown","top_pain_points","top_praises"]:
                if d.get(f) and isinstance(d[f], str):
                    try: d[f] = json.loads(d[f])
                    except: pass
            self.json(d)

class CategoriesHandler(BaseHandler):
    def get(self):
        conn = get_conn()
        rows = conn.execute("SELECT DISTINCT category FROM product_analyses WHERE category IS NOT NULL").fetchall()
        conn.close()
        self.json([r[0] for r in rows])

class RootHandler(BaseHandler):
    def get(self):
        self.json({
            "service": "AI 选品决策工具 API",
            "version": "1.0.0",
            "ai_mode": "minimax" if has_api_key() else "demo",
            "docs": "http://localhost:8080"
        })

class CatchAllHandler(BaseHandler):
    def get(self, *args):
        self.error(f"Not found: {self.request.path}", 404)
    def post(self, *args):
        self.error(f"Not found: {self.request.path}", 404)

# ─── App ──────────────────────────────────────────────

def make_app():
    return tornado.web.Application([
        (r"/api/health",                      HealthHandler),
        (r"/api/dashboard",                   DashboardHandler),
        (r"/api/analyses",                    AnalysisListHandler),
        (r"/api/analyses/([^/]+)/reanalyze",  ReanalyzeHandler),
        (r"/api/analyses/([^/]+)/sentiment",  SentimentHandler),
        (r"/api/analyses/([^/]+)",            AnalysisDetailHandler),
        (r"/api/categories",                  CategoriesHandler),
        (r"/",                                RootHandler),
        (r".*",                               CatchAllHandler),
    ], debug=False)

if __name__ == "__main__":
    init_db()
    app = make_app()
    app.listen(PORT)
    print(f"🚀 Server running on http://localhost:{PORT}")
    print(f"🤖 AI mode: {'MiniMax (' + MINIMAX_MODEL + ')' if has_api_key() else 'Demo (set MINIMAX_API_KEY to enable MiniMax)'}")
    tornado.ioloop.IOLoop.current().start()
