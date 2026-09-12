# TravelSathi Defect Tracking & Bug Report
**Audit Date**: September 2026  
**Auditor**: Antigravity QA Automation  
**Total Confirmed Defects**: 1  

---

## BUG-001 — Unhandled Runtime Exception on Interactive Smart Map (`/map`)

* **Defect ID**: `BUG-001`
* **Title**: `Invalid LatLng object: (undefined, undefined)` in React-Leaflet MapContainer on `/map`
* **Severity**: **CRITICAL**
* **Status**: **OPEN / CONFIRMED REPRODUCIBLE**
* **Feature Area**: Interactive GIS Smart Map
* **Impacted Route**: `/map`
* **Impacted File**: [`frontend/src/views/SmartMapView.tsx`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/SIH/frontend/src/views/SmartMapView.tsx#L60-L80)
* **Detected By**: `frontend/tests/maps/maps.spec.ts:5:3`

### Description & Reproduction
When users navigate to `/map`, the frontend fetches destination points from `/api/destinations/map-points?limit=150`.
The backend provides coordinates under `p.lat` and `p.lng`, while `SmartMapView.tsx` extracts `p.latitude` and `p.longitude`. This causes `lat` and `lng` to evaluate to `undefined`. When Leaflet attempts to render pins via `<Marker position={[d.lat, d.lng]}>`, Leaflet throws:
```text
Error: Invalid LatLng object: (undefined, undefined)
```
This crashes the component tree and leaves the map unrendered.

### Steps to Reproduce
1. Start frontend and backend servers.
2. Navigate to `http://localhost:5173/map`.
3. Observe map area fails to initialize with an unhandled exception in the browser console.

### Recommended Fix
In `frontend/src/views/SmartMapView.tsx` lines 70–71:
```javascript
lat: p.latitude ?? p.lat,
lng: p.longitude ?? p.lng,
```
and filter out items with non-numerical coordinates before rendering.
