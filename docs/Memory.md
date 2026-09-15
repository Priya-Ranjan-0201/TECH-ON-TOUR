# TravelSathi — System Memory, Model Provenance & Engineering Retrospective

> **Document Version:** 1.0.0 (SIH Final Verification Release)  
> **Repository:** TravelSathi (Smart India Hackathon)  
> **Compliance:** Honest ML reporting standard (Zero fabricated 99% metrics). Exactly 3 ML models trained and validated.

---

## 1. Final Model Inventory & Performance Metrics

TravelSathi intentionally maintains **exactly 3 machine learning models**. Generative AI capabilities (multi-day itinerary synthesis, travel assistant chat) are powered by API calls to Google Gemini with RAG grounding, and are explicitly not counted as trained internal models.

| Model | Architecture | File Path | Objective & Target | Primary Validation Metrics (Empirical) | Training Provenance |
|---|---|---|---|---|---|
| **Model 1: Dynamic Pricing Predictor** | `GradientBoostingRegressor` (scikit-learn) | `backend/app/services/pricing_model.pkl` | Predicts fair, market-adjusted nightly homestay tariff (INR) | **MAE:** ₹204.53<br>**$R^2$:** 0.9948<br>**RMSE:** ₹262.18 | 1,600 samples based on festival lead time, weekend multipliers, season demand index, and 30-day occupancy rates. |
| **Model 2: Recommendation Ranker** | `GradientBoostingClassifier` (scikit-learn) | `backend/app/services/recommendation_model.pkl` | Probability of user click/booking given destination & user profile features | **AUC-ROC:** 0.7164<br>**Precision@6:** 0.6232 (62.32%)<br>**Test Accuracy:** 68.86%<br>**Confusion Matrix:** `[[3671, 599], [1581, 1149]]` | 35,000 synthetic bootstrap interactions across 12,293 national POIs. Stratified 80/20 train/test split. |
| **Model 3: Review Authenticity Classifier** | `LogisticRegression` with engineered linguistic & metadata features | `backend/app/services/authenticity_model.pkl` | Distinguishes authentic visitor reviews from bot-generated or generic reviews | **CV Accuracy:** 93.33%<br>**CV Precision:** 96.32%<br>**CV Recall:** 92.55%<br>**CV F1 Score:** 0.9432<br>**Confusion Matrix:** `[[TN=68, FP=4], [FN=8, TP=100]]` | 180 benchmark reviews (108 genuine, 72 suspicious/templated) evaluated using 5-Fold Stratified Cross-Validation. |

---

## 2. Critical Bugs Resolved

### 2.1 Recommendation Duplication & Monotony (Part 2)
- **Root Cause:** All recommendation rows (Seasonal, Nearby, History, Trending) previously shared the same unranked candidate pool with minor feature weight adjustments, causing the top-6 destinations to heavily overlap.
- **Fix Implemented:**
  1. **Aggressive Row Pre-Filtering:**
     - `seasonal`: Pre-filters candidates strictly where `season_match == 1` for the active or simulated month (e.g. Month 1=Winter, Month 5=Summer, Month 7=Monsoon) before scoring.
     - `nearby`: Computes Haversine distance from traveler's live coordinates and strictly filters to POIs within radius (≤150 km, expanding to ≤300 km if necessary) before ranking.
     - `history`: Filters to categories previously browsed or booked by the user. If user has zero interaction history, gracefully falls back to trending rather than showing arbitrary duplicates.
     - `trending`: Uses 30-day global review volume (`global_popularity_30d`) as the primary sorting criterion.
  2. **Cross-Row Sequential Deduplication:** `get_rails()` passes an accumulating `allocated_ids` set to subsequent rows so the same destination never appears twice on the same screen load.
  3. **Verification:** Verified via `backend/tests/test_part2_recommendation_differentiation.py` (4/4 tests passed).

### 2.2 Dead & Showcase-Only Buttons (Part 3)
- **Itinerary Generator (`PlanView.jsx`):**
  - Added live `handleRegenerate` wired to `POST /api/itinerary/generate`.
  - Implemented dynamic modification pills ("Make it cheaper", "Add local experiences", "Remove crowds", "Relax schedule") to dispatch customized parameter requests to the API and update the database record.
- **Host Command Center (`HostDashboardView.jsx`):**
  - **Dynamic Price Approval:** `handleApplyAiPrice` calls `POST /api/homestays/host/apply-price`, updating the homestay tariff in SQLite.
  - **Listing Editing:** Added Edit Listing modal calling `PUT /api/homestays/host/listing/{id}` to persist title and pricing changes.
  - **Bookings Actions:** Added "Approve" (`POST /api/homestays/host/bookings/{id}/approve`) and "Reply to Guest" (`POST /api/homestays/host/bookings/{id}/respond`) controls with live confirmation toasts.
- **Split-UPI Direct Bookings (`checkout.py`):**
  - Verified date collision validation (rejects double-booking overlapping dates with HTTP 400).
  - Enforced Razorpay/UPI payment transaction ID verification before booking confirmation.

### 2.4 Search & Itinerary Accuracy & Place Matching (Part 1-4)
- **Root Cause:**
  1. `list_destinations` only filtered `search` against `name` and `description`, ignoring `city` and `state`, and did not support `query` or `city` query parameters, while DB query ordering was non-deterministic.
  2. `_fetch_candidate_pois` looked up one sample destination in SQLite to find its state, then queried 150 candidate POIs across the entire state without city-level affinity, discarding the specific destination city (e.g. Hampi, Manali) and allowing statewide leakage. Moreover, `PlanWizard` defaulted `state='Rajasthan'`, which superseded the user's city query.
  3. `PlanView.jsx` silently fell back to a hardcoded "Tirthan Himalayan River Trail" itinerary whenever an API error or timeout occurred, masking missing data or failures.
- **Fix Implemented:**
  1. Updated `list_destinations` in `backend/app/api/destinations.py` to match `query`, `search`, `city`, and `state` across `name`, `city`, `state`, and `description`. Added explicit deterministic ordering (`case(...)`, `rating.desc()`, `review_count.desc()`, `id.asc()`). If no verified listings exist, returns `{"results": [], "message": "No verified listings found for '{query}' yet."}` without substituting unrelated places.
  2. Updated `_fetch_candidate_pois` in `backend/app/services/itinerary_service.py` to strictly query and prioritize POIs with destination/city name matches first. If no verified places exist for the destination anywhere in the database, it raises an honest `HTTPException(404, detail="We don't have enough verified data for '{destination}' yet. Try a nearby major city or check back soon.")`.
  3. Strict grounding in `_call_gemini_structured` ensuring only candidate POIs from that specific destination are provided and validated against hallucinations.
  4. Removed silent fake fallback in `PlanView.jsx`; honest backend errors are now rendered with clear user notices and a prompt to pick another destination.
- **Verification:**
  - Automated tests in `backend/tests/test_search_accuracy.py` and `backend/tests/test_itinerary_accuracy.py` passed 100% (7/7 tests passed). Live queries for "Manali", "Jaipur", "Hampi", and unknown destinations confirmed accurate, repeatable, and honest responses.

### 2.5 Multilingual Localization Across 7 Indic Languages
- **Scope**: Cultural Events Dossier modal (`EventsView.tsx`), Safety & Emergency Center (`SafetyView.tsx`), Local Experiences (`ExperiencesView.tsx`), and Community Stays (`StaysView.tsx`).
- **Implementation**:
  - Expanded `summaryTranslator.ts` across Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, and English for all major Indian festivals (Durga Puja, Hornbill, Pushkar, Bihu, etc.), venues, and cultural significance.
  - Implemented dynamic parametric translation for distances (`X km away`), event durations (`X Hours`), confidence scores, and source stamps.
  - Synchronized all 7 JSON translation files in `frontend/src/locales/`.

### 2.6 High-Density Emergency & Tourist Essentials Mesh (548+ Facilities)
- **Scope**: Smart Interactive GIS Map (`SmartMapView.tsx`) and Destinations API (`destinations.py`).
- **Implementation**:
  - Seeded 167+ verified emergency hospitals, level-1 trauma centers, certified homestays, verified hotels, and authentic regional dining spots across 36 States & UTs (boosting total from 368 to 548+).
  - Enriched `/api/destinations/map-points` to always provide `description`, `price_range`, and `review_count`.
  - Upgraded Leaflet Map popups with category badges, star ratings, price tiers, rich descriptions, and 1-click direct `tel:` helpline call buttons (`tel:108` / `tel:...`).
  - Added dedicated category filter pills (`All`, `🏥 Hospitals`, `🏨 Hotels`, `🏡 Homestays`, `🍽️ Dining`) with live counts.

## 3. Known Limitations (Honest Disclosure for Judges)

If asked by competition evaluators or technical judges about trade-offs and limitations:

1. **Cold-Start User History:**
   - For brand new users with zero interaction history, the "Based on your history" row intentionally falls back to national trending destinations to avoid presenting random unpersonalized candidates.
2. **Review Authenticity Classifier Scope:**
   - The authenticity model uses a scikit-learn pipeline on hand-engineered linguistic features (sentiment extremity, character length, punctuation burstiness, generic praise markers) trained on 180 benchmark reviews. While achieving 93.3% cross-validation accuracy, a production deployment at scale would benefit from a fine-tuned sequence classifier (e.g. RoBERTa) trained on hundreds of thousands of domain-specific reviews.
3. **Generative LLM Dependency:**
   - Multi-day narrative generation and conversational concierge chat use the Google Gemini API with RAG retrieval. If external internet connectivity is unavailable, the system transparently falls back to a deterministic rule-based generator that constructs valid, multi-day itineraries from regional database POIs.
4. **Synthetic Training Distribution:**
   - Training datasets for the Dynamic Pricing and Recommendation models were synthesized using realistic bootstrap distributions grounded in regional tourism statistics and Swadesh Darshan 2.0 carrying capacity guidelines. As real platform traffic accumulates, the auto-update pipeline will retrain these models on organic behavioral telemetry.
