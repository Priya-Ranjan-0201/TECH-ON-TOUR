"""
generate_pricing_training_data.py
Generates realistic, documented synthetic training data for TravelSathi Dynamic Homestay Pricing.
Dataset Size: 2,500 observations modeled on Indian homestay & heritage stay market dynamics.

Assumption & Multiplier Rationale:
1. Base Price by Luxury Tier:
   - Tier 1 (Budget / Eco-Homestay): INR 900 - 2,500/night
   - Tier 2 (Comfort / Cultural Haveli): INR 2,500 - 6,000/night
   - Tier 3 (Heritage Palace / Luxury Plantation): INR 6,000 - 16,000/night
2. Festival Proximity (days_to_festival):
   - Approaching festivals (e.g. Diwali, Bastar Dussehra, Pushkar Mela) create surge demand.
   - 0-7 days out: +28% surge; scales down linearly to 0% at 60 days.
3. Weekend Indicator (is_weekend):
   - Friday/Saturday/Sunday nights command a +18% leisure travel premium.
4. Season Demand Index (season_demand_index):
   - Ranges 0.3 (monsoon / off-peak) to 1.0 (peak winter / festival season).
   - Dynamic multiplier swings between -11% (off-peak discount) and +27.5% (peak surge).
5. Historical Occupancy (occupancy_rate_last_30d):
   - High occupancy (>70%) signals scarcity: up to +15.7% price bump.
   - Low occupancy (<35%) triggers dynamic discounts (down to -12%) to incentivize bookings.
6. Guest Review Rating (review_rating):
   - Above 4.0 stars adds a reputation premium (+0.08 per star above 4.0).
7. Stochastic Noise Term:
   - Real-world markets have unobserved variance (local weather, competitor rates, host preferences).
   - Adds N(0, 0.035) random Gaussian noise so the model learns generalizable price elasticity
     rather than trivial deterministic formula memorization.
"""

import os
import numpy as np
import pandas as pd

def generate_pricing_data(n_samples: int = 2500, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)
    
    # 1. Luxury Tier & Base Price
    luxury_tiers = np.random.choice([1, 2, 3], size=n_samples, p=[0.45, 0.40, 0.15])
    base_prices = []
    for tier in luxury_tiers:
        if tier == 1:
            base_prices.append(np.random.uniform(900, 2500))
        elif tier == 2:
            base_prices.append(np.random.uniform(2500, 6000))
        else:
            base_prices.append(np.random.uniform(6000, 16000))
    base_prices = np.array(base_prices)
    
    # 2. Days to major Indian festival/event (0 to 60 days)
    days_to_festival = np.random.randint(0, 61, size=n_samples)
    
    # 3. Weekend indicator (Fri/Sat/Sun) ~ 3/7 probability
    is_weekend = np.random.choice([0, 1], size=n_samples, p=[4/7, 3/7])
    
    # 4. Season demand index (0.3 monsoon/off-season to 1.0 peak winter/holiday season)
    season_demand_index = np.round(np.random.uniform(0.30, 1.00, size=n_samples), 2)
    
    # 5. Occupancy rate over last 30 days (0.15 to 0.95)
    occupancy_rate_last_30d = np.round(np.random.uniform(0.15, 0.95, size=n_samples), 2)
    
    # 6. Guest review rating (3.2 to 5.0)
    review_rating = np.round(np.random.uniform(3.2, 5.0, size=n_samples), 1)
    
    # Elastic multiplier logic
    festival_factor = np.clip((60 - days_to_festival) / 60.0 * 0.28, 0.0, 0.28)
    weekend_factor = is_weekend * 0.18
    season_factor = (season_demand_index - 0.5) * 0.55
    occupancy_factor = (occupancy_rate_last_30d - 0.5) * 0.35
    rating_factor = (review_rating - 4.0) * 0.08
    
    # Total combined multiplier
    pricing_multiplier = 1.0 + festival_factor + weekend_factor + season_factor + occupancy_factor + rating_factor
    
    # Realistic unobserved noise term N(0, 0.035) to prevent synthetic formula memorization
    noise = np.random.normal(0, 0.035, size=n_samples)
    final_multiplier = np.clip(pricing_multiplier + noise, 0.65, 2.20)
    
    recommended_price = np.round(base_prices * final_multiplier, -1)  # Round to nearest 10 INR
    
    df = pd.DataFrame({
        "base_price": np.round(base_prices, 2),
        "days_to_festival": days_to_festival,
        "is_weekend": is_weekend,
        "season_demand_index": season_demand_index,
        "occupancy_rate_last_30d": occupancy_rate_last_30d,
        "category_luxury_tier": luxury_tiers,
        "review_rating": review_rating,
        "recommended_price": recommended_price,
        "suggested_price": recommended_price  # Compatibility alias
    })
    
    return df

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "pricing_training_data.csv")
    
    df = generate_pricing_data(2500, random_seed=42)
    df.to_csv(out_file, index=False)
    print(f"[✓] Successfully generated {len(df)} dynamic pricing rows saved to: {out_file}")
    print("\nDataset Sample:")
    print(df.head())
    print("\nDataset Summary Statistics:")
    print(df.describe().T[["mean", "std", "min", "max"]])
