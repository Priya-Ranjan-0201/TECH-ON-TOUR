"""
ml/training/train_trending.py
MODEL 5: Popularity & Trending Destination Model.
Calculates trend_score and trend_status (Rising, Consistently Popular, Seasonal, Declining)
using sliding time windows: 7d, 14d, 30d, 90d activity velocities and historical baselines.
"""

import os
import sys
import json
import joblib
from pathlib import Path
import numpy as np
import pandas as pd
from scipy.stats import spearmanr
from sklearn.model_selection import train_test_split
from sklearn.ensemble import HistGradientBoostingRegressor

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from ml.config.settings import PROCESSED_DATA_DIR, MODELS_DIR, RANDOM_SEED
from ml.features.interaction_features import compute_interaction_velocity
from ml.evaluation.metrics import compute_regression_report_dict

def train_trending_model():
    print("=================================================================")
    print("  Training MODEL 5: Popularity & Trending Destination Model      ")
    print("=================================================================")

    interactions_df = pd.read_csv(PROCESSED_DATA_DIR / "interactions.csv")
    dests_df = pd.read_csv(PROCESSED_DATA_DIR / "destinations.csv")

    ref_date = pd.to_datetime(interactions_df["timestamp"].max())
    print(f"[*] Analyzing interaction velocities anchored at reference date: {ref_date}")

    records = []
    for _, dest in dests_df.iloc[:2000].iterrows():
        did = int(dest["destination_id"])
        base_pop = float(dest["popularity_score"])
        vel = compute_interaction_velocity(interactions_df, did, ref_date)

        # Growth rate = (7d daily rate - 90d daily rate) / max(90d daily rate, 0.1)
        daily_7 = vel["activity_7d"] / 7.0
        daily_90 = vel["activity_90d"] / 90.0
        growth_rate = ((daily_7 - daily_90) / max(daily_90, 0.5)) * 100.0

        # Normalized trend score combining recent velocity + growth rate + baseline popularity
        trend_score = float(np.clip((0.50 * min(vel["velocity_ratio"] / 3.0, 1.0)) + (0.30 * base_pop) + (0.20 * min(max(growth_rate, 0.0) / 100.0, 1.0)), 0.05, 0.99))

        # Status categorization
        if growth_rate >= 35.0 and vel["velocity_ratio"] >= 1.3:
            status = "Rising"
        elif base_pop >= 0.70 and vel["velocity_ratio"] >= 0.9:
            status = "Consistently Popular"
        elif vel["velocity_ratio"] >= 1.5:
            status = "Seasonal Spike"
        else:
            status = "Steady / Declining"

        records.append({
            "destination_id": did,
            "activity_7d": vel["activity_7d"],
            "activity_14d": vel["activity_14d"],
            "activity_30d": vel["activity_30d"],
            "activity_90d": vel["activity_90d"],
            "velocity_ratio": vel["velocity_ratio"],
            "booking_rate": vel["booking_rate"],
            "base_popularity": base_pop,
            "growth_rate": round(growth_rate, 2),
            "trend_score": round(trend_score, 4),
            "trend_status": status
        })

    df = pd.DataFrame(records)

    features = [
        "activity_7d", "activity_14d", "activity_30d", "activity_90d",
        "velocity_ratio", "booking_rate", "base_popularity", "growth_rate"
    ]
    target = "trend_score"

    X = df[features]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_SEED
    )

    print(f"[*] Training trending model on {len(X_train)} destinations, testing on {len(X_test)}...")

    reg = HistGradientBoostingRegressor(
        max_iter=100,
        learning_rate=0.08,
        random_state=RANDOM_SEED
    )
    reg.fit(X_train, y_train)

    test_preds = reg.predict(X_test)
    eval_report = compute_regression_report_dict(y_test.values, test_preds)

    # Spearman rank correlation
    rho, _ = spearmanr(y_test.values, test_preds)
    eval_report["spearman_rho"] = round(float(rho), 4)

    print("\n---------------- MODEL 5 EVALUATION RESULTS ----------------")
    print(f"  Test MAE:          {eval_report['mae']:.4f}")
    print(f"  Test RMSE:         {eval_report['rmse']:.4f}")
    print(f"  Test R²:           {eval_report['r2']:.4f}")
    print(f"  Spearman Rho (ρ):  {eval_report['spearman_rho']:.4f}")
    print("-------------------------------------------------------------")

    out_dir = MODELS_DIR / "trending_model"
    out_dir.mkdir(parents=True, exist_ok=True)
    model_path = out_dir / "model.pkl"
    meta_path = out_dir / "metadata.json"

    joblib.dump(reg, model_path)
    metadata = {
        "model_name": "MODEL 5: Popularity & Trending Destination Model",
        "algorithm": "HistGradientBoostingRegressor",
        "features": features,
        "metrics": eval_report,
        "n_samples": len(df),
        "status_distribution": df["trend_status"].value_counts().to_dict()
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"[OK] Saved model to {model_path}")
    print(f"[OK] Saved metadata to {meta_path}")

if __name__ == "__main__":
    train_trending_model()
