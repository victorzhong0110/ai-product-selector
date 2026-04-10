"""
Database configuration and models
Using SQLAlchemy with SQLite for local development
"""
from sqlalchemy import (
    create_engine, Column, String, Float, Integer,
    DateTime, Text, JSON, Boolean
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ai_selector.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─────────────────────────────────────────
# ORM Models
# ─────────────────────────────────────────

class ProductAnalysis(Base):
    """Core product analysis record"""
    __tablename__ = "product_analyses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=True)
    target_market = Column(String(100), default="US")
    description = Column(Text, nullable=True)

    # Scores (0-100)
    overall_score = Column(Float, nullable=True)
    market_demand_score = Column(Float, nullable=True)
    competition_score = Column(Float, nullable=True)     # higher = less competition
    profit_margin_score = Column(Float, nullable=True)
    trend_score = Column(Float, nullable=True)
    sentiment_score = Column(Float, nullable=True)

    # AI Analysis Output
    ai_summary = Column(Text, nullable=True)
    ai_recommendation = Column(String(50), nullable=True)  # STRONG_BUY / BUY / HOLD / AVOID
    ai_reasons = Column(JSON, nullable=True)     # list of key reasons
    ai_risks = Column(JSON, nullable=True)       # list of risk factors
    ai_opportunities = Column(JSON, nullable=True)

    # Market Data
    estimated_monthly_sales = Column(Integer, nullable=True)
    avg_price_usd = Column(Float, nullable=True)
    competition_count = Column(Integer, nullable=True)
    top_competitors = Column(JSON, nullable=True)  # [{name, price, rating, reviews}]
    review_samples = Column(JSON, nullable=True)   # positive & negative samples

    # Trend Data
    trend_keywords = Column(JSON, nullable=True)   # [{keyword, volume, growth}]
    seasonality = Column(String(50), nullable=True)  # HIGH / MEDIUM / LOW
    platform_insights = Column(JSON, nullable=True)  # {amazon, shopify, tiktok}

    # Metadata
    status = Column(String(20), default="pending")  # pending / analyzing / completed / failed
    is_starred = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ReviewBatch(Base):
    """Stores raw reviews for sentiment analysis"""
    __tablename__ = "review_batches"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_analysis_id = Column(String, nullable=False, index=True)
    source = Column(String(50), nullable=True)  # amazon / manual / demo
    reviews_raw = Column(JSON, nullable=True)   # [{text, rating, date}]
    sentiment_breakdown = Column(JSON, nullable=True)  # {positive:%, negative:%, neutral:%}
    top_pain_points = Column(JSON, nullable=True)
    top_praises = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class CompetitorProfile(Base):
    """Detailed competitor snapshot"""
    __tablename__ = "competitor_profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_analysis_id = Column(String, nullable=False, index=True)
    competitor_name = Column(String(255), nullable=False)
    platform = Column(String(50), nullable=True)
    price_usd = Column(Float, nullable=True)
    rating = Column(Float, nullable=True)
    review_count = Column(Integer, nullable=True)
    monthly_sales_est = Column(Integer, nullable=True)
    strengths = Column(JSON, nullable=True)
    weaknesses = Column(JSON, nullable=True)
    url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized")


if __name__ == "__main__":
    init_db()
