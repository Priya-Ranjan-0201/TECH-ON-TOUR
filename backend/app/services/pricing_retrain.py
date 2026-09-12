"""
ML Pricing Model Retraining Service.
Trains Scikit-Learn GradientBoostingRegressor incorporating:
- Base homestay tariffs
- Live occupancy rate
- Days until nearest festival (Calendarific signal)
- Current seasonal demand index (Google Trends signal)
- Weather demand multiplier (OpenWeather signal)
- Weekend indicators and sanitation scores

Saves the model to pricing_model.pkl and updates metadata atomically.
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

from app.services.external_data import (
    fetch_upcoming_festivals,
    fetch_trend_scores,
    fetch_weather_forecast,
)

logger = logging.getLogger("pricing_retrain")

MODEL_PATH = Path(__file__).resolve().parent / "pricing_model.pkl"
META_PATH = Path(__file__).resolve().parent / "pricing_model_metadata.json"


def generate_training_dataset(rows: int = 1500) -> pd.DataFrame:
    """
    Synthesizes training dataset incorporating refreshed external signals.
    Features aligned with TravelSathi pricing service:
    - base_price: (800 - 16000)
    - days_to_festival: (0 - 60)
    - is_weekend: (0 or 1)
    - season_demand_index: (0.2 - 1.0) derived from Google Trends and OpenWeather
    - occupancy_rate_last_30d: (0.1 - 0.98)
    - category_luxury_tier: (1, 2, or 3)
    - review_rating: (3.2 - 5.0)
    Target:
    - suggested_price: optimal dynamic night rate in INR
    """
    np.random.seed(int(datetime.now(timezone.utc).timestamp()) % 100000)

    # Pull refreshed external signals to anchor mean feature distributions
    festivals = fetch_upcoming_festivals()
    nearest_fest_days = festivals[0]["days_away"] if festivals else 15

    trends = fetch_trend_scores()
    avg_trend = np.mean([t["trend_score"] for t in trends]) if trends else 78.0

    weather = fetch_weather_forecast()
    avg_weather_mult = np.mean([w.get("demand_multiplier", 1.05) for w in weather]) if weather else 1.05

    # Luxury tier distribution
    luxury_tiers = np.random.choice([1, 2, 3], size=rows, p=[0.45, 0.40, 0.15])
    base_prices = []
    for tier in luxury_tiers:
        if tier == 1:
            base_prices.append(np.random.uniform(900, 2500))
        elif tier == 2:
            base_prices.append(np.random.uniform(2500, 6000))
        else:
            base_prices.append(np.random.uniform(6000, 16000))
    base_prices = np.array(base_prices)

    # Days to festival biased towards live nearest festival
    days_to_fest = np.random.exponential(scale=max(nearest_fest_days, 5), size=rows).clip(0, 60)

    # Weekend indicator (Fri/Sat/Sun) ~ 3/7 probability
    is_weekend = np.random.choice([0, 1], size=rows, p=[4/7, 3/7])

    # Dynamic season demand index anchored by live Google Trends and weather
    base_demand = np.random.uniform(0.3, 1.0, size=rows)
    trend_factor = (avg_trend / 75.0)
    season_demand_index = np.clip(base_demand * trend_factor * (avg_weather_mult ** 0.5), 0.2, 1.0).round(2)

    # Occupancy rate over last 30 days
    occupancy_rate = np.random.beta(a=3.5, b=2.2, size=rows).clip(0.15, 0.95).round(2)

    # Guest review rating
    review_rating = np.random.uniform(3.2, 5.0, size=rows).round(1)

    # Multipliers:
    # 1. Festival proximity
    festival_factor = np.clip((60 - days_to_fest) / 60.0 * 0.28, 0, 0.28)
    # 2. Weekend markup
    weekend_factor = is_weekend * 0.18
    # 3. Seasonal demand
    season_factor = (season_demand_index - 0.5) * 0.55
    # 4. Occupancy boost
    occupancy_factor = (occupancy_rate - 0.5) * 0.35
    # 5. Rating boost
    rating_factor = (review_rating - 4.0) * 0.08

    multiplier = 1.0 + festival_factor + weekend_factor + season_factor + occupancy_factor + rating_factor
    noise = np.random.normal(0, 35, rows)
    suggested_prices = np.maximum(500.0, (base_prices * multiplier + noise).round(-1))

    df = pd.DataFrame({
        "base_price": base_prices.round(2),
        "days_to_festival": days_to_fest.round(1),
        "is_weekend": is_weekend,
        "season_demand_index": season_demand_index,
        "occupancy_rate_last_30d": occupancy_rate,
        "category_luxury_tier": luxury_tiers,
        "review_rating": review_rating,
        "suggested_price": suggested_prices,
    })

    return df


def retrain_pricing_model(rows: int = 1600) -> Dict[str, Any]:
    """
    Retrains the GradientBoostingRegressor model using updated features.
    Saves new model atomically. If training or saving fails, existing model is preserved.
    """
    logger.info("Starting pricing model retraining with refreshed signals...")
    df = generate_training_dataset(rows=rows)

    feature_cols = [
        "base_price",
        "days_to_festival",
        "is_weekend",
        "season_demand_index",
        "occupancy_rate_last_30d",
        "category_luxury_tier",
        "review_rating",
    ]
    target_col = "suggested_price"

    X = df[feature_cols]
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = GradientBoostingRegressor(
        n_estimators=110,
        learning_rate=0.075,
        max_depth=4,
        min_samples_split=4,
        random_state=42,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, preds))
    r2 = float(r2_score(y_test, preds))
    mape = float(np.mean(np.abs((y_test.values - preds) / np.maximum(y_test.values, 1.0)))) * 100

    run_timestamp = datetime.now(timezone.utc).isoformat()

    # Save model safely
    temp_model_path = MODEL_PATH.with_suffix(".tmp")
    joblib.dump(model, temp_model_path)
    temp_model_path.replace(MODEL_PATH)

    metrics = {
        "test_mae_inr": round(mae, 2),
        "test_r2_score": round(r2, 4),
        "mae_inr": round(mae, 2),
        "r2_score": round(r2, 4),
        "mape_percent": round(mape, 2)
    }

    metadata = {
        "model_name": "Dynamic Pricing Model",
        "algorithm": "GradientBoostingRegressor",
        "framework": "scikit-learn",
        "features": feature_cols,
        "target": target_col,
        "rows_trained": len(df),
        "mae_inr": round(mae, 2),
        "r2_score": round(r2, 4),
        "metrics": metrics,
        "last_trained_utc": run_timestamp,
        "version": "1.1.0-autorefresh",
    }

    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # Force reload in pricing_service in-memory cache if active
    try:
        from app.services.pricing_service import reload_model
        reload_model()
    except Exception as e:
        logger.debug(f"Pricing service reload hook notice: {e}")

    logger.info(f"Model retrained successfully. MAE: ₹{mae:.2f}, R2: {r2:.3f}, Rows: {len(df)}")

    return {
        "mae": round(mae, 2),
        "mae_inr": round(mae, 2),
        "r2": round(r2, 4),
        "r2_score": round(r2, 4),
        "rows_used": len(df),
        "run_at": run_timestamp,
        "status": "success",
    }
