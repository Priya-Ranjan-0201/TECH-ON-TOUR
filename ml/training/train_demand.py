"""
ml/training/train_demand.py
MODEL 6: Travel Demand / Crowdedness Prediction Model.
Predicts demand_score (0.0 to 1.0) and expected crowd level (Low, Moderate, High, Very High)
using calendar lags, weekends, holidays, festival proximity, and search volumes.
"""

import os
import sys
import json
import joblib
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import HistGradientBoostingRegressor, HistGradientBoostingClassifier

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from ml.config.settings import PROCESSED_DATA_DIR, MODELS_DIR, RANDOM_SEED
from ml.evaluation.metrics import compute_regression_report_dict, compute_classification_report_dict

def train_demand_model():
    print("=================================================================")
    print("  Training MODEL 6: Travel Demand / Crowdedness Prediction Model ")
    print("=================================================================")

    demand_df = pd.read_csv(PROCESSED_DATA_DIR / "demand.csv")
    dests_df = pd.read_csv(PROCESSED_DATA_DIR / "destinations.csv")

    df = demand_df.merge(
        dests_df[["destination_id", "popularity_score", "accessibility_score"]],
        on="destination_id",
        how="inner"
    )

    df["dt"] = pd.to_datetime(df["date"])
    df["month"] = df["dt"].dt.month
    df["day_of_week"] = df["dt"].dt.dayofweek
    df["is_weekend"] = df["day_of_week"].apply(lambda d: 1 if d >= 5 else 0)

    # Engineered interaction and intensity features
    df["search_booking_ratio"] = df["bookings"] / (df["searches"] + 1.0)
    df["booking_intensity"] = np.log1p(df["bookings"].clip(lower=0))
    df["search_intensity"] = np.log1p(df["searches"].clip(lower=0))
    df["event_boost"] = df["holiday"] * 1.5 + df["festival"] * 2.0
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12.0)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12.0)
    df["weekend_pop"] = df["is_weekend"] * df["popularity_score"]

    # Normalize visitors into continuous demand_score (0.0 to 1.0)
    max_vis = max(df["visitors"].quantile(0.99), 1)
    df["demand_score"] = np.clip(df["visitors"] / max_vis, 0.05, 0.99).round(3)

    # Categorize crowd level
    def map_crowd_level(score):
        if score >= 0.75: return "Very High"
        elif score >= 0.50: return "High"
        elif score >= 0.28: return "Moderate"
        else: return "Low"

    df["crowd_level"] = df["demand_score"].apply(map_crowd_level)

    features = [
        "month", "day_of_week", "is_weekend", "holiday", "festival",
        "popularity_score", "accessibility_score", "searches", "bookings", "views",
        "search_booking_ratio", "booking_intensity", "search_intensity",
        "event_boost", "month_sin", "month_cos", "weekend_pop"
    ]
    target_continuous = "demand_score"
    target_class = "crowd_level"

    X = df[features]
    y_reg = df[target_continuous]
    y_cls = df[target_class]

    # Stratified split ensuring representative distribution across crowd tiers
    X_train, X_test, y_train_reg, y_test_reg, y_train_cls, y_test_cls = train_test_split(
        X, y_reg, y_cls, test_size=0.20, stratify=y_cls, random_state=RANDOM_SEED
    )

    print(f"[*] Training on {len(X_train)} time-series records, testing on {len(X_test)}...")

    # 1. Regressor for exact continuous demand score
    reg = HistGradientBoostingRegressor(max_iter=300, learning_rate=0.06, min_samples_leaf=15, l2_regularization=0.1, random_state=RANDOM_SEED)
    reg.fit(X_train, y_train_reg)
    test_preds_reg = reg.predict(X_test)
    reg_eval = compute_regression_report_dict(y_test_reg.values, test_preds_reg)

    # 2. Classifier for crowd level tiers
    clf = HistGradientBoostingClassifier(max_iter=350, learning_rate=0.05, min_samples_leaf=20, l2_regularization=0.1, random_state=RANDOM_SEED)
    clf.fit(X_train, y_train_cls)
    test_preds_cls = clf.predict(X_test)
    test_probs_cls = clf.predict_proba(X_test)
    cls_eval = compute_classification_report_dict(y_test_cls, test_preds_cls, test_probs_cls)

    print("\n---------------- MODEL 6 EVALUATION RESULTS ----------------")
    print(f"  Demand Score MAE:   {reg_eval['mae']:.4f}")
    print(f"  Demand Score RMSE:  {reg_eval['rmse']:.4f}")
    print(f"  Demand Score R²:    {reg_eval['r2']:.4f}")
    print(f"  Crowd Level Acc:    {cls_eval['accuracy'] * 100:.2f}%")
    print(f"  Crowd Level F1:     {cls_eval['f1']:.4f}")
    print("-------------------------------------------------------------")

    out_dir = MODELS_DIR / "demand_model"
    out_dir.mkdir(parents=True, exist_ok=True)
    reg_path = out_dir / "regressor.pkl"
    clf_path = out_dir / "classifier.pkl"
    meta_path = out_dir / "metadata.json"

    joblib.dump(reg, reg_path)
    joblib.dump(clf, clf_path)

    metadata = {
        "model_name": "MODEL 6: Travel Demand / Crowdedness Prediction Model",
        "regressor_algorithm": "HistGradientBoostingRegressor",
        "classifier_algorithm": "HistGradientBoostingClassifier",
        "features": features,
        "classes": list(clf.classes_),
        "metrics": {
            "regression": reg_eval,
            "classification": cls_eval
        },
        "n_samples": len(df)
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"[OK] Saved regressor to {reg_path}")
    print(f"[OK] Saved classifier to {clf_path}")
    print(f"[OK] Saved metadata to {meta_path}")

if __name__ == "__main__":
    train_demand_model()
