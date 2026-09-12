"""
ml/training/train_similarity.py
MODEL 7: Destination Similarity Model.
Creates normalized hybrid destination embeddings (semantic text + quantitative attributes)
and trains NearestNeighbors for top-K similar destination retrieval.
"""

import os
import sys
import json
import joblib
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import normalize

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from ml.config.settings import PROCESSED_DATA_DIR, MODELS_DIR, EMBEDDINGS_DIR, RANDOM_SEED
from ml.features.destination_features import extract_destination_feature_vector

def train_similarity_model():
    print("=================================================================")
    print("  Training MODEL 7: Destination Similarity Model                 ")
    print("=================================================================")

    dests_df = pd.read_csv(PROCESSED_DATA_DIR / "destinations.csv")
    print(f"[*] Building hybrid embeddings for {len(dests_df)} verified destinations...")

    # 1. Text Semantics (TF-IDF + SVD reduction to 32 dimensions)
    corpus = [
        f"{r['name']} {r['category']} {r['state']} {r['district']} {r['activities']} {r['description']}"
        for _, r in dests_df.iterrows()
    ]
    tfidf = TfidfVectorizer(max_features=2500, stop_words="english")
    tfidf_matrix = tfidf.fit_transform(corpus)

    svd = TruncatedSVD(n_components=32, random_state=RANDOM_SEED)
    text_embeddings = svd.fit_transform(tfidf_matrix)

    # 2. Tabular Numerical Features (12 dimensions)
    tabular_vectors = []
    for _, r in dests_df.iterrows():
        tabular_vectors.append(extract_destination_feature_vector(r.to_dict()))
    tabular_matrix = np.array(tabular_vectors, dtype=np.float32)

    # 3. Concatenate and Normalize to Unit Hypersphere
    combined_embeddings = np.hstack([text_embeddings, tabular_matrix])
    normalized_embeddings = normalize(combined_embeddings, norm="l2")

    # 4. NearestNeighbors index (Cosine metric)
    nn_model = NearestNeighbors(n_neighbors=15, metric="cosine", algorithm="auto")
    nn_model.fit(normalized_embeddings)

    # Validation: Test query similarity for sample destinations
    sample_indices = [0, 10, 50, 100]
    alignment_scores = []
    print("\n[*] Sample Top-3 Similar Destinations Validation:")
    for idx in sample_indices:
        src_name = dests_df.iloc[idx]["name"]
        src_cat = dests_df.iloc[idx]["category"]
        distances, indices = nn_model.kneighbors([normalized_embeddings[idx]], n_neighbors=4)

        print(f"    Source: {src_name} ({src_cat})")
        for rank, (d, neighbor_idx) in enumerate(zip(distances[0][1:4], indices[0][1:4])):
            sim_name = dests_df.iloc[neighbor_idx]["name"]
            sim_cat = dests_df.iloc[neighbor_idx]["category"]
            sim_score = 1.0 - d
            alignment_scores.append(sim_score)
            print(f"      {rank+1}. {sim_name} ({sim_cat}) - Cosine Sim: {sim_score:.4f}")

    mean_sim = round(float(np.mean(alignment_scores)), 4)
    print(f"\n[*] Average Nearest-Neighbor Similarity: {mean_sim:.4f}")

    out_dir = MODELS_DIR / "similarity_model"
    out_dir.mkdir(parents=True, exist_ok=True)
    EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)

    model_path = out_dir / "model.pkl"
    emb_path = EMBEDDINGS_DIR / "destination_embeddings.npy"
    meta_path = out_dir / "metadata.json"

    # Save model, vectorizer, and SVD
    artifact_bundle = {
        "nn_model": nn_model,
        "tfidf": tfidf,
        "svd": svd,
        "destination_ids": dests_df["destination_id"].tolist(),
        "names": dests_df["name"].tolist()
    }
    joblib.dump(artifact_bundle, model_path)
    np.save(emb_path, normalized_embeddings)

    metadata = {
        "model_name": "MODEL 7: Destination Similarity Model",
        "algorithm": "Hybrid TF-IDF + TruncatedSVD + Cosine NearestNeighbors",
        "embedding_dimensions": int(normalized_embeddings.shape[1]),
        "n_destinations": len(dests_df),
        "metrics": {
            "mean_top3_cosine_similarity": mean_sim,
            "explained_text_variance": round(float(svd.explained_variance_ratio_.sum()), 4)
        }
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"[OK] Saved model bundle to {model_path}")
    print(f"[OK] Saved destination embeddings to {emb_path}")
    print(f"[OK] Saved metadata to {meta_path}")

if __name__ == "__main__":
    train_similarity_model()
