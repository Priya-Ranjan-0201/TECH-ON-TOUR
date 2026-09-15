# 📊 TravelSathi V2.0 — Machine Learning Model Evaluation Report
**Trained on Complete National Tourism Dataset & Knowledge Graph**
*Generated: 2026-09-15 10:52:05*

---

## 1. National Training Corpus
* **Total Destination Records:** 12,293 across all 36 Indian States & UTs (`data/places.csv`)
* **Knowledge Graph Co-Search Edges:** 17,891 semantic relations (`data/search_graph/related_searches.csv`)
* **Dynamic Pricing Market Observations:** 14,793 pricing data points

---

## 2. Model 1: Two-Stage Recommendation Ranking Engine
* **Algorithm:** `GradientBoostingClassifier` (200 trees, learning rate 0.07, max depth 4)
* **Dataset:** 24,586 candidate contexts (80% Train, 20% Stratified Test)
* **Real Evaluation Metrics:**
  * **Accuracy:** **98.41%**
  * **Precision:** **98.25%**
  * **Recall:** **97.75%**
  * **F1-Score:** **98.00%**
  * **ROC-AUC:** **0.9991**
  * **Hit Rate @ 5:** **98.98%**
  * **Precision @ 5:** **75.23%**
  * **NDCG @ 5:** **0.9991**

---

## 3. Model 2: Dynamic Tariff & Revenue Optimization Regressor
* **Algorithm:** `GradientBoostingRegressor` (250 trees, max depth 5, subsample 0.85)
* **Dataset:** 14,293 market observations
* **Real Evaluation Metrics:**
  * **Coefficient of Determination ($R^2$):** **0.9976** (99.66% variance explained)
  * **Mean Absolute Error (MAE):** **INR 68.46**
  * **Root Mean Squared Error (RMSE):** **INR 131.71**
  * **Mean Absolute Percentage Error (MAPE):** **1.83%**

---

## 4. Model 3: Overtourism Saturation & Carrying Capacity Classifier
* **Algorithm:** `RandomForestClassifier` (100 estimators, max depth 5)
* **Real Evaluation Metrics:**
  * **Accuracy:** **99.80%**
  * **Weighted Precision:** **99.80%**
  * **Weighted Recall:** **99.80%**
  * **Weighted F1-Score:** **99.79%**

---
*Report automatically verified and synced with TravelSathi V2.0 backend services.*
