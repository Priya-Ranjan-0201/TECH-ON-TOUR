# 🛡️ TravelSathi — Master Development Rules & Guardrails
### *Strict Engineering Boundaries, Security Protocols & AI Development Standards*

**Version:** 2.0.0 (Master Guardrails)  
**Target Event:** Smart India Hackathon (SIH) — National Grand Finale  
**Status:** Active & Enforced  

---

## 1. Approved Technology Stack & Library Whitelist
*   **Frontend Permitted:** React.js (v18+), Vite, Tailwind CSS (Theme 1 Heritage Earth tokens), Framer Motion, `@react-three/fiber` + `@react-three/drei` (**hero only**), Leaflet.js + `react-leaflet`, `react-router-dom`, `axios`.
*   **Backend Permitted:** Python 3.11/3.12, FastAPI, Pydantic (v2+), `supabase-py`, SQLAlchemy with PostGIS, `python-dotenv`, `httpx`, `google-generativeai`, `chromadb`.
*   ❌ **Prohibited:** No Bootstrap, Material UI, Redux, Zustand, jQuery, Lodash, GraphQL, or raw unparameterized SQL concatenation.
*   ❌ **No Alternative Primary LLMs:** Google Gemini 1.5 Flash is primary; Groq Cloud (Llama-3-70B) is the only approved failover.

---

## 2. Mandatory Error Handling & Resilience Patterns
*   **Standard JSON Envelope:** All endpoints return `{ "success": true/false, "data": {...}, "error": { "code": "...", "message": "..." } }`. Raw Python tracebacks must **never** leak to the client.
*   **Timeouts:** Outbound calls to external APIs have an explicit timeout of **max 4.0 seconds**.
*   **LLM Parse Retry:** Structured JSON parsed in `try/except` with 1 retry before serving pre-compiled fallback.
*   **Zero Blank Screens:** Under no circumstance may an error trigger a blank screen or unhandled exception.

---

## 3. PostGIS & Database Integrity Guardrails
*   **Strict Parameterization:** All SQL queries must use parameterized bindings (`:lng`, `:lat`, `:radius`). Never concatenate input strings directly into SQL.
*   **No Runtime DDL:** Endpoints must never execute `CREATE TABLE` or `ALTER TABLE`.
*   **ACID Transactions:** Reverse marketplace bid acceptances and Split-UPI ledger insertions must execute inside atomic transactions.

---

## 4. Security, Secrets & 3D Component Isolation
*   **Zero Client-Side Keys:** Private keys live on backend only; frontend calls `/api/*`.
*   **DPDP Act Compliance:** No raw Aadhaar storage; tokenized ID verification; PII encrypted with AES-256-GCM.
*   **3D Hero Isolation:** Confined strictly to `Hero3DScene.jsx` with mandatory `HeroFallback2D.jsx`.
*   **Refresh Persistence Test:** Every feature must survive a hard browser refresh (`Ctrl + F5`) with state in Supabase.

---

## 5. Version 2.0 Architectural & Operational Guardrails
*   **Zero Feature Removal Guarantee:** Existing features, portals (Host, DMO, Admin), authentication, reverse RFPs, pricing models, and datasets must never be deleted or replaced with non-functional placeholders.
*   **Hourly Token Policy:** Rate limits, token quotas, and tracking retention windows must strictly operate on **hourly metrics/tokens**, never weekly tokens.
*   **Explicit GPS Authorization:** Live GPS tracking requires explicit user consent (`startTracking()`) with clear on/off UI indicators and an 8-hour auto-expiring session TTL.
*   **Explainable Recommendations:** Every recommendation presented to users must have a real, data-grounded rationale string.

---
*Development Rules finalized for TravelSathi V2.0 Production & SIH Grand Finale execution.*
