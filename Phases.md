# 🗺️ TravelSathi — Master Phased Implementation Roadmap
### *Step-by-Step Engineering Execution Plan: From Hackathon MVP to National DPI*

**Version:** 2.0.0 (Master Roadmap)  
**Target Event:** Smart India Hackathon (SIH) — National Grand Finale  
**Guiding Principle:** **Strict Phase Discipline** — No phase begins until the preceding phase's exit criteria are 100% met and verified.  
**Status:** Approved for Live Build  

---

## 🎯 3-Tier Hackathon Execution Priority & Timeboxing (What & How)

> [!IMPORTANT]
> **The One Rule That Matters Most:**
> **A fully working Tier 1 (5 features) beats a half-broken Tier 1+2+3.**
> Judges spend 5 minutes with you — a smooth, confident demo of a focused product wins every time. If you are behind schedule at any checkpoint, cut Tier 2/3 features first; never compromise Tier 1 stability.

### TIER 1 — MUST BUILD (Core Demo Loop, ~70% Time, 15–18 Hours Total)
*These 5 features constitute the entire live demo loop. Nothing else matters if these do not work smoothly.*

1. **AI Itinerary Generator (Travel Twin)** `[4–6 Hours]` — *Priority #1*
   * *What:* Destination + budget + interests + dates $\to$ structured day-by-day itinerary with timeline UI.
   * *How:* React form $\to$ Gemini API 1.5 Flash structured JSON prompt $\to$ Parse & render in `ItineraryTimeline` $\to$ Store in Supabase `itineraries` table.
2. **Destination/Hotel Search & Direct Booking** `[3–4 Hours]`
   * *What:* Search verified destinations/homestays, view details, simulated booking.
   * *How:* Seed `destinations_master` (from Tech-On-Tour 12k dataset / OSM) $\to$ Grid cards + detail modal $\to$ Razorpay test mode checkout $\to$ Insert into `bookings` table.
3. **AI Multilingual Concierge Chatbot** `[2–3 Hours]`
   * *What:* Chat widget answering travel questions natively in Hindi/English.
   * *How:* Chat UI (message list + input) $\to$ Gemini API with conversation history + India travel system prompt (frame Bhashini as production upgrade).
4. **Review/Sentiment Trust Layer** `[2–3 Hours]`
   * *What:* Reviews show "Verified Tourist" badge + AI authenticity score.
   * *How:* Offline pre-computed sentiment score (HuggingFace DistilBERT) + heuristic authenticity score in `reviews_training` table. **Pre-computed is zero-latency and 100% safe on stage.**
5. **Host Dashboard & Dynamic Pricing Co-Pilot** `[2–3 Hours]`
   * *What:* Host portal showing incoming bookings + rule-based pricing suggestions.
   * *How:* Supabase queries filtered by `host_id` $\to$ Rule-based pricing (+15% for upcoming weekends/festivals via Calendarific/date logic), framed honestly as "MVP heuristic with XGBoost in production roadmap."

---

### TIER 2 — SHOULD BUILD (Adds Real Wow-Factor, ~10–14 Hours Total)
*Build these strictly in order (6 $\to$ 10) only after Tier 1 is fully functional and stable.*

6. **Hidden Gems / Anti-Overtourism Suggestions** `[1–2 Hours]`
   * *How:* Curated content mapping table: "Instead of X, try Y (60% less crowded)." Rendered as a badge/card.
7. **Safety Score Map Layer** `[1–2 Hours]`
   * *How:* Pre-computed NCRB/OpenCity normalized 0–100 score displayed as a color-coded badge on destination cards and map markers.
8. **Crowd/Weather-Aware Itinerary Adjustment** `[2 Hours]`
   * *How:* Real-time OpenWeatherMap API call fed into Gemini prompt ("if raining on day 2, prioritize indoor heritage sites") + live adjustment banner.
9. **AR Heritage Lens (Lightweight Info-Card Version)** `[3–5 Hours]`
   * *How:* Camera scan button points at monument placard $\to$ bottom-sheet modal with Gemini/Wikipedia historical narrative + Web Speech TTS audio narration.
10. **Sustainability/Explorer Badges (Gamification)** `[1–2 Hours]`
    * *How:* Gamified points for booking homestays or visiting hidden gems $\to$ stored in `user_badges` table $\to$ displayed on profile.

---

### TIER 3 — ROADMAP ONLY (Do NOT Build Live — Pitch Deck Slides Only)
*Designed and architected, but presented as PPT slides to prevent hackathon time sinks.*

11. **Voice IVR Booking (Twilio + Whisper):** Present telephony & Bhashini acoustic transfer flow diagram.
12. **Govt Analytics Dashboard:** Build only a static single-page with 2–3 pre-rendered Chart.js charts (footfall trend + sentiment pie).
13. **Real DigiLocker eKYC:** Present UI mockup of "Verified via DigiLocker" badge with sandbox-ready architecture.
14. **Group Trip Voting / Expense Split:** Present in Future Scope slide.
15. **True Blockchain Ledger / ONDC Protocol:** Present in 2–3 Year National DPI Roadmap slide.

---

### 👥 Recommended 4-Person Team Split

| Team Member | Domain Ownership | Key Deliverables |
| :--- | :--- | :--- |
| **Person 1 (AI / Backend)** | AI Services & RAG | Gemini Itinerary Generator, Concierge Chatbot, Pre-computed Review Sentiment |
| **Person 2 (Backend / DB)** | Supabase & Transactions | Database schema, Booking flow, Razorpay test checkout, Host dashboard APIs |
| **Person 3 (Frontend)** | UI/UX & Client Shell | Theme 1 Heritage Earth screens (Search, Itinerary timeline, Booking modal, Chatbot) |
| **Person 4 (Data / Pitch)** | Data Prep & Presentation | 12k dataset seeding, NCRB/Weather data, Pitch Deck, 270s demo rehearsal, Static Govt charts |

---

### ⏱️ 36-Hour Hackathon Build Schedule

*   **Hours 0–4:** Setup — Scaffolding, Supabase PostGIS setup, seed `destinations_master`, Gemini keys, Theme 1 CSS tokens.
*   **Hours 4–10:** Build Tier 1 features #1 & #2 (Itinerary generator + Booking flow) — verify end-to-end loop.
*   **Hours 10–16:** Build Tier 1 features #3, #4, #5 (Chatbot, Reviews, Host dashboard).
*   **Hours 16–20:** Polish UI to match Theme 1, eliminate bugs in Tier 1 core loop.
*   **Hours 20–28:** Build Tier 2 features sequentially (#6 Hidden Gems $\to$ #7 Safety $\to$ #8 Weather $\to$ #9 AR-lite $\to$ #10 Badges) — cut remaining if time expires.
*   **Hours 28–32:** Static Govt Analytics view (#12), finalize 12-slide Pitch Deck.
*   **Hours 32–34:** 270s Live Demo script rehearsals + offline fallback caching validation.
*   **Hours 34–36:** Rest, buffer, and final pitch alignment.

---

## Track A: Hackathon Grand Finale Sprint (Phases 0–11)

### Phase 0: Workspace Scaffolding & Design System Foundation
*   Scaffold directory tree (`frontend/`, `backend/`, `data/`).
*   Create `.env.example` in both repositories listing all required keys.
*   Implement `frontend/src/styles/theme.css` with Theme 1: Heritage Earth CSS tokens.
*   **Exit Criteria:** Both frontend and backend boot locally without errors.

### Phase 1: Database Bootstrap & Tech-On-Tour 12k Seeding
*   Execute PostGIS DDL and GIST indexes in Supabase SQL editor.
*   Run `seed_destinations.py` to ingest 12,293 destinations from `data/places.csv`.
*   Seed sample verified reviews and tag 20 anti-overtourism hidden gems.
*   **Exit Criteria:** `SELECT COUNT(*)` returns 12,293 with 0 null geometries; spatial queries run in $<25\text{ms}$.

### Phase 2: Core Backend REST & PostGIS Spatial APIs
*   Build `/api/destinations`, `/api/destinations/:id`, `/api/destinations/nearby`, `/api/weather`, `/api/safety-score`.
*   **Exit Criteria:** All 5 routes return valid JSON; clean error envelopes on invalid inputs.

### Phase 3: Frontend Shell, Heritage Design & 2D Hero
*   Build `App.jsx` routing and shared UI components (`Button`, `Card`, `Badge`, `LoadingSpinner`, `EmptyState`).
*   Build `HeroFallback2D.jsx` with glassmorphic cards and search pill.
*   **Exit Criteria:** Navigable, responsive shell matching Theme 1 tokens on desktop and mobile.

### Phase 4: Search, Catalog Discovery & Spatial Filtering
*   Build `Explore.jsx` with state dropdown (36 States/UTs), category pills, and price tier filter.
*   Build `DestinationCard.jsx` and `DestinationDetailModal.jsx` with authentic Wikimedia photos.
*   **Exit Criteria:** Selecting "Himachal Pradesh" displays 245 verified places in $<100\text{ms}$.

### Phase 5: AI Travel Twin & Weather-Aware Itinerary Generator
*   Build `rag_service.py` with Gemini 1.5 Flash + ChromaDB RAG.
*   Implement JSON parse retry + deterministic offline fallback for every state.
*   Build `Plan.jsx` wizard, `ItineraryTimeline.jsx`, and `ItineraryMap.jsx` (Leaflet.js).
*   **Exit Criteria:** Multi-day itinerary renders in $\le 3.5\text{s}$; fallback renders if Gemini is severed.

### Phase 6: Reverse Marketplace & Host Seller Hub
*   Build tourist "Convert Itinerary to Travel RFP" (`POST /api/marketplace/rfp`).
*   Build `HostHub.jsx` displaying district leads with 1-click bid modal (`POST /api/marketplace/bid`).
*   Implement AI Dynamic Pricing Co-Pilot (`pricing_service.py`) using festival calendars.
*   **Exit Criteria:** Complete RFP $\to$ Bid $\to$ Accept loop persists across hard refreshes (`Ctrl + F5`).

### Phase 7: Transaction Engine & Unified Split-UPI Checkout
*   Build `upi_service.py` generating multi-VPA UPI Deep Link URLs.
*   Build `SplitCheckoutModal.jsx` itemizing host (97%), guide, driver, and platform fee (3%).
*   Build `VerifiedReviewForm.jsx` gated by confirmed `booking_id` with NLP sentiment rating.
*   **Exit Criteria:** Checkout itemizes splits; unverified reviews return HTTP 403.

### Phase 8: Conversational Concierge & IndicVoice Assistant
*   Build `/api/chat/concierge` with streaming response and 6-message rolling history.
*   Build `FloatingConcierge.jsx` with Web Speech API audio hook in Hindi and English.
*   **Exit Criteria:** Chatbot answers 5 varied queries without crashing; voice-to-text works natively.

### Phase 9: DMO Command Center & Anti-Overtourism Engine
*   Build `AdminDMO.jsx` with Leaflet tourist density heatmap and overtourism saturation index.
*   Build "Dynamic Eco-Permit Gatekeeper" switch that diverts new queries to secondary circuits.
*   **Exit Criteria:** Toggling permit lock on Manali redirects new queries to Jibhi/Tirthan.

### Phase 10: 3D Heritage Hero Upgrade & Gamification
*   Build `Hero3DScene.jsx` (Three.js canvas) with automatic fallback to `HeroFallback2D.jsx`.
*   Build digital explorer badges ("Hidden Gem Pioneer", "Eco-Sathi").
*   **Exit Criteria:** 3D renders at 60 FPS; simulated WebGL loss falls back smoothly.

### Phase 11: End-to-End Stress Testing & 5-Minute Pitch Rehearsal
*   Run venue WiFi throttling test (Slow 3G) and offline circuit breaker test.
*   Conduct two full timed run-throughs of the 5-Minute Pitch Script.
*   **Exit Criteria:** Zero unhandled errors; pitch fits within 4:30; declared **Grand Finale Ready**.

---

## Track B: Post-Hackathon National DPI Scale (Phases 12–14)
*   **Phase 12 (Month 1):** Bhashini Dedicated Neural IVR Pipeline for non-smartphone tribal hosts.
*   **Phase 13 (Month 2):** Live ONDC Network Protocol Federation (Beckn) with automated bank nodal escrow splits.
*   **Phase 14 (Month 3):** Edge Computer Vision (CraftGuard GI verification + LLaVA homestay sanitation audit).

---
*Roadmap finalized for Smart India Hackathon Grand Finale execution.*
