import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Numeric
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class DestinationMaster(Base):
    """
    Core Grounding Catalog from Tech-On-Tour (12,293 verified destinations across 36 States/UTs).
    """
    __tablename__ = "destinations_master"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # attraction, hotel, homestay, restaurant
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    price_range = Column(String(20), nullable=False, default="mid")  # budget, mid, luxury
    rating = Column(Float, nullable=False, default=4.0)
    review_count = Column(Integer, nullable=False, default=0)
    description = Column(Text, nullable=False)
    best_season = Column(String(50), nullable=False, default="All Year")
    image_url = Column(Text, nullable=False)

    # Anti-overtourism & DPI Flags
    is_hidden_gem = Column(Boolean, default=False, index=True)
    crowd_density_score = Column(Integer, default=50)  # 0 (desolate) to 100 (heavily congested)
    safety_score = Column(Integer, default=85)         # 0 to 100 normalized score

    __table_args__ = (
        Index("idx_dest_state_category", "state", "category"),
        Index("idx_dest_lat_lng", "latitude", "longitude"),
    )


class Homestay(Base):
    """
    Rural and Tribal Homestays (Aligned with PM-JUGA scheme).
    """
    __tablename__ = "homestays"

    homestay_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    host_id = Column(String(36), nullable=False, index=True)
    host_name = Column(String(100), nullable=False)
    host_phone = Column(String(20), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False)
    base_price_inr = Column(Numeric(10, 2), nullable=False)
    is_tribal_pmjuga = Column(Boolean, default=False, index=True)
    sanitation_trust_score = Column(Integer, default=85)  # 0 to 100 score from vision audit
    is_verified = Column(Boolean, default=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    amenities = Column(String(255), default="Bed, Washroom, Traditional Meals, Solar Light")
    image_url = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_homestays_spatial", "latitude", "longitude"),
        Index("idx_homestays_pmjuga", "is_tribal_pmjuga", "state"),
    )


class Guide(Base):
    """
    Certified Local Tour Guides (Vocal for Local Ecosystem).
    """
    __tablename__ = "guides"

    guide_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=False)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False)
    specialization_tags = Column(String(255), nullable=False)  # e.g. "heritage,nature,tribal_art"
    license_number = Column(String(50), unique=True, nullable=True)
    hourly_rate_inr = Column(Numeric(10, 2), nullable=False, default=300.00)
    languages_spoken = Column(String(255), nullable=False, default="Hindi, English")
    rating = Column(Float, default=4.9)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_guides_spatial", "latitude", "longitude"),
    )


class Booking(Base):
    """
    Shared Bookings with Split-Payout accounting (Zero-Commission DPI).
    """
    __tablename__ = "bookings"

    booking_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tourist_id = Column(String(36), nullable=False, index=True)
    tourist_name = Column(String(100), nullable=False)
    destination_id = Column(Integer, ForeignKey("destinations_master.id"), nullable=True)
    homestay_id = Column(String(36), ForeignKey("homestays.homestay_id"), nullable=True)
    guide_id = Column(String(36), ForeignKey("guides.guide_id"), nullable=True)
    check_in_date = Column(String(20), nullable=False)
    check_out_date = Column(String(20), nullable=False)
    total_amount_inr = Column(Numeric(12, 2), nullable=False)
    platform_fee_inr = Column(Numeric(10, 2), default=0.00)
    host_payout_inr = Column(Numeric(10, 2), nullable=False)
    guide_payout_inr = Column(Numeric(10, 2), default=0.00)
    payment_status = Column(String(30), default="confirmed")  # confirmed, split_initiated, completed
    upi_transaction_id = Column(String(100), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Itinerary(Base):
    """
    Saved Multi-Day AI Itineraries (Travel Twin Generator).
    """
    __tablename__ = "itineraries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    destination = Column(String(100), nullable=False, index=True)
    days = Column(Integer, nullable=False)
    budget = Column(String(50), nullable=False)
    interests = Column(String(255), nullable=False)
    plan_json = Column(Text, nullable=False)  # Day-by-day JSON schedule
    created_at = Column(DateTime, default=datetime.utcnow)


class ReviewTraining(Base):
    """
    Pre-computed Review Authenticity & Sentiment Trust Layer.
    Uses HuggingFace DistilBERT SST-2 sentiment score + authenticity rating.
    """
    __tablename__ = "reviews_training"

    id = Column(Integer, primary_key=True, autoincrement=True)
    place_id = Column(Integer, ForeignKey("destinations_master.id"), nullable=False, index=True)
    author_name = Column(String(100), nullable=False)
    rating = Column(Float, nullable=False)
    review_text = Column(Text, nullable=False)
    sentiment_score = Column(Float, nullable=False)       # 0.0 (negative) to 1.0 (positive)
    authenticity_score = Column(Integer, nullable=False)   # 0 to 100
    is_verified_booking = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AntiOvertourismPair(Base):
    """
    Curated Mapping for Overtourism Diversion:
    Redirecting traffic from congested hotspots to hidden gem alternatives.
    """
    __tablename__ = "anti_overtourism_pairs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    popular_name = Column(String(100), nullable=False, index=True)
    popular_state = Column(String(100), nullable=False)
    popular_footfall_annual = Column(String(50), default="High (>2M)")
    alternative_name = Column(String(100), nullable=False)
    alternative_state = Column(String(100), nullable=False)
    crowd_reduction_pct = Column(Integer, nullable=False, default=60)
    reason = Column(Text, nullable=False)
    destination_id = Column(Integer, ForeignKey("destinations_master.id"), nullable=True)


class UserBadge(Base):
    """
    Gamification & Sustainability Explorer Badges.
    """
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), nullable=False, index=True)
    badge_type = Column(String(50), nullable=False)        # eco_sathi, hidden_gem_pioneer, heritage_keeper
    badge_title = Column(String(100), nullable=False)
    badge_icon = Column(String(50), default="leaf")
    points_awarded = Column(Integer, default=50)
    awarded_at = Column(DateTime, default=datetime.utcnow)


class MarketplaceRFP(Base):
    """
    Reverse Marketplace: Traveler Requests For Proposal (RFP) broadcast from itineraries.
    """
    __tablename__ = "marketplace_rfps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    itinerary_id = Column(String(36), nullable=True)
    traveler_name = Column(String(100), nullable=False, default="Priya Sharma")
    traveler_phone = Column(String(20), nullable=True, default="+91 98765 43210")
    destination = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    days = Column(Integer, nullable=False, default=3)
    target_budget_inr = Column(Numeric(10, 2), nullable=False)
    status = Column(String(30), default="open")  # open, bid_received, accepted, completed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class HostBid(Base):
    """
    Reverse Marketplace: Host and Guide Bids submitted against open Traveler RFPs.
    """
    __tablename__ = "host_bids"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rfp_id = Column(String(36), ForeignKey("marketplace_rfps.id"), nullable=False, index=True)
    host_id = Column(String(36), nullable=False, index=True)
    host_name = Column(String(100), nullable=False)
    homestay_name = Column(String(255), nullable=True)
    bid_amount_inr = Column(Numeric(10, 2), nullable=False)
    inclusions = Column(Text, nullable=False)  # e.g. "3 Nights Homestay + Organic Breakfast + Tribal Guide"
    message = Column(Text, nullable=True)
    status = Column(String(30), default="submitted")  # submitted, accepted, declined
    created_at = Column(DateTime, default=datetime.utcnow)

