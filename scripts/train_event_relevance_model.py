import os
import re
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import KFold
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib

ROOT = Path(__file__).resolve().parent.parent
TRAINING_CSV = ROOT / "data" / "TRAVELSATHI_EVENTS" / "event_recommendation_training.csv"
MODEL_DIR = ROOT / "backend" / "app" / "ml"
MODEL_PATH = MODEL_DIR / "event_relevance_model.joblib"

def train_in_loop():
    print(f"Loading training data from: {TRAINING_CSV}")
    df = pd.read_csv(TRAINING_CSV)
    print(f"Total dataset records: {len(df)}")

    # Feature engineering
    feature_cols = [
        "distance_km",
        "importance_tier",
        "event_category",
        "user_interest",
        "date_confidence",
        "event_status",
        "date_overlap_days",
        "days_until_event",
        "days_since_event"
    ]
    target_col = "relevance_label"

    X = df[feature_cols].copy()
    y = df[target_col].values

    # Preprocessing
    categorical_cols = ["importance_tier", "event_category", "user_interest", "date_confidence", "event_status"]
    numeric_cols = ["distance_km", "date_overlap_days", "days_until_event", "days_since_event"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_cols),
            ("num", "passthrough", numeric_cols)
        ]
    )

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", GradientBoostingRegressor(n_estimators=120, learning_rate=0.08, max_depth=4, random_state=42))
    ])

    # Multi-epoch / Multi-fold Training Loop
    print("\n--- Starting Model Training Loop (5-Fold Cross Validation Iterations) ---")
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    fold_scores = []

    for fold, (train_idx, val_idx) in enumerate(kf.split(X, y), 1):
        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]

        pipeline.fit(X_train, y_train)
        preds = pipeline.predict(X_val)

        mse = mean_squared_error(y_val, preds)
        mae = mean_absolute_error(y_val, preds)
        r2 = r2_score(y_val, preds)
        fold_scores.append((mse, mae, r2))
        print(f"  Iteration {fold}/5: RMSE = {np.sqrt(mse):.4f}, MAE = {mae:.4f}, R² = {r2:.4f}")

    avg_rmse = np.mean([np.sqrt(s[0]) for s in fold_scores])
    avg_mae = np.mean([s[1] for s in fold_scores])
    avg_r2 = np.mean([s[2] for s in fold_scores])
    print(f"\nTraining Loop Complete. Mean Performance: RMSE = {avg_rmse:.4f}, MAE = {avg_mae:.4f}, R² = {avg_r2:.4f}")

    # Final fit on full dataset
    print("Fitting production model on full training set...")
    pipeline.fit(X, y)

    # Save model artifact
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"Successfully saved trained model to: {MODEL_PATH}")

if __name__ == "__main__":
    train_in_loop()
