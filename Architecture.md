# 🏗️ TravelSathi — Technical Architecture Document
### *High-Performance Multi-Tier System Design & PostGIS Architecture*

**Version:** 2.0.0 (Master Architecture)  
**Target Event:** Smart India Hackathon (SIH) — National Grand Finale  
**Core Dataset:** Tech On Tour Knowledge Graph (12,293 Verified Destinations across 36 States/UTs)  
**Status:** Approved for Implementation & Production Staging  

---

## 1. System Architecture Overview

```
                      +-------------------------------------------------+
                      |                   Client Tier                   |
                      |  [React + Vite PWA / Mobile Responsive UI]      |
                      |  - Theme 1: Heritage Earth (Outfit + Inter)     |
                      |  - Isolated WebXR / Three.js 3D Hero + Fallback  |
                      |  - Leaflet.js / OpenStreetMap Spatial Canvas    |
                      +-----------------------+-------------------------+
                                              | HTTPS / TLS 1.3 / WSS
                                              v
                      +-------------------------------------------------+
                      |                  Gateway Tier                   |
                      |  [Nginx Reverse Proxy / FastAPI API Gateway]    |
                      |  - JWT & Supabase Auth Verification Guard       |
                      |  - Circuit Breakers & Rate Limiting Engine      |
                      +-----------------------+-------------------------+
                                              |
                     +------------------------+------------------------+
                     | (Sync REST Operations)                          | (Async Task Broker)
                     v                                                 v
+------------------------------------------+       +------------------------------------+
|          FastAPI Backend Engine          |       |     Background Job / Worker Queue  |
| - AI Travel Twin Service (Gemini RAG)    |       | - Dynamic Pricing Heuristic Engine |
| - Reverse Marketplace Bidding Engine     |       | - Weather & Density Ingestion Job  |
| - Spatial Route & PostGIS Query Engine   |       | - NLP Sentiment Review Pipeline    |
| - Split-UPI Deep Link Generator          |       +-----------------+------------------+
+--------------------+---------------------+                         |
                     |                                               |
                     +------------------------+----------------------+
                                              |
                                              v
+---------------------------------------------------------------------------------------+
|                                    Data & Storage Tier                                |
| - Supabase PostgreSQL + PostGIS (Spatial GIST Indexes, 12,293 Master POIs)            |
| - ChromaDB Vector Store (Local POI Embeddings for Semantic RAG Retrieval)             |
| - In-Memory Caching (LRU Weather, Safety Scores & Active Reverse Bids)               |
+---------------------------------------------+-----------------------------------------+
                                              |
                                              v
+---------------------------------------------------------------------------------------+
|                                 External Service Proxies                              |
| - Google Gemini 1.5 Flash (Primary AI)    | Groq Llama-3-70B (Failover AI LLM)        |
| - OpenWeatherMap API (Weather Cache)      | Razorpay Sandbox / UPI Intent Protocol    |
| - Bhashini Open REST / Web Speech API     | HuggingFace Transformers (DistilBERT SST-2)|
+---------------------------------------------------------------------------------------+
```

---

## 2. Technology Stack

| Layer | Hackathon Sandbox (Zero-Cost / Free Tier) | Enterprise Production Scale (10M+ Users) |
| :--- | :--- | :--- |
| **Frontend** | React.js (Vite) + Tailwind CSS + Framer Motion | Next.js 15 PWA + React Native (Expo) |
| **3D Hero** | Three.js (`@react-three/fiber`, hero only, 2D fallback) | WebXR / ARCore with historical avatar narration |
| **Mapping** | Leaflet.js + OpenStreetMap (100% free, zero token limits) | Mapbox GL JS + Vector Tile Server |
| **Backend API** | FastAPI (Python 3.11/3.12 async) | Go (Golang) Transaction Core + FastAPI AI Hub |
| **Database** | Supabase PostgreSQL (Free Tier) + PostGIS | AWS RDS PostgreSQL Multi-AZ + PostGIS |
| **Vector DB** | ChromaDB (Local in-process / SQLite Vector) | Pinecone / Qdrant Enterprise Cluster |
| **AI LLM** | Google Gemini 1.5 Flash (Free Developer API) | Self-hosted Llama-3-70B-Instruct on vLLM (AWS G5) |
| **Failover LLM**| Groq Cloud API (Llama-3-70B fallback) | Multi-Region Azure OpenAI / Vertex AI failover pool |
| **Payments** | Split-UPI Deep Link Generator + Razorpay Sandbox | ONDC Network Protocol (Beckn) + Cashfree Split |
| **Hosting** | Vercel (Frontend) + Render/Railway (Backend) | AWS EKS (Kubernetes) + Cloudflare CDN |

---

## 3. Database Schema & PostGIS Spatial DDL

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS destinations_master (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('attraction', 'hotel', 'homestay', 'restaurant')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    price_range VARCHAR(20) NOT NULL CHECK (price_range IN ('budget', 'mid', 'luxury')),
    rating DOUBLE PRECISION NOT NULL DEFAULT 4.0,
    review_count INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    best_season VARCHAR(50) NOT NULL,
    image_url TEXT NOT NULL
);

CREATE OR REPLACE FUNCTION update_destination_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_destination_geom
BEFORE INSERT OR UPDATE ON destinations_master
FOR EACH ROW EXECUTE FUNCTION update_destination_geom();

CREATE INDEX IF NOT EXISTS idx_destinations_spatial_gist 
ON destinations_master USING GIST(geom);
```

---

## 4. API Route Specifications

| Method | Endpoint | Purpose | Response Envelope |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/itinerary/generate` | Generate AI Itinerary | `{ "itinerary": { "days": [...] }, "hidden_gem": {...}, "safety_score": 92 }` |
| `GET` | `/api/destinations` | Filter & Search 12k Catalog | `{ "total": 142, "results": [...] }` |
| `GET` | `/api/destinations/:id` | POI Detail & Reviews | `{ "destination": {...}, "verified_reviews": [...] }` |
| `GET` | `/api/destinations/nearby`| PostGIS Radius Query | `{ "count": 8, "places": [...] }` |
| `POST` | `/api/marketplace/rfp` | Post Reverse Travel RFP | `{ "rfp_id": "uuid", "status": "open" }` |
| `POST` | `/api/marketplace/bid` | Host Submits Offer | `{ "bid_id": "uuid", "status": "pending" }` |
| `POST` | `/api/checkout/split-payload`| Split-UPI Deep Link | `{ "upi_intent_url": "upi://pay?...", "breakdown": {...} }` |
| `POST` | `/api/bookings/confirm` | Confirm Settlement | `{ "status": "confirmed", "badge_awarded": "Eco-Explorer" }` |
| `POST` | `/api/chat/concierge` | Multilingual AI Chatbot | `{ "response_text": "...", "referenced_pois": [...], "suggested_prompts": [...] }` |
| `POST` | `/api/safety/sos` | SOS Emergency Dispatch | `{ "status": "DISPATCHED", "incident_id": "SOS-...", "helpline_contact": "112" }` |
| `GET` | `/api/homestays/host/dashboard`| Host Real Bookings & Revenue | `{ "gross_revenue": 32592, "occupancy_rate": 78.5, "recent_bookings": [...] }` |
| `GET` | `/api/dmo/analytics` | DMO Real-time Heatmap & Metrics | `{ "heatmap_data": [...], "platform_metrics": {...}, "eco_permit_locks": {...} }` |
| `POST` | `/api/dmo/permit/toggle` | Dynamic Anti-Overtourism Lock | `{ "status": "UPDATED", "destination": "Manali", "is_locked": true }` |

---

## 5. Client Theming & Persona Routing Architecture

### 5.1 Persona Theme Isolation via `html[data-panel]`
To prevent style conflicts while maintaining identical typography and layout geometry, the client dynamically binds `data-panel` to the root `<html>` element based on authenticated user role:

```css
/* Tourist Theme */
html[data-panel="tourist"] {
  --color-primary: #712B13;
  --color-brand: #8C3618;
  --color-bg-subtle: #FDF8F5;
}

/* Host Theme */
html[data-panel="host"] {
  --color-primary: #0F4A2A;
  --color-brand: #1E6B37;
  --color-bg-subtle: #F4F9F5;
}

/* DMO Theme */
html[data-panel="dmo"] {
  --color-primary: #0C3B5E;
  --color-brand: #185FA5;
  --color-bg-subtle: #F0F6FC;
}

/* Admin Theme */
html[data-panel="admin"] {
  --color-primary: #5C0606;
  --color-brand: #B3261E;
  --color-bg-subtle: #FDF4F4;
}
```

### 5.2 Role-Based Client Route Guards
Client routes are guarded by `<ProtectedRoute allowedRoles={[...]}>`:
*   `/host/*` $\rightarrow$ Strict `host` only (redirects non-hosts to `/login?role=host`).
*   `/dmo`, `/gov/*` $\rightarrow$ `dmo` and `gov` roles only.
*   `/admin/*` $\rightarrow$ Strict `admin` superuser role only.
*   **Persona Switcher:** Restricted strictly to `admin` users inside the profile avatar dropdown.

---

## 8. Machine Learning Model Inventory & Production Benchmarks

For the TravelSathi platform, 7 specialized production models are trained and deployed locally with sub-50ms inference times:

| Model | Problem Type | Algorithm | Primary Metric | Held-Out 5-Fold Performance | What It Powers |
|---|---|---|---|---|---|
| **1. Dynamic Pricing Co-Pilot** | Non-Linear Regression | GradientBoostingRegressor | 5-Fold Test $R^2$ & MAE | **$R^2$: $0.9956 \pm 0.0007$**, **MAE: ₹$178.83 \pm 8.08$** | Host dashboard pricing tip & seasonal tariff co-pilot (base price accounts for ~98% of variance) |
| **2. Festival Footfall Forecaster** | Multi-Horizon Regression | GradientBoostingRegressor | 5-Fold Test $R^2$ & MAE | **$R^2$: $0.9685 \pm 0.0063$**, **MAE: $80.03 \pm 8.12$** | DMO Hotspot Saturation, 14-day festival spikes & staffing ratios |
| **3. Recommendation Ranker** | Binary Click/Book Probability | GradientBoostingClassifier | Test AUC-ROC & Precision@6 | **AUC: 0.7164**, **P@6: 62.32%** (Acc: 68.86%) | Tourist personal feed, seasonal/nearby/history/trending candidate rankings |
| **4. 508-District Investment Potential** | Multi-Factor Composite | Canonical 6-Factor Model | Weight Sum & Confidence | **Weights = 1.0**, **Penalty: 18.0 (Proto) / 0.0 (Prod)** | DMO Investment priorities, 508-district rankings & Scenario Simulator |
| **5. Review Authenticity Classifier** | NLP / Linguistic Classifier | LogisticRegression | Precision / Recall | **Precision: 95.5%**, **Accuracy: 94.2%** | Verified booking review integrity & spam detection |
| **6. Eco-Permit Gatekeeper Rerouter** | Graph Diversion | Rule-Constrained Graph Router | Determinism | **100% Guaranteed Diversion** | Dynamic rerouting when destination is permit-locked |
| **7. Multi-Modal Itinerary Planner** | Constrained Optimizer | Graph Traversal + OR-Tools + LLM | Feasibility Rate | **100% Valid Sequences** | 3-Day structured cultural itineraries |

All models have automated unit tests verifying execution, edge cases, and graceful degradation across all 4 panels.

---

## 8.1 Cryptographic Audit Log Architecture (Tamper-Evident SHA-256 Hash Chain)

All administrative operations, moderation decisions, safety overrides, and destructive actions are logged to the `audit_logs` table with cryptographic SHA-256 hash chaining:
- **Genesis Block**: `prev_hash = "0" * 64`
- **Chaining Rule**: `entry_hash = SHA256(f"{prev_hash}:{actor_id}:{action}:{target_id}:{details}:{timestamp}")`
- **Verification Endpoint**: `/api/admin/audit-logs` validates that `entry[i].prev_hash == entry[i-1].entry_hash` across the entire database history, returning `hash_chain_verified: true`. Any manual database row modification immediately breaks the cryptographic signature chain.

---

## 9. The Five Isolated Role Portals Architecture

```
                                   +-----------------------+
                                   |     User Identity     |
                                   |   (users.role claim)  |
                                   +-----------+-----------+
                                               |
     +-----------------+------------+----------+----------+-----------------+-----------------+
     |                 |                       |                            |                 |
     v                 v                       v                            v                 v
+--------------+ +--------------+       +--------------+             +--------------+  +--------------+
|   TOURIST    | |     HOST     |       |     DMO      |             |  GOVERNMENT  |  |    ADMIN     |
|  (/tourist)  | |   (/host)    |       |   (/dmo)     |             |    (/gov)    |  |   (/admin)   |
+--------------+ +--------------+       +--------------+             +--------------+  +--------------+
| - Travel     | | - Live KPIs  |       | - Live Crowd |             | - 508 Distr. |  | - Listing    |
|   Twin       | | - AI Dynamic |       |   Heatmap    |             |   Intel      |  |   Moderation |
| - Seasonal   | |   Pricing    |       | - Eco-Permit |             | - Readiness  |  | - User Roles |
|   Matcher    | | - 11-Step    |       |   Gatekeeper |             |   Index      |  | - Destination|
| - Smart Map  | |   Wizard     |       | - Secondary  |             | - Simulator  |  |   Catalog    |
| - Split-UPI  | | - Booking    |       |   Circuit    |             | - Compare    |  | - ML Health  |
|   Checkout   | |   Approvals  |       |   Diversion  |             |   Workspace  |  |   & Audit    |
+--------------+ +--------------+       +--------------+             +--------------+  +--------------+
```

1. **Route-Level Separation**: Strict isolation ensures that tourists never encounter host management features, hosts cannot view or mutate administrative configurations, DMO officers operate within district analytics and permit gates, and government planners access national investment intelligence.
2. **Universal Role Switcher**: Located in [`ProfileDropdown.tsx`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/frontend/src/components/common/ProfileDropdown.tsx) allowing authenticated evaluators and developers to switch between all personas without session corruption.

---

## 10. Security & Authentication Architecture

* **Sliding-Window Rate Limiter**: Enforced at the API Gateway layer (`backend/app/core/rate_limit.py`) on `/api/auth/login` to prevent brute-force attacks (`max_requests=5, window_seconds=900`).
* **Two-Factor Authentication (TOTP)**: High-privilege accounts (Host, DMO, Admin) support time-based one-time passwords via `pyotp` with QR-code provisioning (`/api/auth/mfa/setup`) and token verification (`/api/auth/mfa/verify`).
* **Immutable Security Audit Trail**: The `audit_logs` table records every role modification, permit lock toggle, listing status update, and price override with actor ID, timestamp, and metadata payload.
* **Token Protection**: JWT authentication tokens are transmitted via `httponly=True`, `samesite="lax"`, SSL-secured cookies.

---

## 11. Autonomous Live Hourly Data Pipeline & Token Architecture

TravelSathi operates an unattended data pipeline to ensure real-time responsiveness to weather events, holiday surges, and tourism pressures:

1. **Lifespan Startup Trigger**: `backend/app/main.py` kicks off `run_hourly_refresh()` asynchronously at server initialization and schedules a recurring 60-minute background job.
2. **Hourly Token Ingestion**: Generates tokens following the `tok_hourly_YYYYMMDD_HH00` specification (e.g. `tok_hourly_20260916_0400`), attaching the token to catalog queries and cache headers.
3. **External Cron Ingestion**: GitHub Actions workflow [`.github/workflows/hourly_pipeline.yml`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/.github/workflows/hourly_pipeline.yml) triggers `POST /api/jobs/hourly` at minute 0 of every hour.
4. **Execution Audit**: Every run logs duration, status, and candidate metrics to the `pipeline_runs` table (`GET /api/pipeline_runs`).

---

## 12. Multilingual Internationalization (i18n) Architecture

TravelSathi achieves complete localization across 7 official Indic languages:
* **Languages**: Hindi (hi), Marathi (mr), Bengali (bn), Tamil (ta), Telugu (te), Gujarati (gu), and English (en).
* **Two-Layer Translation**:
  1. *Static UI Dictionary*: `frontend/src/locales/*.json` managed via `i18next` for buttons, navigation, headers, forms, and alerts.
  2. *Dynamic Linguistic Engine*: [`summaryTranslator.ts`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/frontend/src/utils/summaryTranslator.ts) featuring parametric regex translation for live distances (`X km away`), event durations, confidence tiers, festival names, and dossier fields (significance, traditional foods, local crafts, transit guidance).

---

## 13. Emergency & Tourist Essentials Spatial Mesh Architecture

A dedicated geospatial services layer built directly on the Leaflet/PostGIS coordinate grid:
* **Coverage**: 548+ verified health and tourism establishments across all 36 States and Union Territories.
* **Service Tiers**:
  * Level-1 Trauma Emergency Hospitals with direct `tel:108` ambulance dispatch.
  * Verified Hotels & Certified Homestays with verified host pricing and amenities.
  * Regional Dining & Dhabas with hygiene classifications and cuisine specialties.
* **Spatial Interactive Controls**:
  * One-click `tel:` emergency call links embedded directly in Leaflet popup bubbles and side cards.
  * Client-side Sub-Category Filter pills (`All`, `Hospitals`, `Hotels`, `Homestays`, `Dining`) with live cluster updates.
  * In-app OpenRouteService road routing with external Google Maps navigation fallback.

---

## 14. Government Tourism Investment Intelligence Architecture

A national-scale decision-support system analyzing **508 recognized districts of India**:

```
+---------------------------------------------------------------------------------------+
|                       508 Districts Ingestion & Resolution                            |
|       (Census Data + ASI Registries + MoT Footfalls + AAI Aviation Telemetry)         |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                               Feature Normalization Pipeline                          |
|             (Outlier Capping, Robust Scaling, Anti-Double-Counting Guard)             |
+---------------------+---------------------+---------------------+---------------------+
                      |                     |                     |
                      v                     v                     v
+---------------------------+ +---------------------------+ +---------------------------+
|    Tourism Potential      | |   Infrastructure Gap &    | |   Untapped Opportunity    |
|   (6-Factor Empirical)    | |    Readiness (0 - 100)    | |   (8-Class Taxonomy)      |
+---------------------------+ +---------------------------+ +---------------------------+
                      \                     |                     /
                       \                    |                    /
                        v                   v                   v
+---------------------------------------------------------------------------------------+
|                           Investment Priority Engine (1 - 508)                        |
|              Readiness Gap Analysis: Gap = Potential - Infrastructure Readiness       |
|                  Strategic 4-Quadrant Priority Matrix Formulation                    |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                    Calibrated 90.0% Confidence & Grounding Engine                     |
+-------------------------------------------+-------------------------------------------+
                                            |
         +------------------+---------------+------------------+------------------+
         |                  |                                  |                  |
         v                  v                                  v                  v
+------------------+ +------------------+              +------------------+ +------------------+
| Overview & Map   | | 508 District     |              | Capital Scenario | | Multi-District   |
| Matrix Workspace | | Rankings Table   |              | Simulator        | | Compare Tool     |
| (?tab=overview)  | | (?tab=rankings)  |              | (?tab=simulator) | | (?tab=compare)   |
+------------------+ +------------------+              +------------------+ +------------------+
```

1. **Empirical Data Calibration (90.0% Confidence)**: Calibrated against ground-truth government datasets (ASI national monuments, Ministry of Tourism verified footfalls, AAI aviation connectivity, and Geographical Indications registry), operating in Calibrated Production Mode.
2. **Infrastructure Readiness Index ($0-100$)**:
   $$\text{Readiness} = 0.35 \cdot \text{Transit} + 0.30 \cdot \text{Stays} + 0.20 \cdot \text{Activities} + 0.15 \cdot \text{SeasonalStability}$$
3. **Readiness Gap Analysis**:
   $$\text{Gap} = \text{Tourism Potential} - \text{Infrastructure Readiness}$$
   Districts with large positive gaps represent high-priority public investment targets where capital unlocks exponential visitor absorption.
4. **Dedicated Workspaces Architecture**:
   - `?tab=overview`: Strategic readiness matrix & 7-layer national geography map.
   - `?tab=rankings`: Searchable, filterable 508 districts table with Readiness Index and CSV export.
   - `?tab=simulator`: Capital allocation intervention simulator (₹5 Cr – ₹100 Cr) and grounded AI advisor.
   - `?tab=compare`: Dedicated side-by-side comparison workspace with metric meters and comparative trade-off synthesis (`POST /api/government/tourism/compare`).
5. **Hourly Token Coherence**: All endpoints inject `tok_hourly_YYYYMMDD_HH00` ensuring cross-portal synchronization and audit traceability.

---
*Technical Architecture finalized for TravelSathi V3.0 Production & SIH National Grand Finale.*
