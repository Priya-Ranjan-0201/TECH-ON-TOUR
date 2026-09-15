# 🇮🇳 TravelSathi — Frontend Architecture & Component Suite
### *High-Performance React 19 + Vite Client for India's Digital Public Infrastructure for Smart Tourism*

---

## 🌟 Overview

The **TravelSathi Frontend** is a modern, mobile-responsive, role-governed web application powering all 5 ecosystem portals:
1. **Tourist Portal** (`/`): Multilingual Travel Twin, seasonal recommendations, interactive Smart Map, group travel with client-side Web Crypto AES-GCM encryption, and split-UPI checkout.
2. **Host Hub** (`/host`): 11-step homestay wizard, AI Tariff Co-Pilot, real-time booking approvals, and direct guest communication.
3. **DMO Command Center** (`/dmo`): Live carrying capacity telemetry, overtourism gatekeeper, green circuit diversion switchboard, and festival arrival forecaster.
4. **Government Tourism Investment Intelligence** (`/gov/tourism-intelligence`): 508-district investment prioritization, Calibrated 90.0% Empirical Confidence Model, Infrastructure Readiness Index, capital scenario simulator, multi-district comparison workspace, and grounded AI policy advisor.
5. **National Admin Center** (`/admin`): 12,601 destination catalog manager, homestay listing moderation, role manager, and cryptographic SHA-256 tamper-evident audit log explorer.

---

## 🏛️ Government Tourism Investment Intelligence Workspaces

The Government Suite (`/gov/tourism-intelligence`) features separated, dedicated workspace tabs:

| Workspace / Tab | Query Parameter | Highlights |
|:---|:---|:---|
| **Strategic Overview & Readiness Matrix** | `?tab=overview` | Strategic KPIs with 90.0% confidence & hourly token, 4-Quadrant Priority Matrix, and 7-layer National Geography Map. |
| **508 Districts Prioritization Table** | `?tab=rankings` | Searchable & filterable table of all 508 districts with Infrastructure Readiness scores, bottleneck tags, and CSV export. |
| **Scenario Simulator & AI Advisor** | `?tab=simulator` | Multi-pillar capital intervention simulation (₹5 Cr – ₹100 Cr) with visitor uplift & job projections, plus interactive AI Policy Advisor. |
| **Multi-District Strategic Comparison** | `?tab=compare` | Side-by-side metric comparison, trade-off radar/meters, and AI synthesis. |
| **Full Continuous Briefing** | `?tab=all` | Unified continuous briefing of all sections. |

---

## 🌐 Multilingual Localization (7 Indic Languages)

Managed through `i18next` and custom parametric regex translator (`summaryTranslator.ts`):
* **English** (en)
* **Hindi** (hi)
* **Marathi** (mr)
* **Bengali** (bn)
* **Tamil** (ta)
* **Telugu** (te)
* **Gujarati** (gu)

---

## 🛠️ Technology Stack

* **Core Framework**: React 19 + TypeScript
* **Build Tool**: Vite 6.x (Ultra-fast HMR and optimized Rollup code-splitting)
* **Styling**: Tailwind CSS + Custom Design System Tokens (`theme.css`)
* **Icons**: `lucide-react`
* **Maps & GIS**: Leaflet.js + OpenStreetMap tiles + OpenRouteService routing
* **State & Routing**: React Context (`AppContext.tsx`) + React Router v7
* **Security & Cryptography**: Native Web Crypto API (`crypto.subtle` AES-GCM + PBKDF2)

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18.x or higher
* npm 9.x or higher

### Installation
```bash
cd frontend
npm install
```

### Development Server
```bash
npm run dev
```
Runs at `http://localhost:5173` with Hot Module Replacement.

### Production Build
```bash
npm run build
```
Generates an optimized, tree-shaken, code-split bundle in `dist/`.

### Preview Production Build
```bash
npm run preview
```
Previews the production bundle locally at `http://localhost:4173`.
