# 🧠 TravelSathi — Master Development Context & Memory Ledger
### *Live State Persistence, Context Recovery Registry & Session Progress Log*

> [!IMPORTANT]
> **Single Source of Truth (SSOT):** Read this file first to resume where the previous session left off. Keep the **"Current State"** section updated after every work session.

---

## ⚡ CURRENT STATE (Always Read First)

*   **Project Name:** TravelSathi (Unified DPI for Indian Tourism & Hospitality)
*   **Active Phase:** **Phase 1 — Database Bootstrap & Tech-On-Tour 12k Seeding**
*   **Last Completed Milestone:** **Phase 0 — Workspace Scaffolding & Design System Foundation (100% COMPLETE)** (Commit: `d0a4a8c`)
*   **Next Immediate Task:**
    1. Initialize PostgreSQL PostGIS tables from `Architecture.md` (`destinations_master`, `homestays`, `guides`, `bookings`, `itineraries`, `reviews_training`, `user_badges`).
    2. Build and run `backend/scripts/seed_destinations.py` to ingest 12,293 verified destinations from `Tech-On-Tour/data/places.csv`.
    3. Seed curated anti-overtourism alternate pairs and pre-computed review sentiment data.
*   **Active Design Theme:** **Theme 1: Heritage Earth** (Terracotta `#712B13`, Forest `#27500A`, Temple Gold `#E5A93C`, Warm Ivory `#FDFBF7`)
*   **Core Grounding Dataset:** **Tech On Tour** (12,293 verified destinations across 36 States/UTs, 737 districts, 0 null values, 17,891 graph edges)
*   **Known Blockers:** None.
*   **Active Branch:** `main` (clean Git tracking active)

---

## 1. Project Identity, Technology Matrix & Port Registry

| Architectural Component | Selected Technology Stack | Port / Protocol |
| :--- | :--- | :--- |
| **Frontend Web Client** | React.js (Vite) + Tailwind CSS + Framer Motion + Leaflet.js | `http://localhost:5173` |
| **Backend Core Engine** | FastAPI (Python 3.11 / 3.12 async) + Pydantic v2 + SQLAlchemy | `http://localhost:8000` (Docs: `/docs`) |
| **Relational Database** | Supabase PostgreSQL + PostGIS Spatial Extension (SRID 4326) | `postgresql://...:5432` |
| **Vector RAG Store** | In-Process ChromaDB (Pre-computed POI embeddings) | Internal / SQLite |
| **Primary AI Engine** | Google Gemini 1.5 Flash (Free Tier Developer API) | HTTPS REST (Backend Proxied) |
| **Failover AI Engine** | Groq Cloud API (Llama-3-70B-Instruct fallback) | HTTPS REST (Backend Proxied) |
| **External APIs** | OpenWeatherMap (Weather), Razorpay Sandbox / UPI Deep Link | HTTPS REST (Backend Proxied) |

---

## 2. Established Project Documents (System State)

| Document | File Path | Status |
| :--- | :--- | :---: |
| **Product Requirements** | [PRD.md](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/PRD.md) | **FINALIZED** |
| **Technical Architecture** | [Architecture.md](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/Architecture.md) | **FINALIZED** |
| **Development Rules** | [Rules.md](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/Rules.md) | **FINALIZED** |
| **Phased Roadmap** | [Phases.md](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/Phases.md) | **FINALIZED** |
| **UI/UX Design System** | [Design.md](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/Design.md) | **FINALIZED** |
| **Living Memory Ledger** | [Memory.md](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/Memory.md) | **ACTIVE (SSOT)** |
| **Grand Master Blueprint** | [TravelSathi_Grand_Master_Blueprint.md](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/TravelSathi_Grand_Master_Blueprint.md) | **MASTER REFERENCE** |

---

## 3. Critical Architectural Memory Blocks (Context Keepers)

1.  **PostGIS Spatial Standard:** All coordinates stored as `geometry(Point, 4326)`. Radius queries use `ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`.
2.  **Zero Leaked Keys:** The React client communicates strictly with `/api/*`. No private keys exist in client code.
3.  **Circuit Breaker & Fallback:** Gemini calls have a 3.5s timeout. Automatic failover to pre-compiled graph itineraries.
4.  **Three.js Hero Guard:** Confined strictly to `Hero3DScene.jsx` with automatic hardware fallback to `HeroFallback2D.jsx`.
5.  **Split-UPI Payload:** UPI intent URL formatted as `upi://pay?pa={VPA}&am={AMT}&pn={NAME}` with structured vendor splits.
6.  **Refresh Persistence:** A feature is only complete when it survives a hard browser refresh (`Ctrl + F5`) with state in Supabase.
7.  **DPI & Policy Anchors:** Aligned with Swadesh Darshan 2.0, PM-JUGA (tribal homestays), PM-Vikas (GI artisans), Bhashini (vernacular APIs), and ONDC/UPI (split zero-commission checkout).
8.  **The 15 Advanced Features Registry:**
    - *Core AI/Immersive:* (1) Sanskriti-AR, (2) IndicVoice IVR, (3) Smart Homestay Vision-Audit, (4) CraftGuard AI, (5) GeoGuard Offline SLAM, (6) Crowd-Load Forecaster, (7) LLM+OR-Tools Hybrid Itinerary, (8) CrisisGuard Triage, (9) PermiBot PAP/ILP, (10) Spatial Ambiance, (11) EcoFootprint Gamification.
    - *Real-World Innovations:* (12) TransitGuard Fare Auditor, (13) Sanjeevani-Safe Medical Triage, (14) Swachh-Incentive Litter Spotter, (15) GullyExplore Spatial Audio Companion.
9.  **Dual-Tier Feasibility:** 100% Free Sandbox Stack for hackathon execution; Enterprise Architecture for national DPI scale.
10. **SIH Presentation Core:** 270s Live Demo Script + 4-Point Technical Jury Defense (Acoustic transfer for dialects, DPI value-add monetization, offline ORB-SLAM3 for monuments, client-side downsampling for vision audits).
11. **3-Tier Hackathon Execution Priority & Timeboxing:**
    - *Tier 1 (Must Build — Core Demo Loop, ~70% time, 15–18h):* 1. AI Itinerary Generator (Priority #1), 2. Destination/Hotel Search & Direct Booking (Razorpay test), 3. AI Multilingual Concierge Chatbot, 4. Review/Sentiment Trust Layer (pre-computed offline DistilBERT for 0ms lag on stage), 5. Host Dashboard + Calendarific festival dynamic pricing heuristic.
    - *Tier 2 (Should Build — Wow Factor, ~10–14h):* 6. Hidden Gems / Anti-Overtourism, 7. Safety Score Map Layer, 8. Weather-Aware Itinerary Adjustment, 9. AR Heritage Lens (lightweight info-card + TTS), 10. Sustainability Badges.
    - *Tier 3 (Roadmap Only — Slides Only):* 11. Voice IVR, 12. Static Govt Dashboard (2–3 Chart.js charts), 13. DigiLocker eKYC, 14. Group Split, 15. Blockchain/ONDC.
12. **The Golden Rule of Demo Execution:** *"A fully working Tier 1 (5 features) beats a half-broken Tier 1+2+3."* If behind schedule, cut Tier 2/3 features first; never rush or compromise Tier 1 core loop stability.

---
*Memory Ledger finalized for Smart India Hackathon Grand Finale execution.*
