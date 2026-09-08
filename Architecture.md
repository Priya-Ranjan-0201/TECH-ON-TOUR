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
| `POST` | `/api/chat/concierge` | Multilingual AI Chatbot | `{ "reply": "...", "safety_advisory": "Clear" }` |
| `GET` | `/api/host/:id/dashboard`| Host Bookings & Revenue | `{ "active_bids": [...], "revenue": 24500 }` |

---

## 5. The Five Core Architectural Decisions
1. **FastAPI (Python) over Node.js:** Python is native for Gemini RAG, ChromaDB, PostGIS, and HuggingFace NLP.
2. **Supabase over Raw Postgres VM:** Free hosted Postgres + PostGIS + Auth with zero DevOps overhead.
3. **Zero-Leak Backend Proxy:** React client communicates only with `/api/*`; zero secret keys in browser bundles.
4. **Three.js Isolated to Hero with 2D Fallback:** Strict confinement to `Hero3DScene.jsx` with automatic 2D fallback.
5. **Pre-Computed Offline Embeddings & Circuit Breaker:** Local vector cache guarantees instant response on venue WiFi.

---
*Technical Architecture finalized for Smart India Hackathon Grand Finale execution.*
