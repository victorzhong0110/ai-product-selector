"""
AI Engine — powered by MiniMax API
MiniMax uses OpenAI-compatible chat completions format.
Falls back to demo mode if no API key is configured.
"""
import os
import json
import random
import asyncio
import urllib.request
import urllib.error
from datetime import datetime
from typing import Optional, List, Dict, Any

# ─── Config ───────────────────────────────────────────────────────────

def _load_env():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

_load_env()

MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_BASE_URL = "https://api.minimax.chat/v1/chat/completions"
MINIMAX_MODEL = "MiniMax-Text-01"


def has_api_key() -> bool:
    return bool(MINIMAX_API_KEY and MINIMAX_API_KEY != "your_api_key_here")


# ─── MiniMax HTTP caller (stdlib only) ────────────────────────────────

def _call_minimax(messages: list, max_tokens: int = 2048, api_key: str = "") -> str:
    """Synchronous call to MiniMax API via urllib (no extra packages needed)."""
    key = api_key or MINIMAX_API_KEY
    payload = json.dumps({
        "model": MINIMAX_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.3,
    }).encode("utf-8")

    req = urllib.request.Request(
        MINIMAX_BASE_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return body["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        raise RuntimeError(f"MiniMax HTTP {e.code}: {err_body}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"MiniMax connection error: {e.reason}")


# ─── Demo data (fallback when no key) ─────────────────────────────────

DEMO_CATS = {
    "Electronics":       {"demand":(70,90),"competition":(40,65),"margin":(45,70),"trend":(60,85),"price":(15,120)},
    "Home & Garden":     {"demand":(60,80),"competition":(50,70),"margin":(50,75),"trend":(55,80),"price":(10,80)},
    "Sports & Outdoors": {"demand":(65,85),"competition":(45,65),"margin":(55,80),"trend":(65,88),"price":(12,100)},
    "Beauty & Health":   {"demand":(72,92),"competition":(55,75),"margin":(60,85),"trend":(70,92),"price":(8,60)},
    "Pet Supplies":      {"demand":(68,88),"competition":(40,60),"margin":(52,78),"trend":(72,90),"price":(6,50)},
    "Toys & Games":      {"demand":(62,82),"competition":(50,72),"margin":(48,72),"trend":(60,85),"price":(8,70)},
    "Kitchen & Dining":  {"demand":(58,78),"competition":(48,68),"margin":(50,74),"trend":(52,76),"price":(10,90)},
    "General":           {"demand":(60,85),"competition":(45,70),"margin":(48,75),"trend":(58,82),"price":(10,90)},
}

def _rand(lo, hi):
    return round(random.uniform(lo, hi), 1)

def _generate_demo(name: str, category: str) -> Dict[str, Any]:
    cat = DEMO_CATS.get(category, DEMO_CATS["General"])
    demand    = _rand(*cat["demand"])
    compete   = _rand(*cat["competition"])
    margin    = _rand(*cat["margin"])
    trend     = _rand(*cat["trend"])
    sentiment = _rand(65, 92)
    overall   = round(demand*0.25 + compete*0.20 + margin*0.20 + trend*0.20 + sentiment*0.15, 1)
    rec = "STRONG_BUY" if overall>=78 else "BUY" if overall>=65 else "HOLD" if overall>=50 else "AVOID"
    price = _rand(*cat["price"])

    competitors = []
    for nm, rat in [("BrandX Store",4.2),("TechPro Direct",4.5),("ValueGoods Co.",3.8)]:
        competitors.append({
            "name": nm, "price_usd": round(price * random.uniform(0.8,1.3), 2),
            "rating": rat, "review_count": random.randint(400,9000),
            "monthly_sales_est": random.randint(300,5600),
            "strengths": ["Strong brand recognition","Fast shipping"],
            "weaknesses": ["Higher price point","Limited variants"],
        })

    keywords = [
        {"keyword":f"{name.lower()} review",      "volume":"HIGH",   "growth":"+32%","platform":"Google"},
        {"keyword":f"best {name.lower()} 2025",   "volume":"MEDIUM", "growth":"+18%","platform":"Google"},
        {"keyword":f"{name.lower()} unboxing",    "volume":"HIGH",   "growth":"+55%","platform":"TikTok"},
        {"keyword":f"buy {name.lower()} online",  "volume":"MEDIUM", "growth":"+12%","platform":"Amazon"},
    ]

    summary = (
        f"**{name}** shows {'strong' if overall>=70 else 'moderate'} potential in the "
        f"{category} category. Overall score {overall}/100 — "
        f"{'well-positioned for launch' if rec in ['STRONG_BUY','BUY'] else 'requires further validation'}. "
        f"Market demand is {'high' if demand>75 else 'moderate'} and competition is "
        f"{'manageable' if compete>55 else 'intense'}."
    )

    return {
        "overall_score": overall, "market_demand_score": demand,
        "competition_score": compete, "profit_margin_score": margin,
        "trend_score": trend, "sentiment_score": sentiment,
        "ai_recommendation": rec, "ai_summary": summary,
        "ai_reasons": [
            f"Search interest at {int(demand)}% demand index in {category}",
            "Manageable competition with differentiation room",
            f"Profit margin score {int(margin)}% — favorable supplier ecosystem",
            "Positive TikTok and Amazon search trajectory in past 90 days",
        ],
        "ai_risks": [
            "Seasonal demand fluctuation may impact Q1 revenue",
            "Low-cost copycat products risk margin erosion",
            "Platform algorithm changes may affect organic traffic",
        ],
        "ai_opportunities": [
            "Bundle with accessories to increase average order value",
            "TikTok Shop influencer campaign for viral reach",
            "Private label version with unique color/feature twist",
        ],
        "estimated_monthly_sales": random.randint(300, 8000),
        "avg_price_usd": price,
        "competition_count": random.randint(20, 500),
        "top_competitors": competitors,
        "trend_keywords": keywords,
        "seasonality": random.choice(["HIGH","MEDIUM","LOW"]),
        "platform_insights": {
            "amazon":  {"avg_rating": round(random.uniform(3.9,4.6),1),
                        "opportunity": "Long-tail keyword gap in subcategory search"},
            "tiktok":  {"hashtag_views": f"{random.randint(10,500)}M",
                        "opportunity": "Organic unboxing + lifestyle demo content"},
            "shopify": {"avg_conversion": f"{round(random.uniform(1.5,4.2),1)}%",
                        "opportunity": "DTC brand differentiation through storytelling"},
        },
    }


# ─── MiniMax-powered analysis ──────────────────────────────────────────

SYSTEM_PROMPT = """You are a senior cross-border e-commerce product selection analyst with 10+ years of experience
in Amazon FBA, Shopify DTC, and TikTok Shop. You specialize in:
- Market demand assessment and trend analysis for US/EU/global markets
- Competitive landscape evaluation and pricing strategy
- Consumer sentiment and review pattern analysis
- Supply chain feasibility (primarily China-sourced products)

Your analysis is data-driven, concise, and actionable. Output ONLY valid JSON, no markdown fences."""


def _build_prompt(name, category, market, description, reviews):
    reviews_txt = ""
    if reviews:
        reviews_txt = "\n\nUser-provided competitor reviews:\n" + "\n".join(f"- {r}" for r in reviews[:12])

    return f"""Analyze this product for cross-border e-commerce viability:

Product: {name}
Category: {category or 'Unknown'}
Target Market: {market}
Description: {description or 'Not provided'}
Year: {datetime.now().year}
{reviews_txt}

Return ONLY a JSON object with exactly this structure (no extra fields, no markdown):
{{
  "overall_score": <float 0-100>,
  "market_demand_score": <float 0-100, based on search volume and buyer intent>,
  "competition_score": <float 0-100, HIGHER = less competition / easier entry>,
  "profit_margin_score": <float 0-100, price/cost ratio potential>,
  "trend_score": <float 0-100, trend trajectory>,
  "sentiment_score": <float 0-100, review patterns>,
  "ai_recommendation": <"STRONG_BUY"|"BUY"|"HOLD"|"AVOID">,
  "ai_summary": "<2-3 sentence executive summary in English>",
  "ai_reasons": ["<reason 1>","<reason 2>","<reason 3>","<reason 4>"],
  "ai_risks": ["<risk 1>","<risk 2>","<risk 3>"],
  "ai_opportunities": ["<opp 1>","<opp 2>","<opp 3>"],
  "estimated_monthly_sales": <integer top-seller monthly estimate>,
  "avg_price_usd": <float suggested retail price>,
  "competition_count": <integer similar listings estimate>,
  "top_competitors": [
    {{"name":"...","price_usd":0.0,"rating":0.0,"review_count":0,"strengths":["..."],"weaknesses":["..."]}}
  ],
  "trend_keywords": [
    {{"keyword":"...","volume":"HIGH|MEDIUM|LOW","growth":"+X%","platform":"Google|Amazon|TikTok"}}
  ],
  "seasonality": "HIGH|MEDIUM|LOW",
  "platform_insights": {{
    "amazon":{{"opportunity":"..."}},
    "tiktok":{{"opportunity":"..."}},
    "shopify":{{"opportunity":"..."}}
  }}
}}"""


async def analyze_product_with_minimax(
    product_name: str,
    category: str,
    target_market: str,
    description: Optional[str] = None,
    reviews: Optional[List[str]] = None,
    api_key_override: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Main analysis function.
    Uses MiniMax API when key is configured, falls back to demo mode.
    api_key_override: if provided, use this key instead of the env key.
    """
    effective_key = api_key_override or MINIMAX_API_KEY
    if not (effective_key and effective_key != "your_api_key_here"):
        await asyncio.sleep(2.5)
        return _generate_demo(product_name, category or "General")

    loop = asyncio.get_event_loop()
    try:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": _build_prompt(
                product_name, category, target_market, description, reviews
            )},
        ]
        # Run blocking urllib call in thread pool
        raw = await loop.run_in_executor(
            None, lambda: _call_minimax(messages, max_tokens=2048, api_key=effective_key)
        )

        # Strip potential markdown fences
        content = raw.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        result = json.loads(content)
        print(f"✅ MiniMax analysis done: {product_name} → {result.get('ai_recommendation')} ({result.get('overall_score')})")
        return result

    except json.JSONDecodeError as e:
        print(f"⚠️  JSON parse error, falling back to demo: {e}")
        return _generate_demo(product_name, category or "General")
    except Exception as e:
        print(f"⚠️  MiniMax error ({type(e).__name__}: {e}), falling back to demo")
        return _generate_demo(product_name, category or "General")


async def analyze_sentiment_minimax(
    reviews: List[str],
    product_name: str,
) -> Dict[str, Any]:
    """Sentiment analysis on a batch of reviews."""
    if not has_api_key() or not reviews:
        return {
            "positive": round(random.uniform(55, 80), 1),
            "negative": round(random.uniform(10, 25), 1),
            "neutral":  round(random.uniform(10, 20), 1),
            "top_pain_points": ["Battery life too short","Packaging could be improved","Instructions unclear"],
            "top_praises": ["Great value for money","Easy to use","Fast shipping"],
        }

    loop = asyncio.get_event_loop()
    try:
        prompt = (
            f'Analyze these {len(reviews)} product reviews for "{product_name}":\n\n'
            + "\n".join(f"{i+1}. {r}" for i, r in enumerate(reviews[:20]))
            + '\n\nReturn ONLY JSON:\n'
            '{"positive":<float>,"negative":<float>,"neutral":<float>,'
            '"top_pain_points":["...","...","..."],"top_praises":["...","...","..."]}'
        )
        messages = [{"role": "user", "content": prompt}]
        raw = await loop.run_in_executor(None, lambda: _call_minimax(messages, max_tokens=512))
        content = raw.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"): content = content[4:]
            content = content.strip()
        return json.loads(content)
    except Exception as e:
        print(f"Sentiment fallback: {e}")
        return {
            "positive": 68.0, "negative": 18.0, "neutral": 14.0,
            "top_pain_points": ["Quality inconsistency","Shipping delays"],
            "top_praises": ["Good value","Easy to use"],
        }
