"""
data/ml/train_priority_model.py
-------------------------------
Trains the 7-Feature Investment Priority ML Regressor:
  Feature 1: Attraction Strength (0-100)
  Feature 2: Cultural / Natural Significance (0-100)
  Feature 3: Growth Opportunity (0-100)
  Feature 4: Accessibility Potential (0-100)
  Feature 5: Seasonality Index (0-100)
  Feature 6: Tourism Opportunity / Demand Proxy (0-100)
  Feature 7: Infrastructure Readiness Score (0-100) [NEW 7th Factor]

Model: GradientBoostingRegressor
Evaluates exact empirical MAE, RMSE, R2, and 5-Fold Cross-Validation.
Saves model artifact to:
  - backend/app/services/priority_model.pkl
  - ml/models/priority_model.pkl
"""

import sys
import os
import json
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "backend"))

from ml.features.feature_pipeline import get_feature_pipeline
from ml.models.tourism_opportunity import TourismOpportunityModel
from app.services.readiness_service import compute_readiness


def train_priority_regressor():
    print("Loading 508-district Ground Truth Feature Matrix...")
    fp = get_feature_pipeline()
    fm = fp.get_feature_matrix()
    opp_model = TourismOpportunityModel()

    feature_rows = []
    target_priorities = []

    for _, row in fm.iterrows():
        f1_attr = float(row["attraction_strength"])
        f_demand = float(row["tourism_demand"]) if pd.notna(row.get("tourism_demand")) else 50.0
        f2_cult = float(row["cultural_natural_significance"])
        f3_growth = float(row["growth_opportunity"])
        f4_access = float(row["accessibility_potential"])
        f5_season = float(row["seasonality"])

        # Compute authentic grounded potential (Full 6-factor model @ 100% weight)
        pot_approx = round(
            0.30 * f1_attr
            + 0.20 * f_demand
            + 0.15 * f2_cult
            + 0.15 * f3_growth
            + 0.10 * f4_access
            + 0.10 * f5_season,
            1
        )
        opp_res = opp_model.compute_opportunity(
            potential_score=pot_approx,
            attraction_strength=f1_attr,
            cultural_natural_significance=f2_cult,
            growth_opportunity=f3_growth,
            accessibility_potential=f4_access,
            seasonality=f5_season,
            uniqueness_score=float(row["uniqueness_score"]),
            experience_potential_score=float(row["experience_potential_score"]),
            activity_diversity_score=float(row["activity_diversity_score"]),
            tourism_demand=row["tourism_demand"]
        )
        f6_opp = float(opp_res["opportunity_score"])

        # Compute realistic readiness score from transit telemetry and asset inventory
        ap = row["asset_profile"]
        road_score = float(ap.get("road_connectivity_score", 60.0))
        rail_score = float(ap.get("rail_connectivity_score", 50.0))
        air_score = float(ap.get("air_connectivity_score", 45.0))
        transport_score = round(0.50 * road_score + 0.30 * rail_score + 0.20 * air_score, 1)

        readiness_inputs = {
            'accommodation': round(min(100.0, max(20.0, f6_opp * 0.85 + np.random.normal(0, 3))), 1),
            'transport': transport_score,
            'connectivity': round(min(100.0, max(25.0, (road_score + air_score) / 2.0)), 1),
            'food_hospitality': round(min(100.0, max(20.0, 0.4 * f1_attr + 0.6 * road_score)), 1),
            'medical_safety': round(min(100.0, max(40.0, 70.0 + 0.2 * road_score)), 1),
            'other_amenities': round(min(100.0, max(15.0, 0.5 * f1_attr + 0.5 * f4_access)), 1),
        }
        f7_readiness = compute_readiness(readiness_inputs)

        # Ground truth priority formulation (Section 4C):
        # High potential + low readiness = high infrastructure intervention urgency (high priority)
        # Low readiness creates an infrastructure deficit headroom boost
        readiness_gap = max(0.0, pot_approx - f7_readiness)  # Unmet potential
        readiness_penalty = 0.08 * (f7_readiness - 75.0) if f7_readiness > 75.0 else 0.0  # Saturated places have lower CapEx priority

        base = (
            0.28 * f1_attr
            + 0.14 * f2_cult
            + 0.18 * f3_growth
            + 0.14 * (100.0 - abs(f4_access - 55.0) * 0.5)
            + 0.08 * f5_season
            + 0.10 * f6_opp
            + 0.08 * (100.0 - f7_readiness)  # Lower readiness increases need for government investment
        )

        urgency_boost = min(12.0, readiness_gap * 0.35)
        ground_truth = base * 0.85 + urgency_boost - readiness_penalty
        ground_truth = round(float(np.clip(ground_truth, 15.0, 98.5)), 1)

        feature_rows.append([f1_attr, f2_cult, f3_growth, f4_access, f5_season, f6_opp, f7_readiness])
        target_priorities.append(ground_truth)

    X = np.array(feature_rows)
    y = np.array(target_priorities)

    feature_names = [
        "attraction_strength",
        "cultural_natural_significance",
        "growth_opportunity",
        "accessibility_potential",
        "seasonality",
        "tourism_opportunity",
        "readiness_score"
    ]

    print(f"Feature matrix shape: {X.shape}, Target shape: {y.shape}")

    # 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)

    model = GradientBoostingRegressor(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.85,
        random_state=42
    )

    model.fit(X_train, y_train)

    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)

    train_mae = float(mean_absolute_error(y_train, y_pred_train))
    test_mae = float(mean_absolute_error(y_test, y_pred_test))
    test_rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_test)))
    test_r2 = float(r2_score(y_test, y_pred_test))

    # 5-fold cross-validation
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X, y, cv=kf, scoring='neg_mean_absolute_error')
    cv_mae = float(-np.mean(cv_scores))
    cv_mae_std = float(np.std(cv_scores))

    cv_r2_scores = cross_val_score(model, X, y, cv=kf, scoring='r2')
    cv_r2 = float(np.mean(cv_r2_scores))

    # Feature importances
    importances = dict(zip(feature_names, [round(float(v), 4) for v in model.feature_importances_]))

    metrics = {
        "model_name": "InvestmentPriorityRegressor",
        "algorithm": "GradientBoostingRegressor (scikit-learn)",
        "feature_count": 7,
        "features": feature_names,
        "records_count": len(X),
        "test_mae": round(test_mae, 3),
        "test_rmse": round(test_rmse, 3),
        "test_r2": round(test_r2, 4),
        "5fold_cv_mae": round(cv_mae, 3),
        "5fold_cv_mae_std": round(cv_mae_std, 3),
        "5fold_cv_r2": round(cv_r2, 4),
        "feature_importances": importances,
        "hourly_token": datetime.now(timezone.utc).strftime("tok_hourly_%Y%m%d_%H00")
    }

    print("\n" + "="*50)
    print("REAL RETRAINED PRIORITY MODEL EMPIRICAL METRICS")
    print("="*50)
    print(f"Test MAE:       {metrics['test_mae']:.3f} points")
    print(f"Test RMSE:      {metrics['test_rmse']:.3f} points")
    print(f"Test R2:        {metrics['test_r2']:.4f}")
    print(f"5-Fold CV MAE:  {metrics['5fold_cv_mae']:.3f} +/- {metrics['5fold_cv_mae_std']:.3f}")
    print(f"5-Fold CV R2:   {metrics['5fold_cv_r2']:.4f}")
    print("\nFeature Importances:")
    for k, v in sorted(importances.items(), key=lambda x: -x[1]):
        print(f"  - {k:30s}: {v*100:.2f}%")
    print("="*50 + "\n")

    # Save to both backend/app/services and ml/models
    save_paths = [
        BASE_DIR / "backend" / "app" / "services" / "priority_model.pkl",
        BASE_DIR / "ml" / "models" / "priority_model.pkl"
    ]

    for p in save_paths:
        p.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, p)
        print(f"Saved model artifact to: {p}")

    meta_path = BASE_DIR / "backend" / "app" / "services" / "priority_model_metadata.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved metadata to: {meta_path}")

    return metrics


if __name__ == "__main__":
    train_priority_regressor()
