"""
ml/training/train_weather.py
MODEL 2: Season & Weather Suitability Model.
Predicts destination meteorological suitability score (0.0 to 1.0) and
classification tiers: ['Excellent', 'Good', 'Moderate', 'Poor', 'Not Recommended'].
"""

import os
import sys
import json
import joblib
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import HistGradientBoostingClassifier

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from ml.config.settings import PROCESSED_DATA_DIR, MODELS_DIR, RANDOM_SEED
from ml.evaluation.metrics import compute_classification_report_dict

def train_weather_model():
    print("=================================================================")
    print("  Training MODEL 2: Season & Weather Suitability Model           ")
    print("=================================================================")

    weather_df = pd.read_csv(PROCESSED_DATA_DIR / "weather.csv")
    dests_df = pd.read_csv(PROCESSED_DATA_DIR / "destinations.csv")

    df = weather_df.merge(
        dests_df[["destination_id", "category", "best_season"]],
        on="destination_id",
        how="inner"
    )

    # Parse month from date
    df["month"] = pd.to_datetime(df["date"]).dt.month

    # Engineered domain meteorological features
    df["temp_deviation"] = (df["temperature"] - 24.0).abs()
    df["humidity_deviation"] = (df["humidity"] - 50.0).abs()
    df["rain_intensity"] = df["rainfall"].clip(lower=0, upper=300)
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12.0)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12.0)

    # Seasonal suitability target definition
    def derive_suitability(row):
        temp = float(row["temperature"])
        rain = float(row["rainfall"])
        hum = float(row["humidity"])
        alert = int(row["weather_alert"])
        cat = str(row["category"]).lower()
        is_indoor = any(w in cat for w in ["hotel", "restaurant", "museum"])

        # Base comfort score
        temp_score = max(0.0, 1.0 - abs(temp - 24.0) / 20.0)
        rain_penalty = (rain / 250.0) if not is_indoor else (rain / 500.0)
        score = 0.50 * temp_score + 0.30 * (1.0 - min(rain_penalty, 1.0)) + 0.20 * (1.0 - abs(hum - 50.0) / 50.0)
        if alert:
            score -= 0.40

        score = float(np.clip(score, 0.05, 0.99))

        # Categorize
        if score >= 0.80:
            label = "Excellent"
        elif score >= 0.65:
            label = "Good"
        elif score >= 0.50:
            label = "Moderate"
        elif score >= 0.35:
            label = "Poor"
        else:
            label = "Not Recommended"

        return pd.Series([round(score, 3), label])

    df[["suitability_score", "classification"]] = df.apply(derive_suitability, axis=1)

    features = [
        "temperature", "humidity", "rainfall", "wind_speed", "weather_alert", "month",
        "temp_deviation", "humidity_deviation", "rain_intensity", "month_sin", "month_cos"
    ]
    target = "classification"

    X = df[features]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_SEED, stratify=y
    )

    print(f"[*] Training on {len(X_train)} seasonal observations, testing on {len(X_test)}...")

    clf = HistGradientBoostingClassifier(
        max_iter=300,
        learning_rate=0.06,
        min_samples_leaf=15,
        l2_regularization=0.1,
        random_state=RANDOM_SEED
    )
    clf.fit(X_train, y_train)

    test_preds = clf.predict(X_test)
    test_probs = clf.predict_proba(X_test)

    eval_report = compute_classification_report_dict(y_test, test_preds, test_probs)

    print("\n---------------- MODEL 2 EVALUATION RESULTS ----------------")
    print(f"  Accuracy:  {eval_report['accuracy'] * 100:.2f}%")
    print(f"  Precision: {eval_report['precision'] * 100:.2f}%")
    print(f"  Recall:    {eval_report['recall'] * 100:.2f}%")
    print(f"  F1 Score:  {eval_report['f1']:.4f}")
    print(f"  ROC-AUC:   {eval_report['roc_auc']:.4f}")
    print("-------------------------------------------------------------")

    out_dir = MODELS_DIR / "season_weather"
    out_dir.mkdir(parents=True, exist_ok=True)
    model_path = out_dir / "model.pkl"
    meta_path = out_dir / "metadata.json"

    joblib.dump(clf, model_path)
    metadata = {
        "model_name": "MODEL 2: Season & Weather Suitability Model",
        "algorithm": "HistGradientBoostingClassifier",
        "features": features,
        "classes": list(clf.classes_),
        "metrics": eval_report,
        "n_samples": len(df)
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"[OK] Saved model to {model_path}")
    print(f"[OK] Saved metadata to {meta_path}")

if __name__ == "__main__":
    train_weather_model()
