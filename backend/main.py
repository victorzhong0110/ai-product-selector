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
import hashlib
import hmac
import base64
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
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
JWT_SECRET = os.getenv("JWT_SECRET", "ai-selector-secret-key-2024-change-in-production")
executor = ThreadPoolExecutor(max_workers=4)

# Import AI engine after env is loaded
from ai_engine import analyze_product_with_minimax, analyze_sentiment_minimax, has_api_key, MINIMAX_MODEL, MINIMAX_API_KEY as _DEFAULT_API_KEY

# ─── JWT (HMAC-SHA256, stdlib only) ───────────────────

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')

def _b64url_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    if padding != 4:
        s += '=' * padding
    return base64.urlsafe_b64decode(s)

def create_jwt(payload: dict) -> str:
    header = _b64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    body   = _b64url_encode(json.dumps(payload).encode())
    msg    = f"{header}.{body}".encode()
    sig    = hmac.new(JWT_SECRET.encode(), msg, hashlib.sha256).digest()
    return f"{header}.{body}.{_b64url_encode(sig)}"

def verify_jwt(token: str) -> dict | None:
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header, body, sig = parts
        msg      = f"{header}.{body}".encode()
        expected = _b64url_encode(hmac.new(JWT_SECRET.encode(), msg, hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(_b64url_decode(body))
        # Check expiry
        if 'exp' in payload and payload['exp'] < datetime.now(timezone.utc).timestamp():
            return None
        return payload
    except Exception:
        return None

def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    h = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{h.hex()}"

def verify_password(password: str, stored: str) -> bool:
    try:
        salt, h = stored.split(':', 1)
        expected = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex()
        return hmac.compare_digest(h, expected)
    except Exception:
        return False

# ─── Database ─────────────────────────────────────────

def get_conn():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_conn()

    # Original tables
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
        user_id TEXT,
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

    # New: Users & Auth
    conn.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT
    )
    """)
    conn.execute("""
    CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT PRIMARY KEY,
        minimax_api_key TEXT,
        serpapi_key TEXT,
        amazon_access_key TEXT,
        amazon_secret_key TEXT,
        amazon_associate_tag TEXT,
        language TEXT DEFAULT 'zh',
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)
    # Migrate existing user_settings table to add new columns if missing
    existing_cols = [r[1] for r in conn.execute("PRAGMA table_info(user_settings)").fetchall()]
    for col, typedef in [
        ("serpapi_key", "TEXT"),
        ("amazon_access_key", "TEXT"),
        ("amazon_secret_key", "TEXT"),
        ("amazon_associate_tag", "TEXT"),
    ]:
        if col not in existing_cols:
            conn.execute(f"ALTER TABLE user_settings ADD COLUMN {col} {typedef}")

    # New: Tags
    conn.execute("""
    CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#6366f1',
        created_at TEXT
    )
    """)
    conn.execute("""
    CREATE TABLE IF NOT EXISTS product_tag_map (
        analysis_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (analysis_id, tag_id)
    )
    """)

    # New: Tracking schedules
    conn.execute("""
    CREATE TABLE IF NOT EXISTS tracking_schedules (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        analysis_id TEXT NOT NULL,
        frequency_hours INTEGER DEFAULT 24,
        last_run TEXT,
        next_run TEXT,
        is_active INTEGER DEFAULT 1,
        notify_threshold REAL DEFAULT 5.0,
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

# ─── AI Engine helpers ────────────────────────────────

def get_user_settings(user_id: str | None) -> dict:
    """Return all user API keys, falling back to env vars."""
    defaults = {
        "minimax_api_key": _DEFAULT_API_KEY or "",
        "serpapi_key": os.getenv("SERPAPI_KEY", ""),
        "amazon_access_key": os.getenv("AMAZON_ACCESS_KEY", ""),
        "amazon_secret_key": os.getenv("AMAZON_SECRET_KEY", ""),
        "amazon_associate_tag": os.getenv("AMAZON_ASSOCIATE_TAG", ""),
    }
    if not user_id:
        return defaults
    conn = get_conn()
    row = conn.execute("SELECT * FROM user_settings WHERE user_id=?", (user_id,)).fetchone()
    conn.close()
    if not row:
        return defaults
    d = dict(row)
    # Override defaults with user values where set
    for k in defaults:
        if d.get(k):
            defaults[k] = d[k]
    return defaults

def get_api_key_for_user(user_id: str | None) -> str:
    return get_user_settings(user_id)["minimax_api_key"]

# ─── Demo / background analysis ───────────────────────

async def run_analysis_async(analysis_id, name, category, target_market, description, reviews, user_id=None):
    """Run AI analysis in background — uses MiniMax API or demo fallback"""
    conn = get_conn()
    try:
        conn.execute("UPDATE product_analyses SET status='analyzing', updated_at=? WHERE id=?",
                     (datetime.utcnow().isoformat(), analysis_id))
        conn.commit()

        # Use per-user API key if available
        api_key = get_api_key_for_user(user_id)

        result = await analyze_product_with_minimax(
            name, category or "General", target_market or "US", description, reviews,
            api_key_override=api_key
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

# ─── Background tracking worker ───────────────────────

async def tracking_worker():
    """Runs every hour, triggers re-analysis for due tracking schedules."""
    while True:
        await asyncio.sleep(3600)  # check hourly
        try:
            now = datetime.utcnow().isoformat()
            conn = get_conn()
            due = conn.execute("""
                SELECT ts.*, pa.name, pa.category, pa.target_market, pa.description
                FROM tracking_schedules ts
                JOIN product_analyses pa ON pa.id = ts.analysis_id
                WHERE ts.is_active=1 AND ts.next_run <= ?
            """, (now,)).fetchall()
            conn.close()

            for row in due:
                analysis_id = row['analysis_id']
                user_id     = row['user_id']
                name        = row['name']
                category    = row['category']
                target_market = row['target_market']
                description = row['description']
                freq_hours  = row['frequency_hours']

                next_run = (datetime.utcnow() + timedelta(hours=freq_hours)).isoformat()

                conn2 = get_conn()
                conn2.execute("""
                    UPDATE tracking_schedules SET last_run=?, next_run=? WHERE id=?
                """, (now, next_run, row['id']))
                conn2.execute("""
                    UPDATE product_analyses SET status='pending', updated_at=? WHERE id=?
                """, (now, analysis_id))
                conn2.commit()
                conn2.close()

                asyncio.ensure_future(run_analysis_async(
                    analysis_id, name, category or "General",
                    target_market or "US", description, None, user_id
                ))
                print(f"🔄 Tracking re-analysis triggered: {name} ({analysis_id})")
        except Exception as e:
            print(f"❌ Tracking worker error: {e}")

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

    def get_current_user(self):
        """Decode JWT from Authorization header. Returns user dict or None."""
        auth = self.request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return None
        token = auth[7:].strip()
        payload = verify_jwt(token)
        if not payload:
            return None
        return payload  # dict with user_id, email, username

    def require_auth(self):
        """Return current user or send 401. Call this at start of auth-gated handlers."""
        user = self.get_current_user()
        if not user:
            self.error("Authentication required", 401)
        return user

# ─── Auth Handlers ────────────────────────────────────

class RegisterHandler(BaseHandler):
    def post(self):
        body = self.get_body()
        email    = (body.get("email") or "").strip().lower()
        username = (body.get("username") or "").strip()
        password = (body.get("password") or "")

        if not email or not username or not password:
            return self.error("email, username, password are required")
        if len(password) < 6:
            return self.error("Password must be at least 6 characters")

        conn = get_conn()
        existing = conn.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
        if existing:
            conn.close()
            return self.error("Email already registered", 409)

        user_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        pw_hash = hash_password(password)
        conn.execute("INSERT INTO users (id, email, username, password_hash, created_at) VALUES (?,?,?,?,?)",
                     (user_id, email, username, pw_hash, now))
        conn.execute("INSERT INTO user_settings (user_id, language) VALUES (?, 'zh')", (user_id,))
        conn.commit()
        conn.close()

        exp = int((datetime.now(timezone.utc) + timedelta(days=30)).timestamp())
        token = create_jwt({"user_id": user_id, "email": email, "username": username, "exp": exp})
        self.json({"token": token, "user": {"id": user_id, "email": email, "username": username}}, 201)

class LoginHandler(BaseHandler):
    def post(self):
        body = self.get_body()
        email    = (body.get("email") or "").strip().lower()
        password = (body.get("password") or "")

        if not email or not password:
            return self.error("email and password are required")

        conn = get_conn()
        row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        conn.close()

        if not row or not verify_password(password, row['password_hash']):
            return self.error("Invalid email or password", 401)

        exp = int((datetime.now(timezone.utc) + timedelta(days=30)).timestamp())
        token = create_jwt({
            "user_id": row['id'], "email": row['email'],
            "username": row['username'], "exp": exp
        })
        self.json({"token": token, "user": {
            "id": row['id'], "email": row['email'], "username": row['username']
        }})

class MeHandler(BaseHandler):
    def get(self):
        user = self.require_auth()
        if not user:
            return
        conn = get_conn()
        row = conn.execute("SELECT * FROM users WHERE id=?", (user['user_id'],)).fetchone()
        settings = conn.execute("SELECT * FROM user_settings WHERE user_id=?", (user['user_id'],)).fetchone()
        conn.close()
        if not row:
            return self.error("User not found", 404)
        self.json({
            "id": row['id'], "email": row['email'], "username": row['username'],
            "created_at": row['created_at'],
            "settings": dict(settings) if settings else {}
        })

# ─── Settings Handler ─────────────────────────────────

_API_KEY_FIELDS = ["minimax_api_key", "serpapi_key", "amazon_access_key", "amazon_secret_key", "amazon_associate_tag"]

class SettingsHandler(BaseHandler):
    def get(self):
        user = self.require_auth()
        if not user:
            return
        conn = get_conn()
        row = conn.execute("SELECT * FROM user_settings WHERE user_id=?", (user['user_id'],)).fetchone()
        conn.close()
        d = dict(row) if row else {}
        result = {"user_id": user['user_id'], "language": d.get("language", "zh")}
        for f in _API_KEY_FIELDS:
            result[f"has_{f}"] = bool(d.get(f))
            result[f] = ""  # never return actual key values
        self.json(result)

    def put(self):
        user = self.require_auth()
        if not user:
            return
        body = self.get_body()
        conn = get_conn()
        existing = conn.execute("SELECT user_id FROM user_settings WHERE user_id=?", (user['user_id'],)).fetchone()
        if existing:
            sets = []
            params = []
            for f in _API_KEY_FIELDS:
                if f in body:
                    sets.append(f"{f}=?"); params.append(body[f])
            if 'language' in body:
                sets.append("language=?"); params.append(body['language'])
            if sets:
                params.append(user['user_id'])
                conn.execute(f"UPDATE user_settings SET {', '.join(sets)} WHERE user_id=?", params)
        else:
            conn.execute(
                "INSERT INTO user_settings (user_id, minimax_api_key, serpapi_key, amazon_access_key, amazon_secret_key, amazon_associate_tag, language) VALUES (?,?,?,?,?,?,?)",
                (user['user_id'],
                 body.get('minimax_api_key',''), body.get('serpapi_key',''),
                 body.get('amazon_access_key',''), body.get('amazon_secret_key',''),
                 body.get('amazon_associate_tag',''), body.get('language','zh'))
            )
        conn.commit()
        conn.close()
        self.json({"ok": True})

# ─── Tags Handlers ────────────────────────────────────

class TagsHandler(BaseHandler):
    def get(self):
        user = self.require_auth()
        if not user:
            return
        conn = get_conn()
        rows = conn.execute("SELECT * FROM tags WHERE user_id=? ORDER BY name", (user['user_id'],)).fetchall()
        conn.close()
        self.json([dict(r) for r in rows])

    def post(self):
        user = self.require_auth()
        if not user:
            return
        body = self.get_body()
        name  = (body.get("name") or "").strip()
        color = body.get("color", "#6366f1")
        if not name:
            return self.error("Tag name is required")
        tag_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        conn = get_conn()
        conn.execute("INSERT INTO tags (id, user_id, name, color, created_at) VALUES (?,?,?,?,?)",
                     (tag_id, user['user_id'], name, color, now))
        conn.commit()
        row = conn.execute("SELECT * FROM tags WHERE id=?", (tag_id,)).fetchone()
        conn.close()
        self.json(dict(row), 201)

class TagDetailHandler(BaseHandler):
    def delete(self, tag_id):
        user = self.require_auth()
        if not user:
            return
        conn = get_conn()
        tag = conn.execute("SELECT * FROM tags WHERE id=? AND user_id=?", (tag_id, user['user_id'])).fetchone()
        if not tag:
            conn.close()
            return self.error("Tag not found", 404)
        conn.execute("DELETE FROM product_tag_map WHERE tag_id=?", (tag_id,))
        conn.execute("DELETE FROM tags WHERE id=?", (tag_id,))
        conn.commit()
        conn.close()
        self.set_status(204)
        self.finish()

class AnalysisTagsHandler(BaseHandler):
    def post(self, analysis_id):
        user = self.require_auth()
        if not user:
            return
        body = self.get_body()
        tag_id = body.get("tag_id")
        if not tag_id:
            return self.error("tag_id is required")
        conn = get_conn()
        tag = conn.execute("SELECT * FROM tags WHERE id=? AND user_id=?", (tag_id, user['user_id'])).fetchone()
        if not tag:
            conn.close()
            return self.error("Tag not found", 404)
        try:
            conn.execute("INSERT OR IGNORE INTO product_tag_map (analysis_id, tag_id) VALUES (?,?)", (analysis_id, tag_id))
            conn.commit()
        except Exception:
            pass
        conn.close()
        self.json({"ok": True})

    def get(self, analysis_id):
        conn = get_conn()
        rows = conn.execute("""
            SELECT t.* FROM tags t
            JOIN product_tag_map ptm ON ptm.tag_id = t.id
            WHERE ptm.analysis_id=?
        """, (analysis_id,)).fetchall()
        conn.close()
        self.json([dict(r) for r in rows])

class AnalysisTagRemoveHandler(BaseHandler):
    def delete(self, analysis_id, tag_id):
        user = self.require_auth()
        if not user:
            return
        conn = get_conn()
        conn.execute("DELETE FROM product_tag_map WHERE analysis_id=? AND tag_id=?", (analysis_id, tag_id))
        conn.commit()
        conn.close()
        self.set_status(204)
        self.finish()

# ─── Tracking Handlers ────────────────────────────────

class TrackingListHandler(BaseHandler):
    def get(self):
        user = self.require_auth()
        if not user:
            return
        conn = get_conn()
        rows = conn.execute("""
            SELECT ts.*, pa.name as product_name FROM tracking_schedules ts
            LEFT JOIN product_analyses pa ON pa.id = ts.analysis_id
            WHERE ts.user_id=? ORDER BY ts.created_at DESC
        """, (user['user_id'],)).fetchall()
        conn.close()
        self.json([dict(r) for r in rows])

    def post(self):
        user = self.require_auth()
        if not user:
            return
        body = self.get_body()
        analysis_id    = body.get("analysis_id")
        frequency_hours = int(body.get("frequency_hours", 24))
        notify_threshold = float(body.get("notify_threshold", 5.0))

        if not analysis_id:
            return self.error("analysis_id is required")

        conn = get_conn()
        pa = conn.execute("SELECT id FROM product_analyses WHERE id=?", (analysis_id,)).fetchone()
        if not pa:
            conn.close()
            return self.error("Analysis not found", 404)

        # Check duplicate
        existing = conn.execute(
            "SELECT id FROM tracking_schedules WHERE user_id=? AND analysis_id=? AND is_active=1",
            (user['user_id'], analysis_id)
        ).fetchone()
        if existing:
            conn.close()
            return self.error("Already tracking this analysis", 409)

        track_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        next_run = (datetime.utcnow() + timedelta(hours=frequency_hours)).isoformat()
        conn.execute("""
            INSERT INTO tracking_schedules
            (id, user_id, analysis_id, frequency_hours, next_run, is_active, notify_threshold, created_at)
            VALUES (?,?,?,?,?,1,?,?)
        """, (track_id, user['user_id'], analysis_id, frequency_hours, next_run, notify_threshold, now))
        conn.commit()
        row = conn.execute("SELECT * FROM tracking_schedules WHERE id=?", (track_id,)).fetchone()
        conn.close()
        self.json(dict(row), 201)

class TrackingDetailHandler(BaseHandler):
    def delete(self, track_id):
        user = self.require_auth()
        if not user:
            return
        conn = get_conn()
        row = conn.execute(
            "SELECT * FROM tracking_schedules WHERE id=? AND user_id=?",
            (track_id, user['user_id'])
        ).fetchone()
        if not row:
            conn.close()
            return self.error("Tracking schedule not found", 404)
        conn.execute("DELETE FROM tracking_schedules WHERE id=?", (track_id,))
        conn.commit()
        conn.close()
        self.set_status(204)
        self.finish()

# ─── Export Handlers ──────────────────────────────────

class ExportShopifyHandler(BaseHandler):
    def get(self, analysis_id):
        conn = get_conn()
        row = conn.execute("SELECT * FROM product_analyses WHERE id=?", (analysis_id,)).fetchone()
        conn.close()
        if not row:
            return self.error("Analysis not found", 404)
        d = row_to_dict(row)

        # Build tag list from AI data
        tags_list = []
        if d.get('category'):
            tags_list.append(d['category'])
        if d.get('ai_recommendation'):
            tags_list.append(d['ai_recommendation'])
        if d.get('seasonality'):
            tags_list.append(f"Seasonality:{d['seasonality']}")

        price = d.get('avg_price_usd') or 0.0

        shopify_payload = {
            "product": {
                "title": d['name'],
                "body_html": f"<p>{d.get('ai_summary','')}</p>",
                "vendor": "AI Selector Export",
                "product_type": d.get('category', 'General'),
                "tags": tags_list,
                "variants": [
                    {
                        "price": str(round(price, 2)),
                        "sku": f"AI-{analysis_id[:8].upper()}",
                        "inventory_management": "shopify",
                        "fulfillment_service": "manual"
                    }
                ],
                "metafields": [
                    {"namespace": "ai_selector", "key": "overall_score",   "value": str(d.get('overall_score', '')),   "type": "single_line_text_field"},
                    {"namespace": "ai_selector", "key": "recommendation",  "value": d.get('ai_recommendation', ''),    "type": "single_line_text_field"},
                    {"namespace": "ai_selector", "key": "analysis_id",     "value": analysis_id,                       "type": "single_line_text_field"},
                ]
            }
        }
        self.json(shopify_payload)

class ExportWooCommerceHandler(BaseHandler):
    def get(self, analysis_id):
        conn = get_conn()
        row = conn.execute("SELECT * FROM product_analyses WHERE id=?", (analysis_id,)).fetchone()
        conn.close()
        if not row:
            return self.error("Analysis not found", 404)
        d = row_to_dict(row)

        price = d.get('avg_price_usd') or 0.0
        categories = []
        if d.get('category'):
            categories.append({"name": d['category']})

        meta_data = [
            {"key": "_ai_overall_score",        "value": str(d.get('overall_score', ''))},
            {"key": "_ai_recommendation",       "value": d.get('ai_recommendation', '')},
            {"key": "_ai_market_demand_score",  "value": str(d.get('market_demand_score', ''))},
            {"key": "_ai_competition_score",    "value": str(d.get('competition_score', ''))},
            {"key": "_ai_profit_margin_score",  "value": str(d.get('profit_margin_score', ''))},
            {"key": "_ai_trend_score",          "value": str(d.get('trend_score', ''))},
            {"key": "_ai_sentiment_score",      "value": str(d.get('sentiment_score', ''))},
            {"key": "_ai_analysis_id",          "value": analysis_id},
            {"key": "_ai_target_market",        "value": d.get('target_market', 'US')},
            {"key": "_ai_seasonality",          "value": d.get('seasonality', '')},
        ]

        woo_payload = {
            "name": d['name'],
            "type": "simple",
            "status": "draft",
            "description": d.get('ai_summary', ''),
            "regular_price": str(round(price, 2)),
            "categories": categories,
            "meta_data": meta_data,
            "tags": [{"name": d.get('ai_recommendation', '')}] if d.get('ai_recommendation') else [],
        }
        self.json(woo_payload)

# ─── Original Handlers ────────────────────────────────

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
        tag_id = self.get_argument("tag_id", None)

        conn = get_conn()
        where = []
        params = []

        if tag_id:
            # Join with tag map
            base_query = """
                SELECT pa.* FROM product_analyses pa
                JOIN product_tag_map ptm ON ptm.analysis_id = pa.id
                WHERE ptm.tag_id=?
            """
            params.append(tag_id)
            if category:
                base_query += " AND pa.category=?"; params.append(category)
            if recommendation:
                base_query += " AND pa.ai_recommendation=?"; params.append(recommendation)
            if starred is not None:
                base_query += " AND pa.is_starred=?"; params.append(1 if starred.lower()=="true" else 0)
            if search:
                base_query += " AND pa.name LIKE ?"; params.append(f"%{search}%")
            total = conn.execute(f"SELECT COUNT(*) FROM ({base_query})", params).fetchone()[0]
            rows = conn.execute(base_query + " ORDER BY pa.created_at DESC LIMIT ? OFFSET ?",
                                params + [limit, skip]).fetchall()
        else:
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

        user = self.get_current_user()
        user_id = user['user_id'] if user else None

        analysis_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        conn = get_conn()
        conn.execute("""
        INSERT INTO product_analyses (id, name, category, target_market, description, status, user_id, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?)
        """, (analysis_id, name, body.get("category"), body.get("target_market","US"),
              body.get("description"), "pending", user_id, now, now))
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
            user_id,
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

        user = self.get_current_user()
        user_id = user['user_id'] if user else d.get('user_id')

        asyncio.ensure_future(run_analysis_async(
            analysis_id, d["name"], d.get("category","General"),
            d.get("target_market","US"), d.get("description"), None, user_id
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
            "version": "2.0.0",
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
        (r"/api/health",                                        HealthHandler),
        (r"/api/dashboard",                                     DashboardHandler),
        # Auth
        (r"/api/auth/register",                                 RegisterHandler),
        (r"/api/auth/login",                                    LoginHandler),
        (r"/api/auth/me",                                       MeHandler),
        # Settings
        (r"/api/settings",                                      SettingsHandler),
        # Tags
        (r"/api/tags",                                          TagsHandler),
        (r"/api/tags/([^/]+)",                                  TagDetailHandler),
        # Tracking
        (r"/api/tracking",                                      TrackingListHandler),
        (r"/api/tracking/([^/]+)",                              TrackingDetailHandler),
        # Analyses
        (r"/api/analyses",                                      AnalysisListHandler),
        (r"/api/analyses/([^/]+)/reanalyze",                    ReanalyzeHandler),
        (r"/api/analyses/([^/]+)/sentiment",                    SentimentHandler),
        (r"/api/analyses/([^/]+)/tags",                         AnalysisTagsHandler),
        (r"/api/analyses/([^/]+)/tags/([^/]+)",                 AnalysisTagRemoveHandler),
        (r"/api/analyses/([^/]+)/export/shopify",               ExportShopifyHandler),
        (r"/api/analyses/([^/]+)/export/woocommerce",           ExportWooCommerceHandler),
        (r"/api/analyses/([^/]+)",                              AnalysisDetailHandler),
        (r"/api/categories",                                    CategoriesHandler),
        (r"/",                                                  RootHandler),
        (r".*",                                                 CatchAllHandler),
    ], debug=False)

if __name__ == "__main__":
    init_db()
    app = make_app()
    app.listen(PORT)
    print(f"🚀 Server running on http://localhost:{PORT}")
    print(f"🤖 AI mode: {'MiniMax (' + MINIMAX_MODEL + ')' if has_api_key() else 'Demo (set MINIMAX_API_KEY to enable MiniMax)'}")
    # Start background tracking worker
    asyncio.ensure_future(tracking_worker())
    tornado.ioloop.IOLoop.current().start()
