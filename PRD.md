# 🏛️ TravelSathi — Project Requirements Document (PRD)
### *Unified Digital Public Infrastructure (DPI) for Indian Tourism, Hospitality & Cultural Heritage*

**Version:** 2.0.0 (Master Spec)  
**Target Event:** Smart India Hackathon (SIH) — National Grand Finale  
**Core Dataset:** Tech On Tour Knowledge Graph (12,293 Verified Destinations across 36 States/UTs, 737 Districts)  
**Status:** Approved for Live Build & Hackathon Demo  

---

## 1. Problem Statement
India's tourism and hospitality industry ($200B+) suffers from severe structural fractures:
1. **High OTA Commissions (15%–30%):** Monopolistic Online Travel Agencies charge exorbitant commissions on small-to-mid hotels, rural homestays, and local guides, extracting wealth out of local economies.
2. **Overtourism vs. Hidden Gem Paradox:** 92% of tourist footfall is concentrated in just 2% of commercialized hubs (Shimla, Manali, Goa, Agra), causing ecological degradation and water crises, while 12,000+ pristine cultural destinations remain invisible.
3. **Fake Reviews & Trust Deficit:** Up to 35% of reviews are unverified, exposing travelers to dynamic pricing scams, unhygienic stays, and safety risks.
4. **Digital & Linguistic Divide:** Rural tribal homestay operators (under PM-JUGA/PM-JANMAN schemes) and local guides are excluded by English-first, complex digital smartphone apps.
5. **Lack of Integrated DPI:** Tourism lacks an open network allowing multi-vendor trip packaging (homestay + guide + cab) with instant split settlements.

---

## 2. Vision
TravelSathi is an AI-first, three-sided **Digital Public Infrastructure (DPI)** platform operating on a **"Reverse Marketplace + AI Travel Twin"** model:
*   **For Tourists:** An **AI Travel Twin** that curates personalized, multi-day, safety-audited itineraries, balances famous sights with uncrowded hidden gems, and enables direct booking with verified hosts—cutting commissions to **3% to 5%**.
*   **For Local Hosts & Artisans:** A zero-subscription **Seller Hub** with voice-first vernacular onboarding (Bhashini-powered), a **Reverse Marketplace** where hosts bid on tourist itineraries, and an automated AI pricing co-pilot.
*   **For State Tourism Boards & DMOs:** An interactive **Command Center** featuring live footfall density heatmaps, predictive saturation indexes, and dynamic eco-permits to mitigate overtourism.

---

## 3. Stakeholder Personas
*   **Aparna Sen (27, Bengaluru):** Solo female explorer seeking off-beat heritage circuits (Lepakshi, Gandikota). Needs verified safe homestays, fair local transit fares, and authentic reviews.
*   **Ramesh Gond (42, Bastar, Chhattisgarh):** Tribal homestay host under the PM-JUGA scheme and Dhokra artisan. Speaks Gondi/Chhattisgarhi. Needs voice-guided vernacular listing, zero OTA commission, and direct UPI payouts.
*   **Dr. Amit Sharma (51, Director of Tourism, HP):** Manages regional crowd influxes in Manali/Shimla. Needs real-time density heatmaps and dynamic eco-permits to disperse crowds into secondary valleys (Jibhi, Spiti).

---

## 4. Grounding Dataset: Tech-On-Tour National Knowledge Graph
*   **12,293 Verified Destinations** across all **28 States and 8 Union Territories** (737 districts).
*   **100% Zero-Null Guarantee** across all 147,516 data cells in `data/places.csv`.
*   **17,891 Co-Search Graph Edges** (`data/search_graph/related_searches.csv`).
*   **Normalized 12-Column Schema:** `id, name, state, category, latitude, longitude, price_range, rating, review_count, description, best_season, image_url`.

---

## 5. Master Feature Matrix (F-01 to F-14)

| ID | Feature Name | Description | Persona | Hackathon MVP Scope | Phase |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **F-01** | **AI Travel Twin** | Synthesizes multi-day itineraries from duration, budget, and interest tags using Gemini RAG. | Tourist | Working Gemini 1.5 Flash + ChromaDB RAG with interactive map. | **Phase 1 (MVP)** |
| **F-02** | **Reverse Marketplace** | Tourists post trip RFPs; local verified hosts submit direct bids with custom perks. | Tourist, Host | Working RFP creation, host bid submission, acceptance in DB. | **Phase 1 (MVP)** |
| **F-03** | **Anti-Overtourism Engine** | Algorithmic crowd dispersion replacing crowded POIs with verified hidden gems. | Tourist, Govt | Dynamic suggestion pills and crowd saturation warnings. | **Phase 1 (MVP)** |
| **F-04** | **Verified-Booking Trust Layer** | Restricts reviews strictly to completed booking IDs; calculates sentiment score. | Tourist, Host | Active review submission tied to booking ID; sentiment badge. | **Phase 1 (MVP)** |
| **F-05** | **Host Hub & Dynamic Pricing** | Seller dashboard with room CRUD and rule-based seasonal dynamic pricing co-pilot. | Host | Complete CRUD dashboard; seasonal pricing tips. | **Phase 1 (MVP)** |
| **F-06** | **Unified Split-UPI Checkout** | Compiles single cart into multi-VPA UPI Deep Link (Host: 97%, Platform: 3%). | Tourist, Host | Functional checkout UI generating deep-link UPI payload. | **Phase 1 (MVP)** |
| **F-07** | **Safety & Weather Re-Router** | Safety score index (0-100) + dynamic weather contingency alerts adjusting outdoor POIs. | Tourist | Live safety score badge + weather-aware itinerary tags. | **Phase 1 (MVP)** |
| **F-08** | **Heritage AR Lens** | WebXR / Three.js monument viewer with historical context and audio narration. | Tourist | Isolated 3D hero canvas with automatic 2D fallback. | **Phase 1 (MVP)** |
| **F-09** | **DMO Command Center** | Government portal with regional footfall heatmaps and eco-permit quota toggles. | Govt Board | Leaflet choropleth/cluster heatmap with permit lock toggle. | **Phase 1 (MVP)** |
| **F-10** | **Gamified Eco-Badges** | Awards "Cultural Explorer" & "Eco-Sathi" badges for visiting off-beat spots. | Tourist | Badges unlocked in traveler profile upon booking off-beat POIs. | **Phase 1 (MVP)** |
| **F-11** | **IndicVoice AI Concierge** | Floating conversational assistant in 5 Indian languages with voice-to-text. | Tourist, Host | Web Speech API speech-to-text + Gemini vernacular prompt responses. | **Phase 2 (Core)** |
| **F-12** | **TransitGuard Fair-Fare** | Real-time GPS ride tracker checking municipal meter rates against route cards. | Tourist | Pre-calculated route distance matrix with rate comparison. | **Phase 2 (Core)** |
| **F-13** | **CraftGuard AI Authenticator** | Computer vision classifier verifying GI-tagged handicrafts (Dhokra, Pashmina). | Tourist, Artisan| ResNet-152 deep learning classification model API. | **Phase 3 (Adv)** |
| **F-14** | **Smart Homestay Vision Audit** | Multimodal AI scanner analyzing host walkthrough videos to verify sanitation. | Host, Tourist | LLaVA multimodal video analyzer grading room cleanliness. | **Phase 3 (Adv)** |

---

## 6. Non-Functional Requirements & Engineering Benchmarks
*   **Catalog Query Latency:** $\le 50\text{ ms}$ across all 12,293 destinations.
*   **AI Stream Latency:** First token from Gemini 1.5 Flash delivered in $\le 1.2\text{ seconds}$.
*   **Zero-Cost Infrastructure:** Runs 100% on free tiers (Vercel, Render, Supabase, Google Gemini Free Tier).
*   **Graceful Degradation:** Automatic switch to local rule-based graph heuristics if external APIs time out—zero blank screens.
*   **DPDP Act 2023 Compliance:** Zero raw Aadhaar storage; tokenized ID verification; PII encrypted with AES-256-GCM.

---

## 7. 5-Minute Hackathon Live Pitch Script

| Time | Segment | What the Judges See | Key Talking Point |
| :---: | :--- | :--- | :--- |
| **0:00 - 1:00** | **The Crisis & Value Proposition** | Problem slide: 30% OTA commission vs. crowded Manali photos. Show 12,293-destination Tech-On-Tour graph. | *"India's tourism generates $200B, but foreign OTAs extract 30% while 92% of tourists crowd 2% of spots. We present TravelSathi: India's first DPI for tourism that cuts commissions to 3% and stops overtourism."* |
| **1:00 - 2:15** | **The AI Travel Twin in Action** | Live prompt: 3-day Himachal trip for solo explorer. Watch Gemini stream in 2s, balancing Rohtang with a hidden gem in Naggar. | *"Our Travel Twin doesn't hallucinate; it queries our zero-null knowledge graph of 12,293 verified Indian destinations with real-time weather adjustments."* |
| **2:15 - 3:15** | **Reverse Marketplace & Host Hub** | Switch to Host tab. Ramesh from Bastar receives a travel request and submits a bid using the vernacular interface. | *"Instead of hosts waiting for OTAs, our Reverse Marketplace empowers rural hosts to bid directly on traveler demand, keeping 97% of the revenue in village hands."* |
| **3:15 - 4:15** | **Split-UPI Checkout & Trust Layer** | Click single checkout splitting ₹4,000 between homestay, taxi, and guide. Show verified-only review engine. | *"A unified split checkout built on India's UPI rails. Direct money to local creators with zero middlemen holding escrow."* |
| **4:15 - 5:00** | **DMO Command Center & Wrap-up** | Switch to Government view. Live crowd density heatmap, one-click eco-permit lock diverting traffic. | *"For the first time, government tourism boards have a real-time steering wheel to prevent disasters and build sustainable tourism across India."* |

---
*PRD finalized for Smart India Hackathon Grand Finale execution.*
