---
name: travelsathi-sih
description: Comprehensive operational cheatsheet and testing reference for the TravelSathi Smart India Hackathon ecosystem.
---

# TravelSathi Smart India Hackathon Operations & Testing Skill

This skill provides step-by-step instructions for running, testing, and verifying the TravelSathi Digital Public Infrastructure (DPI) platform.

## Architecture & Portals

1. **Tourist Portal** (`http://localhost:5173`):
   - AI Travel Twin, Seasonal Explorer, Smart Map, SOS Safety Hub, Client-side Encrypted Group Trips, Split-UPI.
2. **Host Hub** (`http://localhost:5173/host`):
   - 11-step listing wizard, AI Tariff Co-Pilot (MAE ₹178.83, R² 0.9956), bookings manager.
3. **DMO Command Center** (`http://localhost:5173/dmo`):
   - Anti-overtourism telemetry, eco-permit lock/unlock gatekeeper, green circuit rerouting, 14-day festival arrival forecaster (R² 0.9685).
4. **Government Tourism Investment Intelligence** (`http://localhost:5173/gov/tourism-intelligence`):
   - 508-district prioritization, 90.0% Calibrated Confidence, Infrastructure Readiness Index, 4-Quadrant Priority Matrix, Capital Scenario Simulator (₹5-100 Cr), Multi-District Comparison Tool, and Grounded AI Advisor.
   - Isolated workspaces: `?tab=overview`, `?tab=rankings`, `?tab=simulator`, `?tab=compare`, `?tab=all`.
5. **National Admin Center** (`http://localhost:5173/admin`):
   - 12,601 destination catalog, homestay moderation, user roles, SHA-256 tamper-evident audit logs.

## Quick Launch

Execute the interactive Windows batch suite:
```cmd
.\run.bat
```

## Running Automated Test Suites

```bash
# Test Government Tourism Intelligence & Crowd Index Suites
pytest backend/tests/test_govt_suite.py backend/tests/test_crowd_index.py -v

# Test ML models (Pricing, Recommender, Authenticity)
pytest backend/tests/test_all_3_ml_models.py -v

# Test Destination Potential algorithm
pytest backend/tests/test_potential_score.py -v

# Test Cultural Events & 7 Indic languages
pytest backend/tests/test_cultural_events.py -v

# Complete 26-check Master System Audit
python scripts/master_audit_runner.py
```

## Production Build

```bash
cd frontend
npm run build
```
Builds cleanly with 0 TypeScript/Vite errors.
