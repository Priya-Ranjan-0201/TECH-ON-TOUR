# 🧠 TravelSathi — Master Development Context & Memory Ledger
### *Live State Persistence, Context Recovery Registry & Session Progress Log*

> [!IMPORTANT]
> **Single Source of Truth (SSOT):** Read this file first to resume where the previous session left off. Keep the **"Current State"** section updated after every work session.

---

## ⚡ CURRENT STATE (Always Read First)

*   **Project Name:** TravelSathi (Unified DPI & AI Tourism Ecosystem for India)
*   **Active Version:** **Version 3.0 (Master Fix v3 + Multi-Panel Operations & Automated Hourly Pipeline)**
*   **Last Completed Milestones:**
    1. **Pillar 1 — Hourly Token & Live Data Job Automation First:**
        - Lifespan scheduled background task in `backend/app/main.py` triggering `run_hourly_refresh()` asynchronously at server startup and every 60 minutes.
        - Automated token generation format: `tok_hourly_YYYYMMDD_HH00` (e.g., `tok_hourly_20260912_0900`), verified active in catalog query responses and cache.
        - Dedicated public and administrative endpoints:
          - `GET /api/jobs/hourly`: Real-time health status, active hourly token, and last run timestamp.
          - `POST /api/jobs/hourly`: On-demand manual or cron trigger for hourly refresh.
          - `GET /api/pipeline_runs`: Execution history log with token, rows processed, duration, and status.
        - Created GitHub Actions workflow `.github/workflows/hourly_pipeline.yml` running on `cron: '0 * * * *'` to trigger hourly ingestion unattended.
    2. **Pillar 2 — Seasonal Bug Fix (12-Month Differentiation):**
        - Defined climate-aware scoring algorithm in `month_in_season_range(month_input, season_str)` in `backend/app/api/destinations.py`.
        - Supports named ("March", "mar") and numeric (1-12) month parameters, regional climatic seasons (monsoon, winter, summer, spring, autumn), and geographic state diversity (max 2 per state).
        - Added `GET /api/destinations/by-month?month={month}` returning climate telemetry, dynamic `seasonal_badge` text ("Optimal Season: {Month}"), and differentiated destination sets.
        - Updated `frontend/src/views/tourist/SeasonalView.tsx` with `onMonthSelect(month) -> GET /api/destinations/by-month`.
        - **Verified Result:** 12/12 month tabs produce distinct top-3 destination sets (exceeding requirement of $\ge 8$) with 100% badge consistency.
    3. **Pillar 3 — "My AI Travel Twin" Real-Time Sync & Persistence:**
        - Implemented `PATCH /api/users/{user_id}/preferences` and `GET /api/user/twin/{user_id}` in `backend/app/api/user.py`.
        - Fixed ownership authorization in `backend/app/core/auth_dependencies.py` to allow default guest/test profiles (`usr-901`, `guest`) while strictly enforcing authenticated checks for registered users.
        - Attached `handleSelectChange` on every dropdown in `frontend/src/views/tourist/TravelTwinView.tsx` (Primary Travel Style, Budget Tier, Accommodation, Pace, Food Preference, Group Type).
        - Changes update React state immediately, synchronize `updateTravelTwin(...)` in context, and dispatch background `PATCH` requests that persist to the database.
        - The right-hand panel ("What Does TravelSathi Know About Me") re-renders live in the same session and persists across page reloads.
    4. **Pillar 4 — Full Role Separation (4 Isolated Portals):**
        - Complete isolation between **Tourist** (`/tourist`, `/explore`, `/plan`), **Host** (`/host`), **DMO** (`/dmo`), and **Admin** (`/admin`).
        - Zero cross-role UI feature bleeding; role-scoped route code-splitting in Vite.
        - Added universal "Portal & Role Switcher" in `frontend/src/components/common/ProfileDropdown.tsx` allowing seamless switching between Tourist, Host, DMO, and Admin.
    5. **Pillar 5 — Security & Authentication Hardening:**
        - In-memory sliding-window rate limiter enforcing **5 requests per 15 minutes** on `/api/auth/login` in `backend/app/core/rate_limit.py`.
        - Two-factor authentication (TOTP) endpoints: `/api/auth/mfa/setup` (returns base32 secret and QR code URI) and `/api/auth/mfa/verify` (validates 6-digit TOTP token with recovery code).
        - Secure cookies with `httponly=True`, `samesite="lax"`, and server-side JWT claims verification.
        - Immutable `AuditLog` table capturing all security-sensitive actions (role changes, listing status updates, eco-permit locks).
    6. **Pillar 6 — Multi-Panel Operations & End-to-End Persistence:**
        - **Host Portal (`/host`)**:
          - `POST /api/host/apply-price`: AI Pricing Co-Pilot applies optimized tariff to listing in SQLite DB.
          - `POST /api/host/listings`: 11-step wizard creates new homestays.
          - `PUT /api/host/listing/{id}`: Edit listing title, price, and district with instant UI update.
          - `POST /api/host/bookings/{id}/approve`: Approves booking and updates status to confirmed.
          - `POST /api/host/bookings/{id}/respond`: In-app host replies to guest inquiries.
        - **DMO Intelligence Portal (`/dmo`)**:
          - `POST /api/dmo/eco-permit/toggle`: Dynamic Gatekeeper Lock toggles permit access; updates crowd density score in `DestinationMaster` and reroutes traffic.
          - `PUT /api/dmo/circuits/{id}`: Edits secondary cluster alternative, carrying capacity, and crowd reduction %, updating `AntiOvertourismPair` and `DestinationMaster`.
          - Itinerary diversion verified: When Manali is permit-locked, `POST /api/itinerary/generate` returns "Sustainable Eco-Circuit: Tirthan Valley & Jibhi Eco-Cluster" with DMO carrying capacity advisory.
        - **Admin Center (`/admin`)**:
          - `POST /api/admin/listings/{id}/status`: Moderates homestays (`verified`, `rejected`, `suspended`) and records in `AuditLog`.
          - `PUT /api/admin/users/{id}/role`: Changes user roles in database.
          - `PUT /api/admin/destinations/{id}`: Edits destination details across the 12,293 catalog in SQLite.
          - `POST /api/admin/pipeline/trigger-refresh` & `POST /api/admin/pipeline/trigger-hourly-refresh`: Manually triggers pipeline and live hourly refresh, logging runs to `pipeline_runs`.
    7. **Verification & Test Status:**
        - All 17 specialized ML model pytest tests passing (`pytest tests/test_7_specialized_models.py` -> 100%).
        - All automated mutation tests passing (`test_panel_mutations.py` -> 100%).
        - Frontend Vite production build compiling cleanly (`dist/` built in 4.5s with zero errors).
        - Both servers running: Backend on `:8000`, Frontend on `:5173`.
*   **Core Grounding Dataset:** Canonical `data/places.csv` (12,293 verified destinations across 36 States/UTs, 17,891 graph edges)
*   **Active Branch:** `main` (clean Git tracking active)

---

## 1. Project Identity, Technology Matrix & Port Registry

| Architectural Component | Selected Technology Stack | Port / Protocol |
| :--- | :--- | :--- |
| **Frontend Web Client** | React.js (Vite) + Tailwind CSS + Framer Motion + Leaflet.js | `http://localhost:5173` |
| **Backend Core Engine** | FastAPI (Python 3.11 / 3.12 async) + Pydantic v2 + SQLAlchemy | `http://localhost:8000` (Docs: `/docs`) |
| **Relational Database** | SQLite Database (`backend/travelsathi.db` & Supabase PostGIS SRID 4326) | Local File / Supabase |
| **Vector RAG Store** | In-Process ChromaDB (Pre-computed POI embeddings) | Internal / SQLite |
| **ML Inference Suite** | 7 Specialized Models (Pricing, Demand, Circuit, Overtourism, Safety, Eco, Reroute) | Scikit-learn + Joblib |
| **Primary AI Engine** | Google Gemini 1.5 Flash (Free Tier Developer API) | HTTPS REST (Backend Proxied) |
| **Failover AI Engine** | Groq Cloud API (Llama-3-70B-Instruct fallback) | HTTPS REST (Backend Proxied) |
| **Automated Scheduler** | Background Asyncio Task + GitHub Actions (`hourly_pipeline.yml`) | `cron: '0 * * * *'` |

---

## 2. Established Project Documents (System State)

| Document | File Path | Status |
| :--- | :--- | :---: |
| **Official README** | [README.md](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/README.md) | **ACTIVE & COMPREHENSIVE** |
| **Product Requirements** | [PRD.md](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/PRD.md) | **FINALIZED** |
| **Technical Architecture** | [Architecture.md](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/Architecture.md) | **UPDATED v3.0** |
| **Development Rules** | [Rules.md](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/Rules.md) | **FINALIZED** |
| **Phased Roadmap** | [Phases.md](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/Phases.md) | **COMPLETED & EXTENDED** |
| **UI/UX Design System** | [Design.md](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/Design.md) | **FINALIZED** |
| **Living Memory Ledger** | [Memory.md](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/Memory.md) | **ACTIVE (SSOT v3.0)** |
| **Walkthrough & Verification** | [walkthrough.md](file:///C:/Users/PRIYE%20RANJAN/.gemini/antigravity-ide/brain/be90f14f-f910-459c-8003-216e13aab2fd/walkthrough.md) | **VERIFIED 100%** |
| **Grand Master Blueprint** | [TravelSathi_Grand_Master_Blueprint.md](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/TravelSathi_Grand_Master_Blueprint.md) | **MASTER REFERENCE** |

---

## 3. Critical Architectural Memory Blocks (Context Keepers)

1.  **Hourly Token Standard:** Every batch query and catalog response contains the active hourly token (`tok_hourly_YYYYMMDD_HH00`). All hourly runs log duration, status, and metrics into `pipeline_runs`.
2.  **Seasonal Query Contract:** Month selection must never be hardcoded. Always route via `GET /api/destinations/by-month?month={month}` to receive climate-differentiated destinations and dynamic badges.
3.  **Travel Twin Contract:** Dropdown changes in the UI must immediately call `PATCH /api/users/{id}/preferences` and update the local state without requiring manual page reload.
4.  **Role Portals Isolation:** Zero cross-role UI feature bleeding. Tourists only see tourist tools; Hosts only see host tools; DMOs see tourism intelligence; Admins see system operations and moderation.
5.  **Dynamic Eco-Permit Gatekeeper:** When a DMO toggles an Eco-Permit lock on a destination, `is_locked` is updated in the database and any subsequent itinerary generated for that destination is automatically diverted to the designated secondary eco-circuit.
6.  **Rate Limiting & Security:** All login attempts are rate-limited to 5 requests per 15 minutes. High-privilege accounts (Host, DMO, Admin) support TOTP MFA.
7.  **Database Persistence:** Changes made in Host listings, DMO circuits, Admin moderation, and user preferences are written to SQLite (`backend/travelsathi.db`) and persist across restarts.

---
*Memory Ledger finalized for Smart India Hackathon Grand Finale & Production Deployment.*
