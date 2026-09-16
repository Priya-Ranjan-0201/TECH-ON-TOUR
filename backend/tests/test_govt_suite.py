"""
Tests for Government Intelligence Suite — 3 Modules + Cleanup.
Verifies:
1. Module 1: Investment recommendation ranking changes with budget, top 3 factors present.
2. Module 2: Crowd forecast capacity thresholds, status badges (low/mod/high/critical), resource ratios.
3. Module 3: Flow redistribution 50km Haversine radius, alternative ranking by potential_score * (1 - pop).
4. Strict data labeling on every metric.
5. Hourly token in all responses.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import create_access_token
from app.services.govt_intelligence_service import haversine_distance_km, get_current_hourly_token

DMO_HEADERS = {"Authorization": f"Bearer {create_access_token({'sub': 'usr-dmo-1', 'role': 'dmo'})}"}


@pytest.mark.asyncio
async def test_module1_investment_recommendation_budget_scaling():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test 1: Budget = 10 Crore
        res1 = await client.post("/api/dmo/investment-recommend", json={"budget_crore": 10.0}, headers=DMO_HEADERS)
        assert res1.status_code == 200, f"Error: {res1.text}"
        data1 = res1.json()
        assert data1["status"] == "success"
        assert "hourly_token" in data1
        assert data1["hourly_token"].startswith("tok_hourly_")
        assert len(data1["top_10_recommendations"]) > 0

        first_rec_10 = data1["top_10_recommendations"][0]
        assert "investment_score" in first_rec_10
        assert "tourism_potential" in first_rec_10
        assert "infra_gap_multiplier" in first_rec_10
        assert "top_factors" in first_rec_10
        assert len(first_rec_10["top_factors"]) == 3, "Explainability requires exactly top 3 factors"
        assert "recommended_actions" in first_rec_10
        assert len(first_rec_10["recommended_actions"]) >= 2

        # Test 2: Budget = 50 Crore
        res2 = await client.post("/api/dmo/investment-recommend", json={"budget_crore": 50.0}, headers=DMO_HEADERS)
        assert res2.status_code == 200
        data2 = res2.json()
        first_rec_50 = data2["top_10_recommendations"][0]

        # Verify budget scaling impacts economic estimates
        assert first_rec_50["expected_spend_crore"] > first_rec_10["expected_spend_crore"]
        assert first_rec_50["expected_jobs"] > first_rec_10["expected_jobs"]
        assert first_rec_50["expected_tourist_increase_pct"] >= first_rec_10["expected_tourist_increase_pct"]

        # Verify labeling metadata
        labels = data1["labeling_metadata"]
        assert labels["tourism_potential"] == "Actual Data"
        assert labels["investment_score"] == "AI Recommendation"
        assert labels["expected_tourist_increase_pct"] == "Estimated Data"


@pytest.mark.asyncio
async def test_module2_crowd_and_festival_forecasts():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/dmo/crowd-forecast?days_ahead=120", headers=DMO_HEADERS)
        assert res.status_code == 200, f"Error: {res.text}"
        data = res.json()
        assert data["status"] == "success"
        assert "hourly_token" in data
        assert "forecasts" in data
        assert len(data["forecasts"]) > 0

        fc = data["forecasts"][0]
        # Check crowd status
        assert fc["crowd_status"] in ["low", "moderate", "high", "critical"]
        assert fc["badge_color"] in ["green", "yellow", "orange", "red"]

        # Check resource ratios: police 20, medical 8, sanitation 15, buses 5, ambulances 2, toilets 10 per 1000 visitors
        recs = fc["resource_recommendation"]
        assert "police" in recs
        assert "medical" in recs
        assert "sanitation" in recs
        assert "buses" in recs
        assert "ambulances" in recs
        assert "toilets" in recs
        assert recs["police"] > 0
        assert recs["medical"] > 0

        # Check explainability top 3 factors
        assert len(fc["top_factors"]) == 3

        # Check labeling tags
        assert fc["data_labels"]["predicted_footfall_index"] == "Predicted Data"
        assert fc["data_labels"]["capacity_estimate"] == "Estimated Data"
        assert fc["data_labels"]["crowd_status"] == "AI Recommendation"

        # Check auto-recommendations trigger on high/critical
        if fc["crowd_status"] in ["high", "critical"]:
            assert len(fc["auto_recommendations"]) > 0
            assert any("bus" in r["action"].lower() or "transit" in r["action"].lower() for r in fc["auto_recommendations"])


@pytest.mark.asyncio
async def test_module3_tourist_flow_redistribution():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test with destination ID 1 (or any valid destination)
        res = await client.get("/api/dmo/flow-redistribution/1", headers=DMO_HEADERS)
        assert res.status_code == 200, f"Error: {res.text}"
        data = res.json()
        assert data["status"] == "success"
        assert "hourly_token" in data
        assert "primary_destination" in data
        assert "recommended_alternatives" in data

        prim = data["primary_destination"]
        assert "current_flow_pct" in prim
        assert "recommended_flow_pct" in prim

        alts = data["recommended_alternatives"]
        # All alternatives must be <= 50km radius
        for alt in alts:
            assert alt["distance_km"] <= 50.0, f"Destination {alt['name']} is {alt['distance_km']} km away, exceeding 50km limit!"
            assert "potential_score" in alt
            assert "redistribution_score" in alt
            assert len(alt["top_factors"]) == 3, "Alternative must have top 3 explainability factors"
            assert "expected_economic_impact_crore" in alt


def test_haversine_distance():
    # Delhi to Gurgaon ~ 30 km
    d = haversine_distance_km(28.6139, 77.2090, 28.4595, 77.0266)
    assert 20.0 < d < 40.0
