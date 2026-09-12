"""
ml/evaluation/metrics.py
Evaluation metrics for ranking, classification, regression, and similarity models.
"""

from typing import List, Dict, Any, Sequence
import math
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    mean_absolute_error, mean_squared_error, r2_score
)

def precision_at_k(actual: Sequence[Any], predicted: Sequence[Any], k: int = 10) -> float:
    """Calculates Precision@K for a single user."""
    if not predicted or k <= 0:
        return 0.0
    top_k = set(predicted[:k])
    actual_set = set(actual)
    if not actual_set:
        return 0.0
    hits = len(top_k.intersection(actual_set))
    return float(hits / k)

def recall_at_k(actual: Sequence[Any], predicted: Sequence[Any], k: int = 10) -> float:
    """Calculates Recall@K for a single user."""
    if not predicted or not actual or k <= 0:
        return 0.0
    top_k = set(predicted[:k])
    actual_set = set(actual)
    hits = len(top_k.intersection(actual_set))
    return float(hits / len(actual_set))

def ndcg_at_k(actual: Sequence[Any], predicted: Sequence[Any], k: int = 10) -> float:
    """Calculates Normalized Discounted Cumulative Gain at K (NDCG@K)."""
    if not predicted or not actual or k <= 0:
        return 0.0
    actual_set = set(actual)
    dcg = 0.0
    for i, p in enumerate(predicted[:k]):
        if p in actual_set:
            dcg += 1.0 / math.log2(i + 2)
    idcg = sum(1.0 / math.log2(i + 2) for i in range(min(len(actual_set), k)))
    return float(dcg / idcg) if idcg > 0 else 0.0

def mean_reciprocal_rank(actual: Sequence[Any], predicted: Sequence[Any]) -> float:
    """Calculates Reciprocal Rank of the first relevant item."""
    actual_set = set(actual)
    for i, p in enumerate(predicted):
        if p in actual_set:
            return 1.0 / (i + 1)
    return 0.0

def compute_classification_report_dict(y_true, y_pred, y_prob=None) -> Dict[str, float]:
    """Evaluates Accuracy, Precision, Recall, F1, and ROC-AUC."""
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, average="weighted", zero_division=0))
    rec = float(recall_score(y_true, y_pred, average="weighted", zero_division=0))
    f1 = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))
    auc = float(roc_auc_score(y_true, y_prob, multi_class="ovr", average="weighted")) if y_prob is not None else 0.0
    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "roc_auc": round(auc, 4)
    }

def compute_regression_report_dict(y_true, y_pred) -> Dict[str, float]:
    """Evaluates MAE, RMSE, MAPE, and R2."""
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    # MAPE
    mask = y_true != 0
    mape = float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100.0) if np.any(mask) else 0.0
    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2": round(r2, 4),
        "mape_pct": round(mape, 2)
    }
