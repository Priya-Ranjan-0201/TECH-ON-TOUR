"""
ml/features/interaction_features.py
Feature aggregation for user interaction logs and time-window velocity metrics.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np
from ml.config.settings import INTERACTION_WEIGHTS

def compute_interaction_velocity(
    interactions_df: pd.DataFrame,
    destination_id: int,
    ref_timestamp: pd.Timestamp
) -> Dict[str, float]:
    """
    Computes activity counts and velocity across 7-day, 14-day, 30-day, and 90-day sliding windows.
    Used by Model 5 (Trending) and Model 6 (Demand).
    """
    dest_df = interactions_df[interactions_df["destination_id"] == destination_id].copy()
    if dest_df.empty:
        return {
            "activity_7d": 0.0,
            "activity_14d": 0.0,
            "activity_30d": 0.0,
            "activity_90d": 0.0,
            "velocity_ratio": 1.0,
            "booking_rate": 0.05
        }

    dest_df["dt"] = pd.to_datetime(dest_df["timestamp"])
    t_ref = pd.to_datetime(ref_timestamp)

    d7 = dest_df[dest_df["dt"] >= (t_ref - pd.Timedelta(days=7))]
    d14 = dest_df[dest_df["dt"] >= (t_ref - pd.Timedelta(days=14))]
    d30 = dest_df[dest_df["dt"] >= (t_ref - pd.Timedelta(days=30))]
    d90 = dest_df[dest_df["dt"] >= (t_ref - pd.Timedelta(days=90))]

    w7 = sum(INTERACTION_WEIGHTS.get(str(e).lower(), 1.0) for e in d7["event_type"])
    w14 = sum(INTERACTION_WEIGHTS.get(str(e).lower(), 1.0) for e in d14["event_type"])
    w30 = sum(INTERACTION_WEIGHTS.get(str(e).lower(), 1.0) for e in d30["event_type"])
    w90 = sum(INTERACTION_WEIGHTS.get(str(e).lower(), 1.0) for e in d90["event_type"])

    # Recent daily rate vs baseline daily rate
    daily_7d = w7 / 7.0
    daily_90d = w90 / 90.0
    velocity = float(daily_7d / max(daily_90d, 0.5))

    bookings = (d30["event_type"] == "booking").sum()
    views = max((d30["event_type"] == "view").sum(), 1)
    booking_rate = float(bookings / views)

    return {
        "activity_7d": float(w7),
        "activity_14d": float(w14),
        "activity_30d": float(w30),
        "activity_90d": float(w90),
        "velocity_ratio": round(velocity, 3),
        "booking_rate": round(booking_rate, 4)
    }
