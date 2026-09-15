# 🏠 Host Hub

> *Zero-commission direct bookings for India's homestay hosts & eco-hotels*

---

Indian homestay owners lose up to 25% of their income to OTA middlemen. The Host Hub eliminates this entirely — **0% platform commission**, AI-powered pricing, and instant DigiLocker verification so guests trust you from day one.

## ✨ What You Can Do

| Feature | What It Does |
|:---|:---|
| 📊 **Dashboard** | Live bookings, revenue, occupancy, and guest ratings at a glance |
| 📋 **Listings** | Manage multiple properties with photos, amenities, and house rules |
| 💰 **AI Price Co-Pilot** | GradientBoosting model (5-fold test R² = 0.9956, MAE: ₹178.83) suggests optimal nightly rates based on demand, seasonality, and nearby pricing |
| ✅ **Verified Badge** | DigiLocker eKYC verification gives you a trust badge visible to all travelers |
| 💬 **Guest Messaging** | In-app coordination with guests for special requests |
| 🔒 **Zero Commission** | Unlike OTAs (15-25% cuts), TravelSathi takes 0% |
| ⭐ **Fair Reviews** | Only booking-verified guests can review — no anonymous attacks |

## 🔄 Hourly Token

All pricing signals and booking data sync via hourly token:

```
tok_hourly_20260915_1100
```

Ensures your AI pricing recommendations reflect the latest demand patterns across India.

---

## 📍 Routes

| Page | URL |
|:---|:---|
| Host Dashboard | `/host` |
| My Listings | `/host/listings` |
| Price Co-Pilot | `/host/pricing` |

## 🔌 Key API Endpoints

| Method | Endpoint | Purpose |
|:---|:---|:---|
| `GET` | `/api/host/dashboard` | Dashboard metrics |
| `GET` | `/api/host/listings` | All properties |
| `POST` | `/api/host/listings` | Create listing |
| `POST` | `/api/host/apply-price` | AI pricing |
| `GET` | `/api/host/bookings` | Booking requests |

## 📁 Files

- View: `frontend/src/views/host/HostDashboardView.tsx`
- Backend: `backend/app/api/host.py`
- Pricing: `backend/app/services/pricing_service.py`
