import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_search_manali_repeatability():
    """
    Search 'Manali' twice in a row, confirm identical results both times,
    and confirm every result is actually related to Manali / Himachal Pradesh.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res1 = await client.get("/api/destinations?query=Manali")
        assert res1.status_code == 200
        data1 = res1.json()
        
        res2 = await client.get("/api/destinations?query=Manali")
        assert res2.status_code == 200
        data2 = res2.json()
        
        # Must be identical across calls
        assert len(data1["results"]) > 0
        assert data1["results"] == data2["results"]
        
        # Every result must have Manali or Himachal Pradesh in name/city/state
        for item in data1["results"]:
            combined = f"{item['name']} {item.get('city', '')} {item.get('state', '')}".lower()
            assert "manali" in combined or "himachal" in combined, f"Irrelevant result returned: {item['name']}"

@pytest.mark.asyncio
async def test_search_manali_vs_jaipur_disjoint():
    """
    Search 'Manali' then 'Jaipur', confirm the two result sets are completely
    different and each is actually about that city/state.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res_manali = await client.get("/api/destinations?query=Manali")
        res_jaipur = await client.get("/api/destinations?query=Jaipur")
        
        assert res_manali.status_code == 200
        assert res_jaipur.status_code == 200
        
        manali_names = {item["name"] for item in res_manali.json()["results"]}
        jaipur_names = {item["name"] for item in res_jaipur.json()["results"]}
        
        assert len(manali_names) > 0
        assert len(jaipur_names) > 0
        assert manali_names.isdisjoint(jaipur_names), "Manali and Jaipur results overlap!"
        
        for item in res_jaipur.json()["results"]:
            combined = f"{item['name']} {item.get('city', '')} {item.get('state', '')}".lower()
            assert "jaipur" in combined or "rajasthan" in combined

@pytest.mark.asyncio
async def test_search_unknown_place_honest_empty():
    """
    Search for a place not in database. Must return empty results and clear message,
    never fall back to showing random places.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/destinations?query=AtlantisCityFake123")
        assert res.status_code == 200
        data = res.json()
        assert len(data["results"]) == 0
        assert "message" in data
        assert "AtlantisCityFake123" in data["message"]
