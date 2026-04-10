"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class TargetMarket(str, Enum):
    US = "US"
    EU = "EU"
    UK = "UK"
    AU = "AU"
    CA = "CA"
    GLOBAL = "GLOBAL"


class Recommendation(str, Enum):
    STRONG_BUY = "STRONG_BUY"
    BUY = "BUY"
    HOLD = "HOLD"
    AVOID = "AVOID"


class AnalysisStatus(str, Enum):
    PENDING = "pending"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"


# ─── Request Schemas ───────────────────────────────

class ProductCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="产品名称（英文或中文）")
    category: Optional[str] = Field(None, description="产品类目，如 Electronics, Home & Garden")
    target_market: TargetMarket = Field(TargetMarket.US, description="目标市场")
    description: Optional[str] = Field(None, description="产品描述或额外背景信息")
    reviews: Optional[List[str]] = Field(None, description="手动输入的评论列表（可选）")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Portable Neck Fan",
                "category": "Electronics",
                "target_market": "US",
                "description": "Bladeless wearable fan for summer, targeting office workers",
                "reviews": [
                    "Love this! Very quiet and stays cool for hours.",
                    "Battery dies too fast, disappointed.",
                    "Perfect for outdoor sports events!"
                ]
            }
        }


class ProductUpdateRequest(BaseModel):
    is_starred: Optional[bool] = None
    category: Optional[str] = None
    description: Optional[str] = None


# ─── Response Schemas ──────────────────────────────

class CompetitorOut(BaseModel):
    name: str
    price_usd: Optional[float] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    monthly_sales_est: Optional[int] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None

    class Config:
        from_attributes = True


class TrendKeyword(BaseModel):
    keyword: str
    volume: str       # HIGH / MEDIUM / LOW
    growth: str       # +45% or -10%
    platform: str     # Google / Amazon / TikTok


class SentimentBreakdown(BaseModel):
    positive: float
    negative: float
    neutral: float
    top_pain_points: List[str]
    top_praises: List[str]


class PlatformInsight(BaseModel):
    platform: str
    insight: str
    opportunity: Optional[str] = None


class ProductAnalysisOut(BaseModel):
    id: str
    name: str
    category: Optional[str] = None
    target_market: str
    description: Optional[str] = None
    status: str

    # Scores
    overall_score: Optional[float] = None
    market_demand_score: Optional[float] = None
    competition_score: Optional[float] = None
    profit_margin_score: Optional[float] = None
    trend_score: Optional[float] = None
    sentiment_score: Optional[float] = None

    # AI Analysis
    ai_summary: Optional[str] = None
    ai_recommendation: Optional[str] = None
    ai_reasons: Optional[List[str]] = None
    ai_risks: Optional[List[str]] = None
    ai_opportunities: Optional[List[str]] = None

    # Market
    estimated_monthly_sales: Optional[int] = None
    avg_price_usd: Optional[float] = None
    competition_count: Optional[int] = None
    top_competitors: Optional[List[Dict[str, Any]]] = None
    trend_keywords: Optional[List[Dict[str, Any]]] = None
    seasonality: Optional[str] = None
    platform_insights: Optional[Dict[str, Any]] = None

    # Meta
    is_starred: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductListOut(BaseModel):
    id: str
    name: str
    category: Optional[str] = None
    target_market: str
    status: str
    overall_score: Optional[float] = None
    ai_recommendation: Optional[str] = None
    is_starred: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AnalysisListResponse(BaseModel):
    total: int
    items: List[ProductListOut]


class DashboardStats(BaseModel):
    total_analyses: int
    completed: int
    strong_buy_count: int
    avg_score: float
    top_categories: List[Dict[str, Any]]
