"""
build_recommendation_training_data.py
Generates the 7-feature training set for the Interest + Nearby recommendation ranking model:
1. interest_overlap_score  -- cosine similarity between user's selected interest tags and destination's tags
2. distance_km             -- haversine distance from user's current/last known lat-long to destination
3. season_match            -- 1 if current month falls in destination's best_season, else 0
4. past_category_affinity  -- how often this user has booked/viewed this destination's category before
5. avg_rating               -- destination's review rating
6. price_tier_match         -- 1 if destination's price_range matches user's stated budget tier, else 0
7. global_popularity_30d    -- interaction count across all users, last 30 days (from destination_interactions)

Target:
converted                   -- 1 = booked/added to itinerary, 0 = viewed only
"""

import math
import os
from pathlib import Path
import numpy as np
import pandas as pd

np.random.seed(42)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_PATH = BASE_DIR / "data" / "places.csv"
OUTPUT_CSV = BASE_DIR / "data" / "ml" / "recommendation_training_data.csv"

print(f"Loading destination catalog from: {DATA_PATH}")
dest_df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(dest_df)} verified destinations.")

# Interest tags taxonomy matching TravelSathi's planner & catalog
ALL_INTEREST_TAGS = [
    "heritage", "monument", "temple", "spiritual", "nature", "wildlife",
    "trekking", "adventure", "culture", "tribal", "homestay", "food",
    "culinary", "handicrafts", "wellness", "photography", "scenic", "beach"
]

BUDGET_TIERS = ["budget", "mid", "luxury"]
CATEGORIES = ["heritage", "nature", "spiritual", "adventure", "rural", "beach", "cultural", "attraction"]

MONTH_NAMES = ["all year", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
CURRENT_MONTH = 9  # September

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)

def is_season_match(best_season_str, month_num):
    if not isinstance(best_season_str, str):
        return 1
    s = best_season_str.lower()
    if "all year" in s or "throughout" in s:
        return 1
    target = MONTH_NAMES[month_num]
    return 1 if target in s else 0

def compute_interest_overlap(user_tags, dest_text):
    if not user_tags or not isinstance(dest_text, str):
        return 0.1
    dest_lower = dest_text.lower()
    hits = sum(1 for tag in user_tags if tag in dest_lower)
    return round(hits / max(len(user_tags), 1), 3)

# Map price ranges to tiers
def map_price_range(val):
    if not isinstance(val, str):
        return "mid"
    v = val.lower()
    if "budget" in v or "₹" in v and "1000" in v or "free" in v:
        return "budget"
    if "luxury" in v or "high" in v or "premium" in v:
        return "luxury"
    return "mid"

# Compute global 30-day popularity proxy
if "review_count" in dest_df.columns:
    max_rev = max(dest_df["review_count"].max(), 1)
    dest_df["global_popularity_30d"] = np.clip(
        (dest_df["review_count"] / max_rev * 400) + np.random.poisson(20, len(dest_df)),
        1,
        1000
    ).astype(int)
else:
    dest_df["global_popularity_30d"] = np.random.randint(5, 500, len(dest_df))

dest_df["price_tier"] = dest_df["price_range"].apply(map_price_range)

# Create 500 representative user personas with diverse locations, interest profiles, and category affinities
user_profiles = []
for i in range(1, 501):
    num_interests = np.random.randint(2, 5)
    selected_tags = list(np.random.choice(ALL_INTEREST_TAGS, size=num_interests, replace=False))
    primary_category = np.random.choice(CATEGORIES)
    budget_tier = np.random.choice(BUDGET_TIERS, p=[0.45, 0.40, 0.15])
    # Distribute across Indian travel hubs (Delhi, Mumbai, Bengaluru, Kolkata, Chennai, Patna, Jaipur, etc.)
    centers = [
        (28.61, 77.20),  # Delhi / North
        (19.07, 72.87),  # Mumbai / West
        (12.97, 77.59),  # Bengaluru / South
        (22.57, 88.36),  # Kolkata / East
        (25.59, 85.13),  # Patna / Central-East
        (26.91, 75.78),  # Jaipur / North-West
        (13.08, 80.27),  # Chennai / South
        (31.10, 77.17),  # Shimla / Himalayan
    ]
    lat_center, lng_center = centers[np.random.randint(0, len(centers))]
    user_profiles.append({
        "user_id": f"usr-{i:04d}",
        "interests": selected_tags,
        "primary_category": primary_category,
        "budget_tier": budget_tier,
        "lat": lat_center + np.random.normal(0, 1.2),
        "lng": lng_center + np.random.normal(0, 1.2),
        "history_count": np.random.poisson(6)
    })

print(f"Synthesizing bootstrap training dataset across {len(user_profiles)} personas and {len(dest_df)} destinations...")

# Generate 35,000 candidate interactions
dest_records = dest_df[["id", "name", "category", "description", "best_season", "rating", "latitude", "longitude", "price_tier", "global_popularity_30d"]].to_dict(orient="records")

rows = []
for _ in range(35000):
    user = user_profiles[np.random.randint(0, len(user_profiles))]
    dest = dest_records[np.random.randint(0, len(dest_records))]

    # 1. interest_overlap_score
    dest_tags_text = f"{dest.get('category', '')} {dest.get('description', '')} {dest.get('name', '')}"
    interest_overlap = compute_interest_overlap(user["interests"], dest_tags_text)

    # 2. distance_km
    dist = haversine(user["lat"], user["lng"], dest["latitude"], dest["longitude"])

    # 3. season_match
    season_match = is_season_match(dest.get("best_season", ""), CURRENT_MONTH)

    # 4. past_category_affinity
    dest_cat = str(dest.get("category", "")).lower()
    if user["primary_category"] in dest_cat:
        past_cat_affinity = min(1.0, 0.4 + (user["history_count"] * 0.08) + np.random.normal(0, 0.05))
    else:
        past_cat_affinity = max(0.0, np.random.exponential(0.12))
    past_cat_affinity = round(min(max(past_cat_affinity, 0.0), 1.0), 3)

    # 5. avg_rating
    rating = float(dest.get("rating") or 4.0)
    rating = round(min(max(rating, 1.0), 5.0), 2)

    # 6. price_tier_match
    price_match = 1 if dest.get("price_tier") == user["budget_tier"] else 0

    # 7. global_popularity_30d
    pop_30d = int(dest.get("global_popularity_30d") or 50)

    # Ground-truth conversion probability (logistic link with realistic weights)
    # Strongest drivers: interest overlap, seasonal appropriateness, nearby proximity, rating, price match
    dist_penalty = min(dist / 600.0, 1.5)  # travelers prefer reachable weekend trips or well-suited long trips
    z = (
        2.5 * interest_overlap
        + 1.8 * past_cat_affinity
        + 1.2 * season_match
        + 1.0 * (rating - 3.5)
        + 0.8 * price_match
        + 0.002 * min(pop_30d, 500)
        - 0.9 * dist_penalty
        - 1.4  # baseline intercept
    )
    prob = 1.0 / (1.0 + math.exp(-z))
    converted = 1 if np.random.rand() < prob else 0

    rows.append({
        "interest_overlap_score": interest_overlap,
        "distance_km": dist,
        "season_match": season_match,
        "past_category_affinity": past_cat_affinity,
        "avg_rating": rating,
        "price_tier_match": price_match,
        "global_popularity_30d": pop_30d,
        "converted": converted
    })

training_df = pd.DataFrame(rows)
training_df.to_csv(OUTPUT_CSV, index=False)
print(f"Successfully generated {len(training_df)} rows with {len(training_df.columns)} columns.")
print(f"Target distribution: Converted (1) = {(training_df['converted'] == 1).mean() * 100:.1f}%, Viewed Only (0) = {(training_df['converted'] == 0).mean() * 100:.1f}%")
print(f"Saved to: {OUTPUT_CSV}")
