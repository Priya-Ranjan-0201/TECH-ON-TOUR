# 🏛️ Government Tourism Investment Intelligence

> *AI-powered decision support for the Ministry of Tourism — 508 districts analyzed with zero hallucination*

---

Which districts have the highest untapped tourism potential? Where should the next ₹50 crore go? What infrastructure bottlenecks are blocking growth? This module answers these questions using a multi-stage scoring pipeline grounded entirely in verified government data — **never fabricating** tourist counts, tax receipts, or ROI figures.

## ✨ Dedicated Workspaces & Navigation

| Workspace / Tab | Route | What It Does |
|:---|:---|:---|
| 📊 **Strategic Overview & Readiness Matrix** | `?tab=overview` | Calibrated 90.0% confidence KPIs, 4-quadrant Readiness vs Potential Matrix, and 7-layer National Geography Map |
| 📋 **508 Districts Rankings** | `?tab=rankings` | Searchable & filterable table of all 508 districts with Infrastructure Readiness scores, bottlenecks, and CSV export |
| ⚡ **Scenario Simulator & AI Advisor** | `?tab=simulator` | Multi-pillar capital interventions (₹5 Cr – ₹100 Cr) with visitor uplift & job projections, plus interactive AI Policy Advisor |
| ⚖️ **Multi-District Comparison** | `?tab=compare` | Interactive side-by-side trade-off workspace for 2 to 5 districts with comparative metric meters and AI strategic synthesis |
| 📑 **Full Unified View** | `?tab=all` | Continuous unified executive briefing displaying all sections |

## 🔄 Hourly Token Standard

Every response from this module carries the platform-wide hourly token:

```json
{
  "hourly_token": "tok_hourly_YYYYMMDD_HH00",
  "model_version": "TS-GOV-2.1",
  "average_confidence": 90.0,
  "average_readiness": 51.4,
  "data_status": "Calibrated Production Mode (Evidence-Grounded)"
}
```

Embedded in all API responses, CSV exports, and printable reports for audit traceability. Refreshes every hour.

## 🛡️ Calibrated Confidence & Evidence Grounding

This module operates in **Calibrated Production Mode** with **90.0% Model Confidence (High)**:
- Baseline confidence calibrated across verified physical and administrative datasets (ASI national monuments, MoT master registries, AAI aviation telemetry, and GI registry)
- **Infrastructure Readiness Index** ($0 - 100$) computes multimodal connectivity, accommodation capacity, activity infrastructure, and seasonal operational stability
- **Readiness Gap** ($\text{Potential} - \text{Readiness}$) isolates high-ROI public capex targets
- Economic projections are evidence-grounded and never fabricated

## 📐 Scoring Pipeline

```
Entity Resolution (508 districts) 
    → Feature Pipeline (scaling, outlier capping, anti-double-counting)
        → Tourism Potential (6-factor model, 0–100)
            → Untapped Opportunity (8-class taxonomy)
                → Infrastructure Gap (5-category diagnostics)
                    → Investment Priority (national rank 1–508)
                        → Confidence Engine (data quality + model confidence)
```

**6-Factor Weights**: Attraction 30% · Demand 20% · Cultural 15% · Growth 15% · Access 10% · Season 10%

---

## 📍 Routes

| Page | URL |
|:---|:---|
| Tourism Intelligence | `/gov/tourism-intelligence` |
| Alternate URL | `/government/tourism-intelligence` |

**Roles**: `dmo`, `gov`, `government`, `analyst`, `admin`

## 🔌 API Endpoints (11 endpoints under `/api/government/tourism/`)

| Method | Endpoint | Purpose |
|:---|:---|:---|
| `GET` | `/dashboard` | KPIs with hourly token |
| `GET` | `/overview` | Full overview data |
| `GET` | `/rankings` | 508 district rankings |
| `GET` | `/map?layer=...` | Map points by layer |
| `GET` | `/district/:id` | District profile |
| `GET` | `/district/:id/explain` | AI explanation |
| `POST` | `/scenario` | Scenario simulation |
| `POST` | `/compare` | Compare 2–5 districts |
| `POST` | `/advisor` | AI advisor Q&A |
| `GET` | `/sources` | Data provenance |
| `GET` | `/methodology` | Scoring methodology |

## 📁 Files

**Frontend**
- `frontend/src/views/gov/TourismInvestmentIntelligenceView.tsx`

**Backend**
- `backend/app/api/government_tourism.py`
- `backend/app/services/government_tourism_service.py`
- `backend/app/schemas/government_tourism.py`

**ML Pipeline**
- `ml/inference/orchestrator_gov.py` — Master orchestrator
- `ml/features/entity_resolution.py` — 508 district disambiguation
- `ml/features/feature_pipeline.py` — Scaling & anti-double-counting
- `ml/models/tourism_potential.py` — 6-factor potential model
- `ml/models/tourism_opportunity.py` — Opportunity taxonomy
- `ml/models/infrastructure_gap.py` — Gap diagnostics
- `ml/models/priority_engine.py` — National ranking
- `ml/models/confidence_engine.py` — Data quality scoring
- `ml/models/investment_scenario_engine.py` — Scenario simulation
- `ml/explainability/explainability.py` — Factor breakdown
- `ml/config/config.yaml` — Weights & thresholds
- `ml/data/government_sources/` — 8 source CSVs
