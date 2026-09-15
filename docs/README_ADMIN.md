# 🔧 National Admin Center

> *System-wide control over TravelSathi's 12,601-destination Digital Public Infrastructure*

---

The Admin Center gives system administrators full control over the destination catalog, homestay verification queue, ML pipeline telemetry, and immutable security audit logs. Admins have universal access to all portals for oversight and debugging.

## ✨ What You Can Do

| Feature | What It Does |
|:---|:---|
| 📊 **System Dashboard** | API health, database status, user counts, ML pipeline run status |
| 📋 **Catalog Manager** | CRUD operations on 12,601 destinations — heritage tier, coordinates, scores |
| ✅ **Verification Queue** | Review pending homestay listings, DigiLocker cross-check, approve/reject |
| 🔒 **Tamper-Evident Audit Logs** | Cryptographic SHA-256 hash-chained log (`entry_hash = SHA256(prev_hash + entry)`) with unbroken integrity verification |
| 🏥 **Health Check** | 26-point system audit — database, APIs, ML models, external services |
| 🤖 **Model Telemetry** | Last refresh, hourly token status, model performance metrics |
| 🌐 **Universal Cross-Panel Access** | Admins pass through all route gates (Tourist, Host, DMO/Gov, Admin) for operational oversight |

## 🔄 Hourly Token

Admin dashboard shows the current platform-wide token:

```
tok_hourly_20260915_1100
```

Admins can verify that all portals are synchronized on the same hourly telemetry window.

---

## 📍 Routes

| Page | URL |
|:---|:---|
| Admin Dashboard | `/admin` |
| DMO Admin | `/admin/dmo` |
| System Health | `/admin/health` |
| Moderation | `/admin/moderation` |

**Role**: `admin` (universal access to all panels)

## 🔌 Key API Endpoints

| Method | Endpoint | Purpose |
|:---|:---|:---|
| `GET` | `/api/admin/dashboard` | Dashboard metrics |
| `GET` | `/api/admin/health` | 26-point health check |
| `GET` | `/api/admin/audit-logs` | Security audit log |
| `GET` | `/api/admin/users` | All users |
| `POST` | `/api/admin/verify-listing` | Approve/reject homestay |

## 📁 Files

- Views: `frontend/src/views/admin/AdminDashboardView.tsx`, `frontend/src/views/admin/AdminDMO.tsx`
- Backend: `backend/app/api/admin.py`
- Auth: `backend/app/core/auth_dependencies.py`
- Audit: `backend/app/database/models.py` (AuditLog model)
