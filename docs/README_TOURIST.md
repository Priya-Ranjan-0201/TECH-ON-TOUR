# 🧳 Tourist Portal

> *Your AI-powered travel companion across 12,601+ destinations in India*

---

India has over 12,600 verified destinations — ancient temples, Himalayan valleys, coastal paradises, tribal heartlands, and vibrant festival cities. The Tourist Portal puts all of it at your fingertips with intelligent planning, real-time safety, and privacy-first group travel.

## ✨ What You Can Do

| Feature | What It Does |
|:---|:---|
| 🗺️ **Explore** | Browse 12,601 destinations filtered by state, heritage tier, and AI potential score |
| 📋 **Plan Trip** | AI generates your full itinerary — optimized routes in under 150ms |
| 🤖 **Travel Twin** | Your digital companion learns your preferences and recommends journeys |
| 👥 **Group Travel** | Live map sharing with client-side Web Crypto AES-GCM encryption — payloads encrypted in-browser before network transmission |
| 💳 **Split Pay** | UPI-based split checkout across group members |
| 🏥 **SOS Emergency** | One-tap access to 130+ verified hospital facilities + nationwide 24/7 OpenStreetMap emergency locator (108/112) from any page |
| 🌤️ **Weather Match** | Seasonal destination suggestions based on real-time weather |
| 🌐 **7 Languages** | English, Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati |
| ⭐ **Verified Reviews** | Only booking-verified guests can leave reviews — zero fake reviews |
| 🔐 **Privacy Center** | Manage your data, consent, and encryption keys |

## 🔄 Hourly Token

All data is synchronized via TravelSathi's hourly token system:

```
tok_hourly_20260915_1100
```

Every API response carries this token — tourists, hosts, DMOs, and government dashboards all operate on the same data window. Refreshes automatically every hour.

---

## 📍 Routes

| Page | URL |
|:---|:---|
| Home | `/` |
| Explore Catalog | `/explore` |
| Destination Detail | `/destination/:id` |
| Smart Map | `/map` |
| Plan Trip | `/plan` |
| Travel Twin | `/travel-twin` |
| My Trips | `/trips` |
| Group Travel | `/trips/group` |
| Bookings | `/bookings` |
| Wallet | `/wallet` |
| Safety | `/safety` |
| Saved Places | `/saved` |
| Privacy Center | `/privacy` |

## 🔌 Key API Endpoints

| Method | Endpoint | Purpose |
|:---|:---|:---|
| `GET` | `/api/destinations` | Search destinations |
| `GET` | `/api/destinations/:id` | Destination profile |
| `POST` | `/api/itinerary/generate` | AI itinerary |
| `GET` | `/api/weather/:city` | Weather data |
| `GET` | `/api/hospitals/nearby` | Nearest hospitals |
| `POST` | `/api/groups/create` | Create group trip |

## 📁 Files

- Views: `frontend/src/views/` and `frontend/src/views/tourist/`
- Components: `frontend/src/components/`
- Locales: `frontend/src/locales/`
