import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import select, func

from app.main import app
from app.database.connection import async_session_maker
from app.database.models import CrowdIndex, DestinationMaster, DestinationInteraction
from app.services.crowd_index_service import (
    compute_and_persist_crowd_index,
    get_latest_crowd_index,
    fetch_trend_score
)

client = TestClient(app)


@pytest.mark.asyncio
async def test_crowd_index_schema_and_compute():
    """Verify crowd_index table calculation from real destination interactions and trend scores."""
    async with async_session_maker() as session:
        # Run calculation
        run_time = datetime.now(timezone.utc)
        result = await compute_and_persist_crowd_index(session, run_time)
        assert result["total_destinations"] > 0
        assert "critical" in result["level_counts"]
        assert "low" in result["level_counts"]

        # Verify a destination in the crowd_index table
        stmt = select(CrowdIndex).where(CrowdIndex.destination_id == 1).order_by(CrowdIndex.computed_at.desc()).limit(1)
        row = (await session.execute(stmt)).scalars().first()
        assert row is not None
        assert row.destination_id == 1
        assert 0.0 <= row.crowd_index <= 100.0
        assert row.crowd_level in ("low", "moderate", "high", "critical")
        assert 0.0 <= row.trend_score <= 1.0


@pytest.mark.asyncio
async def test_pytrends_fallback_resilience():
    """Verify that even on non-existent or failing queries, trend score returns 0.5 without crashing."""
    score = fetch_trend_score("NonExistentPlaceXYZ12345", "UnknownState")
    assert score == 0.5


def test_destination_detail_returns_crowd_index():
    """Verify GET /api/destinations/{id} returns crowd_index and crowd_level."""
    res = client.get("/api/destinations/1")
    assert res.status_code == 200
    data = res.json()
    dest = data["destination"]
    assert "crowd_index" in dest
    assert "crowd_level" in dest
    assert dest["crowd_level"] in ("low", "moderate", "high", "critical")


from app.core.security import create_access_token


def test_flow_redistribution_reads_crowd_index():
    """Verify flow-redistribution module reads crowd_index and honest label."""
    dmo_token = create_access_token({"sub": "usr-dmo-1", "role": "dmo"})
    res = client.get("/api/dmo/flow-redistribution/1", headers={"Authorization": f"Bearer {dmo_token}"})
    assert res.status_code == 200
    data = res.json()
    primary = data["primary_destination"]
    assert "crowd_index" in primary
    assert "crowd_level" in primary
    assert "TravelSathi Crowd Index — derived from platform activity + search trend data, refreshed hourly" in primary["crowd_source"]
