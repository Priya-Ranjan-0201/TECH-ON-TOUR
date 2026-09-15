# 📊 DMO & Government Tourism Command Center

> *Unified Government Tourism Authority Platform — Real-Time Anti-Overtourism Gatekeeper, Festival Crowd Forecasting & 508-District Investment Intelligence*

---

The **DMO Command Center** is the unified administrative portal for State Tourism Departments, District Tourism Officers, and Ministry Tourism Authorities. It combines real-time carrying capacity monitoring and overtourism gatekeeping with national-scale 508-district tourism investment prioritization, festival footfall surge planning, and multi-modal circuit management.

## ✨ Unified Feature Suite

| Feature | Description | Status |
|:---|:---|:---|
| 🏛️ **508-District Investment Intelligence** | Comprehensive evaluation across all 508 recognized districts of India using canonical 6-factor methodology (Attraction, Demand, Culture, Growth, Accessibility, Seasonality). | ✅ Live (Prototype & Production Modes) |
| 🗺️ **7-Layer National GIS Map** | Interactive Leaflet GIS visualization with 7 switchable layers: Total POIs, Heritage Assets, Connectivity Index, Tourism Potential, Untapped Opportunity, Investment Priority, and Cultural Depth. | ✅ Live |
| 🚦 **Overtourism Gatekeeper** | Dynamic carrying capacity telemetry (>70% warning, >85% critical) with instant one-click Eco-Permit Lock/Unlock that live-reroutes tourists to pristine secondary circuits. | ✅ Live |
| 🔀 **Green Circuit Diversions** | Automatic diversion rules redirecting footfall (Manali → Tirthan Valley, Shimla → Chail, Jaipur → Bundi, Varanasi → Chunar). | ✅ Live |
| 🎪 **Festival Crowd Forecaster** | Multi-horizon Gradient Boosting model predicting 14-day visitor arrival curves ($R^2 = 0.9685 \pm 0.0063$, MAE: $80.03 \pm 8.12$) for events including Kumbh Mela, Diwali, Durga Puja, and Hornbill. | ✅ Live |
| 👮 **Dynamic Staffing Co-Pilot** | Baseline personnel ratios (Police, Medical, Sanitation) with interactive DMO manual override and full cryptographic audit logging. | ✅ Live |
| 🎛️ **Scenario Simulator** | Live dynamic capital allocator with interactive presets (₹5Cr, ₹10Cr, ₹25Cr, ₹50Cr, ₹100Cr) simulating infrastructure impact and bottleneck relief across road, rail, air, and stay sectors. | ✅ Live |
| 🤖 **AI Tourism Advisor** | Free-form natural language query engine strictly citing verified government sources (Ministry of Tourism, ASI, UNESCO, GI Registry) with zero hallucination. | ✅ Live |
| 🧭 **Circuits & Hidden Gems** | Manage 88+ green corridors and toggle verified hidden gem status to decentralize footfall. | ✅ Live |
| 🛡️ **Safety Scores & Audit Logs** | Review destination safety scores (NCRB-grounded) with tamper-evident audit trails. | ✅ Live |
| 📊 **Footfall & Sentiment Analytics** | Real-time sentiment metrics from verified traveler reviews and authentic booking volume. | ✅ Live |

---

## 🔄 Shared Hourly Telemetry Token

All telemetry across the DMO Command Center is synchronized via the platform-wide hourly token:

```
tok_hourly_YYYYMMDD_HH00
```

- Generated deterministically by `get_current_hourly_token()`.
- Verified 100% identical across all 4 platform panels at the same hour.
- Invalidates and auto-syncs sensor cache every 60 minutes.

---

## 📍 Panel Routes & Enterprise Government Suite

### DMO Command Center Tabs (`/dmo/*`)
| Tab / Sub-Section | Route | Purpose |
|:---|:---|:---|
| **Command Center Overview** | `/dmo` | Live carrying capacity heatmap, critical overtourism alerts, gatekeeper switchboard. |
| **Tourism Investment Intel** | `/dmo/investment` | 508-district rankings table, 7-layer GIS map, Scenario Simulator, and AI Advisor. |
| **Crowd & Festival AI** | `/dmo/crowd` | 14-day festival arrival curves, footfall surge predictions, staffing ratio overrides. |
| **Circuits & Hidden Gems** | `/dmo/circuits` | Heritage and green alternative circuit management, hidden gem toggling. |
| **Footfall & Sentiment** | `/dmo/analytics` | Regional review sentiment, booking revenue telemetry, pipeline health. |
| **Safety & Compliance** | `/dmo/safety` | Destination safety score compliance and field inspection audit logs. |

### Dedicated Government Tourism Investment Intelligence Suite (`/gov/tourism-intelligence`)
| Dedicated Tab | Route | Purpose |
|:---|:---|:---|
| **Strategic Overview & Readiness Matrix** | `?tab=overview` | 90.0% Calibrated Confidence KPIs, 4-Quadrant Strategic Matrix, 7-layer National Map. |
| **508 Districts Prioritization Table** | `?tab=rankings` | 508-district ranked table with Infrastructure Readiness Index and CSV export. |
| **Scenario Simulator & AI Advisor** | `?tab=simulator` | Dynamic capital allocation interventions (₹5 Cr – ₹100 Cr) and grounded AI advisor. |
| **Multi-District Strategic Comparison** | `?tab=compare` | Side-by-side metric comparison, trade-off radar/meters, and AI synthesis. |
| **Full Continuous Briefing** | `?tab=all` | Unified continuous briefing of all sections. |

---

## 🔌 API Endpoints (All Protected by Server-Side RBAC)

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/dmo/destinations-heatmap` | Real-time carrying capacity telemetry and saturation status. |
| `POST` | `/api/dmo/eco-permit/toggle` | Lock or unlock eco-permit gate for a high-stress corridor. |
| `GET` | `/api/dmo/forecasts?days_ahead=90` | Upcoming cultural festivals and predicted footfall indices. |
| `PATCH` | `/api/dmo/forecasts/{id}/staffing` | Override staffing personnel numbers with audit logging. |
| `GET` | `/api/government/tourism/overview` | 508-district overview KPIs, 90.0% confidence, and hourly token. |
| `GET` | `/api/government/tourism/rankings` | Full ranked catalog of all 508 districts with factor scores & readiness. |
| `GET` | `/api/government/tourism/map?layer={layer}` | Geospatial GeoJSON/marker payload for 7 distinct layers. |
| `GET` | `/api/government/tourism/destination/{id}` | Deep-dive explainability profile for an individual district. |
| `POST` | `/api/government/tourism/scenario` | Interactive capital allocation scenario recomputation. |
| `POST` | `/api/government/tourism/compare` | Multi-district side-by-side comparison with readiness & trade-offs. |
| `POST` | `/api/government/tourism/advisor` | Rate-limited AI Q&A engine citing verified sources. |
| `GET` | `/api/dmo/circuits` | Multi-district secondary and green circuits. |
| `GET` | `/api/dmo/safety-scores` | Verified safety scores and compliance status. |

---

## 🔒 Role-Based Access Control (RBAC)

- **Allowed Roles**: `dmo`, `gov`, `government`, `analyst`, `admin`.
- **Enforcement**: Server-side JWT re-derived every request via `require_role(["dmo", "gov", "government", "analyst", "admin"])`.
- **Cross-Panel Gates**: Unauthorized tourist or host sessions attempting direct access to `/dmo/*` receive an immediate `HTTP 403 Forbidden`.
