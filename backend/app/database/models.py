import uuid
from datetime import datetime, timezone
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

    # Research & Data Enrichment Fields (Wikipedia / Wikimedia / Verified)
    summary = Column(Text, nullable=True)
    image_source = Column(String(50), nullable=True, default="placeholder")  # 'wikipedia' | 'wikimedia_commons' | 'manual' | 'placeholder'
    needs_manual_photo = Column(Boolean, default=False, index=True)
    photo_verified_at = Column(DateTime, nullable=True)

    # Anti-overtourism & DPI Flags
    is_famous = Column(Boolean, default=False, index=True)
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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


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
    awarded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class PipelineRun(Base):
    """
    ML Pipeline Execution Log: tracks daily data refresh and model retraining runs.
    """
    __tablename__ = "pipeline_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_at = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)  # "success" or "failed"
    mae = Column(Float, nullable=True)
    r2 = Column(Float, nullable=True)
    rows_used = Column(Integer, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SOSEvent(Base):
    """
    Emergency SOS Incidents logged with real coordinates and contact dispatch.
    """
    __tablename__ = "sos_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(String(36), nullable=False, default="tourist_guest")
    traveler_name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)
    status = Column(String(30), default="dispatched")  # "dispatched", "acknowledged", "resolved"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class UserPreference(Base):
    """
    User personalization profiles for candidate ranking and cold-start handling.
    """
    __tablename__ = "user_preferences"

    user_id = Column(String(36), primary_key=True, index=True)
    age_group = Column(String(20), default="26-40")  # '18-25', '26-40', '41-60', '60+'
    travel_style = Column(String(50), default="nature")  # 'nature', 'heritage', 'adventure', 'spiritual', 'culinary', 'rural'
    group_type = Column(String(30), default="family")  # 'solo', 'couple', 'family', 'friends'
    preferred_categories = Column(String(255), default="attraction,nature,heritage")
    budget_tier = Column(String(20), default="mid")  # 'budget', 'mid', 'luxury'
    food_preference = Column(String(50), default="vegetarian")
    preferred_pace = Column(String(30), default="moderate")
    preferred_stay = Column(String(100), nullable=True)
    accessibility_requirements = Column(String(255), nullable=True)
    personalization_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class UserInteraction(Base):
    """
    Interaction signals recorded for online and offline model training.
    """
    __tablename__ = "user_interactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), nullable=False, index=True)
    destination_id = Column(Integer, ForeignKey("destinations_master.id"), nullable=False, index=True)
    action_type = Column(String(30), nullable=False, index=True)  # 'view', 'click', 'save', 'skip', 'visit', 'rate', 'book'
    dwell_time_seconds = Column(Integer, default=0)
    rating = Column(Float, nullable=True)
    context_metadata = Column(Text, nullable=True)  # JSON with weather, season, distance
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class DestinationSeasonProfile(Base):
    """
    Structured seasonal and weather suitability profile per destination.
    """
    __tablename__ = "destination_season_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    destination_id = Column(Integer, ForeignKey("destinations_master.id"), unique=True, nullable=False, index=True)
    ideal_months = Column(String(50), default="10,11,12,1,2,3")
    acceptable_months = Column(String(50), default="4,9")
    avoid_months = Column(String(50), default="5,6")
    monsoon_suitability = Column(Float, default=0.6)  # 0.0 to 1.0
    winter_suitability = Column(Float, default=0.9)
    summer_suitability = Column(Float, default=0.5)
    is_indoor_attraction = Column(Boolean, default=False)
    weather_sensitivity = Column(String(20), default="medium")  # 'low', 'medium', 'high'


class LocationShareSession(Base):
    """
    Explicit user-controlled live location sharing session with strict hourly TTL retention.
    """
    __tablename__ = "location_share_sessions"

    session_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id = Column(String(36), nullable=True, index=True)
    owner_user_id = Column(String(36), nullable=False, index=True)
    sharing_mode = Column(String(30), default="off")  # 'off', 'one_time', 'live_navigation', 'group_sharing', 'trip_track'
    is_active = Column(Boolean, default=True, index=True)
    allowed_members_json = Column(Text, default="[]")
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)  # Auto-expire after session completion


class LocationPing(Base):
    """
    Temporary GPS coordinate pings recorded only during active session.
    """
    __tablename__ = "location_pings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(36), ForeignKey("location_share_sessions.session_id"), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy_meters = Column(Float, default=10.0)
    speed_mps = Column(Float, nullable=True)
    heading_degrees = Column(Float, nullable=True)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class TripExpense(Base):
    """
    Group trip expense tracking with multi-person split settlement.
    """
    __tablename__ = "trip_expenses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id = Column(String(36), nullable=False, index=True)
    payer_user_id = Column(String(36), nullable=False, index=True)
    payer_name = Column(String(100), nullable=False, default="Traveler")
    title = Column(String(255), nullable=False)
    amount_inr = Column(Numeric(10, 2), nullable=False)
    category = Column(String(50), default="misc")  # 'stay', 'food', 'travel', 'activity', 'misc'
    split_type = Column(String(20), default="equal")  # 'equal', 'custom', 'by_shares'
    receipt_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ExpenseParticipant(Base):
    """
    Per-person allocation and settlement status for an expense.
    """
    __tablename__ = "expense_participants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    expense_id = Column(String(36), ForeignKey("trip_expenses.id"), nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    user_name = Column(String(100), nullable=False, default="Member")
    share_amount_inr = Column(Numeric(10, 2), nullable=False)
    is_settled = Column(Boolean, default=False)


class SavedPlaceItem(Base):
    """
    User saved destinations for quick bookmarking and offline trip pack downloads.
    """
    __tablename__ = "saved_places"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), nullable=False, index=True)
    destination_id = Column(Integer, ForeignKey("destinations_master.id"), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class DestinationInteraction(Base):
    """
    Interaction signals recorded every time a user views, searches, books, or includes a destination in an itinerary.
    Powers the recommendation ranking model and trending metrics.
    """
    __tablename__ = "destination_interactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), nullable=False, index=True)
    destination_id = Column(Integer, ForeignKey("destinations_master.id"), nullable=False, index=True)
    interaction_type = Column(String(30), nullable=False, index=True)  # 'view', 'search', 'book', 'itinerary_include'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class LiveLocation(Base):
    """
    Ephemeral live GPS coordinates per user with 8-hour retention limit.
    Powers Nearby recommendations, distance calculation, SOS emergency response, and group maps.
    """
    __tablename__ = "live_locations"

    user_id = Column(String(36), primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), index=True)


class User(Base):
    """
    Platform User Authentication & Role Account Model.
    """
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(String(20), nullable=False, default="tourist")  # 'tourist', 'host', 'dmo', 'admin'
    avatar = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AuditLog(Base):
    """
    Security Audit Log recording all administrative and destructive operations.
    Enforces accountability for compliance, security reviews, and judges' audit.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    actor_id = Column(String(36), nullable=False, index=True)
    actor_email = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False, index=True)  # e.g. 'SUSPEND_LISTING', 'DELETE_LISTING', 'CHANGE_USER_ROLE'
    target_id = Column(String(100), nullable=False, index=True)
    details = Column(Text, nullable=True)  # JSON description of changes
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class HourlySignalCache(Base):
    """
    High-speed cache for hourly refreshed live external signals.
    Stores weather, holiday/festival proximity, search demand velocity, and pricing inputs.
    """
    __tablename__ = "hourly_signal_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    signal_type = Column(String(50), nullable=False, index=True)  # 'weather', 'festivals', 'trends', 'pricing_inputs'
    signal_key = Column(String(100), nullable=False, index=True)  # e.g. 'Kullu-Manali', 'Diwali', 'national_demand'
    payload_json = Column(Text, nullable=False)
    is_live = Column(Boolean, default=True)
    source = Column(String(100), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), index=True)




