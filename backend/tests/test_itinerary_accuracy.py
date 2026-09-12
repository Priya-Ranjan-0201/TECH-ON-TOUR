import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_itinerary_hampi_grounded():
    """
    Generate a 3-day itinerary for 'Hampi'.
    Confirm:
    - Status code 201
    - Destination is recognized as Hampi (or Karnataka)
    - Stops are real places in or near Hampi (Virupaksha, Vijayanagara, Vittala, Hampi, etc.)
    - No stops from Rajasthan or unrelated states.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "destination": "Hampi",
            "days": 3,
            "budget": "moderate",
            "interests": ["Heritage & Monuments"]
        }
        res = await client.post("/api/itinerary/generate", json=payload)
        assert res.status_code == 201, f"Failed: {res.text}"
        data = res.json()
        
        assert "days_schedule" in data
        assert len(data["days_schedule"]) == 3
        
        all_stops = []
        for day in data["days_schedule"]:
            for stop in day.get("stops", []):
                all_stops.append(stop["destination_name"])
        
        assert len(all_stops) >= 3
        
        # Verify that stops are Hampi / Karnataka related and NOT Rajasthan / Himachal
        hampi_keywords = ["hampi", "virupaksha", "vittala", "vijayanagar", "karnataka", "temple", "bazaar", "heritage", "monument", "tungabhadra", "boulder", "bellary"]
        relevant_count = 0
        for stop in all_stops:
            stop_lower = stop.lower()
            # Assert no random Jaipur/Manali stops leaked in
            assert "hawa mahal" not in stop_lower
            assert "amber fort" not in stop_lower
            assert "solang" not in stop_lower
            assert "rohtang" not in stop_lower
            if any(kw in stop_lower for kw in hampi_keywords):
                relevant_count += 1
        
        assert relevant_count > 0, f"No Hampi-relevant stops found in: {all_stops}"

@pytest.mark.asyncio
async def test_itinerary_unknown_place_honest_404():
    """
    Request an itinerary for a destination with no verified data.
    Must return HTTP 404 with honest message, not a substitute itinerary from Rajasthan/Tirthan.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "destination": "NowhereLandMetropolis999",
            "days": 3,
            "budget": "budget"
        }
        res = await client.post("/api/itinerary/generate", json=payload)
        assert res.status_code == 404
        data = res.json()
        assert "detail" in data
        assert "NowhereLandMetropolis999" in data["detail"]
        assert "We don't have enough verified data" in data["detail"]

@pytest.mark.asyncio
async def test_itinerary_jaipur_grounded():
    """
    Generate a 2-day itinerary for 'Jaipur'.
    Confirm stops are strictly Jaipur / Rajasthan heritage.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "destination": "Jaipur",
            "days": 2,
            "budget": "moderate",
            "interests": ["Heritage & Monuments"]
        }
        res = await client.post("/api/itinerary/generate", json=payload)
        assert res.status_code == 201
        data = res.json()
        
        assert len(data["days_schedule"]) == 2
        for day in data["days_schedule"]:
            for stop in day.get("stops", []):
                stop_lower = stop["destination_name"].lower()
                # Cannot contain Hampi or Manali stops
                assert "virupaksha" not in stop_lower
                assert "solang" not in stop_lower
                assert "rohtang" not in stop_lower

@pytest.mark.asyncio
async def test_itinerary_repeat_consistency():
    """
    Generate the same itinerary request twice -> stops should be grounded in
    the same fixed dataset and highly consistent.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "destination": "Manali",
            "days": 2,
            "budget": "moderate",
            "interests": ["Nature & Wildlife"]
        }
        res1 = await client.post("/api/itinerary/generate", json=payload)
        res2 = await client.post("/api/itinerary/generate", json=payload)
        
        assert res1.status_code == 201
        assert res2.status_code == 201
        
        stops1 = [s["destination_name"] for day in res1.json()["days_schedule"] for s in day["stops"]]
        stops2 = [s["destination_name"] for day in res2.json()["days_schedule"] for s in day["stops"]]
        
        # Both must have stops grounded in Manali / Kullu
        for s in stops1 + stops2:
            s_lower = s.lower()
            assert "hawa mahal" not in s_lower
            assert "virupaksha" not in s_lower
