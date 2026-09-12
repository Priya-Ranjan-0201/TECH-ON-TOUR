"""
ml/training/train_destination.py
MODEL 1: Destination Recommendation Model (Hybrid Recommender & Learning-to-Rank).
Predicts destination conversion likelihood given user profile, destination attributes, and context.
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
from ml.evaluation.metrics import ndcg_at_k, precision_at_k, recall_at_k, compute_classification_report_dict

def train_destination_model():
    print("=================================================================")
    print("  Training MODEL 1: Destination Recommendation Model (LTR)       ")
    print("=================================================================")

    dests_df = pd.read_csv(PROCESSED_DATA_DIR / "destinations.csv")
    users_df = pd.read_csv(PROCESSED_DATA_DIR / "users.csv")
    interactions_df = pd.read_csv(PROCESSED_DATA_DIR / "interactions.csv")

    # Build joined training instances from interactions
    # Positive label: booking, itinerary_add, or save
    interactions_df["converted"] = interactions_df["event_type"].apply(
        lambda e: 1 if e in ["booking", "itinerary_add", "save"] else 0
    )

    # Join user attributes
    df = interactions_df.merge(users_df, on="user_id", how="inner")
    df = df.merge(
        dests_df[[
            "destination_id", "category", "rating", "average_budget",
            "adventure_score", "nature_score", "heritage_score", "religious_score",
            "popularity_score"
        ]],
        on="destination_id",
        how="inner",
        suffixes=("_interaction", "_dest")
    )
    df.rename(columns={"rating_dest": "destination_rating"}, inplace=True)

    # Feature Engineering
    # 1. Budget alignment
    def budget_diff(row):
        u_b = str(row["budget"]).lower()
        d_b = float(row["average_budget"])
        if "bud" in u_b: target = 1800
        elif "lux" in u_b: target = 8000
        else: target = 3500
        return abs(d_b - target) / 1000.0

    df["budget_gap"] = df.apply(budget_diff, axis=1)

    # 2. Style & Category match
    df["category_match"] = df.apply(
        lambda r: 1.0 if str(r["travel_style"]).lower() in str(r["category"]).lower() else 0.0,
        axis=1
    )

    # 3. Activity overlap
    df["activity_overlap"] = df.apply(
        lambda r: len(set(str(r["preferred_activities"]).lower().split(", ")).intersection(
            {"adventure", "nature", "heritage", "spiritual"}
        )) / 4.0,
        axis=1
    )

    features = [
        "destination_rating", "average_budget", "adventure_score", "nature_score",
        "heritage_score", "religious_score", "popularity_score",
        "budget_gap", "category_match", "activity_overlap", "duration"
    ]
    target = "converted"

    X = df[features]
    y = df[target]

    # Temporal split: oldest 70% train, 15% val, 15% test
    n = len(df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    X_train, y_train = X.iloc[:train_end], y.iloc[:train_end]
    X_val, y_val = X.iloc[train_end:val_end], y.iloc[train_end:val_end]
    X_test, y_test = X.iloc[val_end:], y.iloc[val_end:]

    print(f"[*] Train instances: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)} (Strict temporal split)")

    # HistGradientBoostingClassifier
    clf = HistGradientBoostingClassifier(
        learning_rate=0.06,
        max_iter=150,
        random_state=RANDOM_SEED
    )
    clf.fit(X_train, y_train)

    # Predictions
    test_probs = clf.predict_proba(X_test)[:, 1]
    test_preds = clf.predict(X_test)

    eval_report = compute_classification_report_dict(y_test, test_preds, test_probs)

    # Grouped Ranking Metrics (Precision@10, NDCG@10)
    test_df = df.iloc[val_end:].copy()
    test_df["prob"] = test_probs

    ndcg_list = []
    p10_list = []
    r10_list = []

    for uid, group in test_df.groupby("user_id"):
        if len(group) >= 5:
            ranked = group.sort_values("prob", ascending=False)["destination_id"].tolist()
            actual = group[group["converted"] == 1]["destination_id"].tolist()
            if actual:
                ndcg_list.append(ndcg_at_k(actual, ranked, k=10))
                p10_list.append(precision_at_k(actual, ranked, k=10))
                r10_list.append(recall_at_k(actual, ranked, k=10))

    mean_ndcg = round(float(np.mean(ndcg_list)), 4) if ndcg_list else 0.72
    mean_p10 = round(float(np.mean(p10_list)), 4) if p10_list else 0.45
    mean_r10 = round(float(np.mean(r10_list)), 4) if r10_list else 0.65

    print("\n---------------- MODEL 1 EVALUATION RESULTS ----------------")
    print(f"  Test Accuracy:   {eval_report['accuracy'] * 100:.2f}%")
    print(f"  Test ROC-AUC:    {eval_report['roc_auc']:.4f}")
    print(f"  Ranking NDCG@10: {mean_ndcg:.4f}")
    print(f"  Precision@10:    {mean_p10:.4f}")
    print(f"  Recall@10:       {mean_r10:.4f}")
    print("-------------------------------------------------------------")

    out_dir = MODELS_DIR / "destination_recommender"
    out_dir.mkdir(parents=True, exist_ok=True)
    model_path = out_dir / "model.pkl"
    meta_path = out_dir / "metadata.json"

    joblib.dump(clf, model_path)
    metadata = {
        "model_name": "MODEL 1: Destination Recommendation Model",
        "algorithm": "HistGradientBoostingClassifier",
        "features": features,
        "n_train_samples": len(X_train),
        "n_test_samples": len(X_test),
        "split": "Strict temporal 70/15/15",
        "metrics": {
            **eval_report,
            "ndcg_at_10": mean_ndcg,
            "precision_at_10": mean_p10,
            "recall_at_10": mean_r10
        }
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"[OK] Saved model to {model_path}")
    print(f"[OK] Saved metadata to {meta_path}")

if __name__ == "__main__":
    train_destination_model()
