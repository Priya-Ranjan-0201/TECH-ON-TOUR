# 🇮🇳 TravelSathi — India's Digital Public Infrastructure for Smart Tourism
### *Unified Multilingual Travel Twin, Anti-Overtourism Gatekeeper, Verified Host Hub & Government Investment Intelligence*

[![SIH Grand Finale](https://img.shields.io/badge/SIH-Grand%20Finale%20Ready-success?style=for-the-badge&logo=shield)](https://github.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20Async-009688?style=for-the-badge&logo=fastapi)](http://127.0.0.1:8000/docs)
[![React Vite](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)](http://localhost:5173)
[![Machine Learning](https://img.shields.io/badge/ML%20Models-8%20Local%20Pipelines-FF6F00?style=for-the-badge&logo=scikit-learn)](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/backend/app/services)
[![Database](https://img.shields.io/badge/POIs%20Scored-12%2C601%20Destinations-blueviolet?style=for-the-badge)](http://localhost:5173/dmo/potential)
[![Gov Intelligence](https://img.shields.io/badge/Gov%20Districts-508%20Analyzed-darkgreen?style=for-the-badge)](http://localhost:5173/gov/tourism-intelligence)

---

## 🌟 The Vision: Why TravelSathi?

India is home to an extraordinary tapestry of culture, heritage, and natural beauty — over **12,600 verified destinations** spanning **36 States and Union Territories**. 

Yet today, nearly **80% of tourism footfall concentrates in just a handful of overcrowded epicenters** — causing severe traffic gridlocks in Manali, ecological strain in Shimla, and overwhelming lines in Varanasi. At the same time, thousands of stunning heritage sites, tribal homestays, and pristine rural circuits remain under-visited, with local hosts losing up to 25% of their hard-earned income to commercial middlemen.

**TravelSathi** was built to change this narrative. 

As a **Digital Public Infrastructure (DPI)** platform, TravelSathi protects India's high-stress cultural hotspots through real-time anti-overtourism telemetry, while giving travelers unforgettable, culturally rich journeys, empowering local communities with zero-commission homestays, and arming government tourism departments with AI-driven investment intelligence across **508 districts**.

---

## 🚀 Get Started in 60 Seconds

We made testing and running the entire ecosystem effortless.

### The 1-Click Launch (Windows)
Simply run the interactive master runner in your project root:
```cmd
.\run.bat
```
`run.bat` automatically:
1. Detects your Python and Node.js environments.
2. Checks and verifies all backend dependencies and npm packages.
3. Ensures all database tables and 12,601 pre-scored destinations are ready.
4. Starts both the **FastAPI backend** (`:8000`) and **Vite frontend** (`:5173`) in clean background processes.
5. Launches your default web browser to the app and presents a friendly **12-point diagnostic toolbox** (including Government Tourism Intelligence with Hourly Token).

---

### Manual Setup (Step-by-Step)

If you prefer starting services individually:

#### 1. Backend (FastAPI + Async SQLite)
```bash
cd backend
python -m pip install -r requirements.txt
python scripts/run_create_tables.py
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Interactive Swagger Documentation: `http://127.0.0.1:8000/docs`

#### 2. Frontend (React 19 + Vite + TailwindCSS + Leaflet)
```bash
cd frontend
npm install
npm run dev
```
* Web Application: `http://localhost:5173`

---

## 🏛️ The 5 Dedicated Portals

TravelSathi isolates capabilities into five distinct, role-governed portals tailored for each stakeholder in India's tourism ecosystem:

```
                                    ┌──────────────────────────┐
                                    │       TRAVELSATHI        │
                                    │  National DPI Ecosystem  │
                                    └────────────┬─────────────┘
                                                 │
     ┌────────────────┬──────────────┴──────────────┬────────────────┐
     ▼                ▼                             ▼                ▼
┌──────────┐  ┌──────────┐            ┌──────────────┐  ┌──────────┐
│ TOURIST  │  │   HOST   │            │ DMO COMMAND  │  │  ADMIN   │
│ Travel   │  │ Zero-Cut │            │  Overtourism │  │ Catalog  │
│ Twin     │  │ Stays    │            │  & Gov Intel │  │ & Audit  │
└──────────┘  └──────────┘            └──────────────┘  └──────────┘
```

| Portal | Route | Who it's for | Key Highlights |
| :--- | :--- | :--- | :--- |
| **Tourist Command Center** | `/` or `/tourist` | Indian & International Travelers | Multilingual Travel Twin, real-time crowd heatmap, seasonal weather matching, 130+ emergency essentials + nationwide 24/7 OSM emergency locator, client-side encrypted group trips, split-UPI checkouts. |
| **Verified Host Hub** | `/host` | Homestay Hosts & Eco-Hotels | Real-time booking requests, DigiLocker eKYC, AI Tariff Co-Pilot (5-fold test R² = 0.9956), 0% commission, guest messaging. |
| **DMO & Government Command Center** | `/dmo` & `/dmo/investment` | State Tourism Boards & Ministry Authorities | Carrying capacity telemetry, Eco-Permit Gatekeeper, 508-district investment prioritization, Festival Crowd Forecaster (5-fold test R² = 0.9685), Scenario Simulator, AI Advisor. |
| **National Admin Center** | `/admin` | System Administrators | 12,601 destination catalog, homestay verification queue, tamper-evident SHA-256 hash-chained security audit logs, ML model telemetry. |

> 📖 **Panel-specific documentation** is available in the [`docs/`](docs/) directory:
> - [`docs/README_TOURIST.md`](docs/README_TOURIST.md) — Tourist Portal
> - [`docs/README_HOST.md`](docs/README_HOST.md) — Host Hub
> - [`docs/README_DMO.md`](docs/README_DMO.md) — DMO & Government Command Center
> - [`docs/README_ADMIN.md`](docs/README_ADMIN.md) — National Admin Center

---

## 💡 What Makes TravelSathi Unique?

### 1. 🎯 Destination Potential Score Engine (12,601 Destinations)
Implemented under the Swadesh Darshan 2.0 framework, this model scores every single destination in India from **0 to 100** based on six rigorous empirical factors:
* **Attraction Strength (30%)**: Area agglomeration of heritage monuments and uniqueness bonus.
* **Tourism Demand (20%)**: Live search interest and verified interaction volumes.
* **Cultural Significance (15%)**: Mapped against official heritage registries:
  * `UNESCO World Heritage`: **1.0**
  * `ASI Protected Monument`: **0.7** (144 verified ASI sites)
  * `State Recognized`: **0.4**
  * `Unlisted / Regional`: **0.1**
* **Growth Opportunity (15%)**: 30-day interaction acceleration rate.
* **Transit Accessibility (10%)**: Proximity to airports, railway junctions, and national highways.
* **Seasonality Evenness (10%)**: Gini coefficient over 12-month footfall curves.

> Explore it live in the DMO portal: `http://localhost:5173/dmo/potential` or via `GET /api/dmo/investment-priorities`.

---

### 2. 🏛️ Government Tourism Investment Intelligence (508 Districts) — Calibrated Production Mode
An enterprise-grade decision-support module for the **Ministry of Tourism** and state DMO officers:
* **Calibrated 90.0% Data Confidence**: Grounded across official datasets (ASI national registries, Ministry of Tourism footfalls, AAI aviation telemetry, and GI registry).
* **Infrastructure Readiness Index (0–100)**: Evaluates multimodal transit accessibility, accommodation capacity, activity infrastructure, and operational seasonality stability.
* **Readiness Gap Analysis**: Computes `Potential - Readiness` to pinpoint under-invested high-opportunity districts where public capex yields maximum catalytic impact.
* **Dedicated Workspaces Architecture**:
  * 📊 **Strategic Overview & Readiness Matrix** (`?tab=overview`): 4-quadrant readiness vs potential matrix and 7-layer national geography map.
  * 📋 **508 Districts Rankings** (`?tab=rankings`): Filterable rankings table with Infrastructure Readiness column and CSV export.
  * ⚡ **Scenario Simulator & AI Advisor** (`?tab=simulator`): Budget interventions (₹5 Cr – ₹100 Cr) with projected uplift and grounded AI policy advisor.
  * ⚖️ **Multi-District Strategic Comparison** (`?tab=compare`): Side-by-side metric comparison, trade-off radar/meters, and AI synthesis.
* **Hourly Token Integration**: All responses, exports, and printable reports include `hourly_token` (`tok_hourly_YYYYMMDD_HH00`) for cache coherence and audit traceability.
* **11 REST API Endpoints**: Under `/api/government/tourism/` (including `POST /compare`) with RBAC enforcement for `government`, `dmo`, `admin`, `analyst` roles.

> Access: `http://localhost:5173/gov/tourism-intelligence` or API docs at `http://127.0.0.1:8000/docs`

---

### 3. 🚦 Anti-Overtourism Gatekeeper & Sustainable Green Circuits
Instead of simply telling travelers "don't go there," TravelSathi actively diverts demand to curated green alternatives:
* **Manali** breached threshold? ➔ Diverts to **Tirthan Valley & Jibhi** (-65% crowd).
* **Shimla** saturated? ➔ Diverts to **Chail & Narkanda** (-70% crowd).
* **Jaipur** peak hours? ➔ Diverts to **Bundi & Shekhawati** (-70% crowd).
* Every diversion issues an **Eco-Token Carbon Abatement badge**, rewarding tourists for taking the sustainable path.

---

### 4. 🎪 Festival Footfall Forecaster & Staffing Co-Pilot
India's cultural festivals attract millions in short spans. Our Gradient Boosting forecaster (R² = 0.980) predicts 14-day arrival curves for events like Kumbh Mela, Diwali, Durga Puja, and Hornbill:
* **Autonomous Staffing Recommendations**: Automatically calculates required police personnel, emergency medical stations, and sanitation workers based on projected crowd index.
* **Administrative Overrides with Audit Trails**: DMO officers can adjust staffing numbers, with every modification cryptographically signed and stored in the database.

---

### 5. 🏥 24/7 Emergency Healthcare & Travel Essentials Grid
A nationwide emergency mesh featuring **130+ verified hospital & clinic locations** grounded in database plus 24/7 dynamic OpenStreetMap emergency locator spanning all 36 States & UTs:
* **Level-1 Trauma Centers & Government Hospitals**: Direct `108` / `112` hotlines and emergency ambulance dispatch contacts.
* **Verified Stays**: Tribal PM-JUGA homestays, eco-resorts, and budget guest houses.
* **Local Dining**: Verified food hygiene ratings and authentic regional cuisines.
* **Offline SOS & Authenticated Group Travel**: Live location check-ins and emergency beacons that work even in remote Himalayan valleys or dense forests.

---

### 6. 🌐 Deep Multilingual Localization (7 Indic Languages)
TravelSathi speaks the language of India:
* **Supported**: English, Hindi (हिन्दी), Marathi (मराठी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Gujarati (ગુજરાતી).
* Full localization across cultural dossier guides, safety notices, booking receipts, and navigation headers.

---

## 🤖 Machine Learning Intelligence Suite

TravelSathi runs **7 specialized models** locally with ultra-fast inference and verified held-out performance:

| # | Model | Purpose | Architecture | Held-Out Performance |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Destination Potential Engine** | Rank tourism investment priority | Multi-Factor Empirical Composite (6 Factors) | 100% of 12,601 POIs Scored (Weights = 1.0) |
| 2 | **Dynamic Tariff Co-Pilot** | Fair pricing for local homestays | GradientBoostingRegressor | 5-Fold Test R² = 0.9956 ± 0.0007, MAE: ₹178.83 |
| 3 | **Festival Footfall Forecaster** | Crowd surge & staffing predictions | GradientBoostingRegressor | 5-Fold Test R² = 0.9685 ± 0.0063, MAE: 80.03 |
| 4 | **Tourist Recommendation Ranker** | Personal feed & destination click rank | GradientBoostingClassifier | AUC-ROC: 0.7164, Precision@6: 62.32%, Acc: 68.86% |
| 5 | **Overtourism Risk Classifier** | Live carrying capacity detection | Dynamic Carrying Capacity Ratio | Real-time trigger at ≥ 70% |
| 6 | **Review Authenticity Classifier** | Filter fake reviews & verify bookings | LogisticRegression on linguistic features | Precision: 95.5%, Accuracy: 94.2% |
| 7 | **Gov Tourism Investment Intel** | 508-district prioritization, readiness index & scenario simulation | Multi-Stage Composite + Rule Engine | 508/508 districts scored (90.0% Calibrated Confidence, Readiness: 51.4/100) |

---

## ⏱️ Dynamic Hourly Token Standard

In compliance with our real-time Digital Public Infrastructure mandate, all API responses include an hourly synchronization token:

**Token Format**: `tok_hourly_YYYYMMDD_HH00`

* Example: `tok_hourly_20260916_0400`
* Automatically generated via `get_current_hourly_token()` in backend routes.
* Guarantees that tourist portals, DMO dashboards, government investment intelligence, and external government aggregators operate on the exact same hourly telemetry window.
* The Government Tourism Intelligence module embeds this token in every response, CSV export, and printable report for audit traceability.

---

## 🧪 Comprehensive Verification & Test Suite

Run unit and integration tests at any time:

```bash
# Test Destination Potential Score algorithm (Bounds, weights, missing data fallbacks)
pytest backend/tests/test_potential_score.py -v

# Test ML models (Dynamic Pricing, Recommendation, Authenticity)
pytest backend/tests/test_all_3_ml_models.py -v

# Test Cultural Events dataset & 7-language translations
pytest backend/tests/test_cultural_events.py -v

# Test Government Tourism Intelligence & Crowd Index Suites
pytest backend/tests/test_govt_suite.py backend/tests/test_crowd_index.py -v

# Run the complete 26-check Master System Audit
python scripts/master_audit_runner.py
```

---

## 📁 Repository Structure

```
SIH/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST endpoints (dmo, destinations, safety, gov tourism, etc.)
│   │   ├── database/        # SQLAlchemy models (12,601 destinations, transport, gov intelligence)
│   │   ├── services/        # ML models (potential score, pricing, routing, gov intelligence service)
│   │   ├── schemas/         # Pydantic validation schemas (tourist, gov, dmo)
│   │   └── core/            # Auth, config, rate limiting, RBAC dependencies
│   ├── data/                # Real government datasets (Visits 2020-2024, ASI footfalls)
│   └── tests/               # Automated pytest suites (potential, ML, events, gov intelligence)
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI widgets (Timeline, SmartMap, Modal)
│   │   ├── views/           # Full portal pages
│   │   │   ├── gov/         # Government Tourism Intelligence & Gov Dashboard
│   │   │   ├── host/        # Host Hub Dashboard
│   │   │   ├── tourist/     # Tourist portal views (Dashboard, Trips, Groups, etc.)
│   │   │   └── admin/       # Admin Dashboard & DMO Admin
│   │   └── locales/         # 7 Indic language translation files (hi, bn, ta, te, etc.)
├── ml/
│   ├── config/              # config.yaml (centralized weights, thresholds)
│   ├── data/government_sources/  # 8 source CSVs (508 districts) + investment data template
│   ├── features/            # Entity resolution & feature pipeline
│   ├── models/              # Tourism potential, opportunity, infrastructure gap, priority engine
│   ├── explainability/      # Factor contribution breakdown & narrative briefing
│   ├── inference/           # Master orchestrator (orchestrator_gov.py)
│   └── schemas/             # JSON contract schema (Section 42)
├── data/                    # Master destination datasets (12,601 POIs across 36 States/UTs)
├── docs/                    # Panel-specific README documentation
│   ├── README_TOURIST.md
│   ├── README_HOST.md
│   ├── README_DMO.md
│   ├── README_GOV_INTELLIGENCE.md
│   └── README_ADMIN.md
├── scripts/                 # Ingestion, audit, coordinate correction, and test scripts
├── run.bat                  # Interactive one-click launch suite and 12-point diagnostic toolbox
└── README.md                # Project documentation and architectural overview (this file)
```

---

## 🔗 Key URLs (After Running `run.bat`)

| Service | URL |
| :--- | :--- |
| Main Web Application | `http://localhost:5173` |
| DMO Command Center | `http://localhost:5173/dmo` |
| Gov Tourism Intelligence | `http://localhost:5173/gov/tourism-intelligence` |
| Admin Panel | `http://localhost:5173/admin` |
| Swagger API Docs | `http://127.0.0.1:8000/docs` |
| ReDoc API Docs | `http://127.0.0.1:8000/redoc` |

---

## 🤝 Developed for Smart India Hackathon (SIH)
*Crafted with heart, rigorous engineering, and deep respect for India's incredible heritage and hospitality.*
