import time
import pytest
from sqlalchemy import select, func
from app.database.connection import async_session_maker
from app.database.models import DestinationMaster, Homestay, Guide, AntiOvertourismPair
from app.services.gis_service import gis_service


@pytest.mark.anyio
async def test_destinations_record_count():
    """Verify exactly 12,293 destinations from Tech-On-Tour exist."""
    async with async_session_maker() as session:
        result = await session.execute(select(func.count()).select_from(DestinationMaster))
        count = result.scalar()
        assert count == 12293, f"Expected 12,293 destinations, found {count}"


@pytest.mark.anyio
async def test_zero_null_coordinates():
    """Verify that 0 destinations have null or NaN coordinates."""
    async with async_session_maker() as session:
        result = await session.execute(
            select(func.count()).select_from(DestinationMaster).where(
                (DestinationMaster.latitude == None) | (DestinationMaster.longitude == None)
            )
        )
        null_count = result.scalar()
        assert null_count == 0, f"Found {null_count} destinations with null coordinates"


@pytest.mark.anyio
async def test_state_coverage():
    """Verify broad geographic reach across Indian States & UTs."""
    async with async_session_maker() as session:
        result = await session.execute(
            select(func.count(func.distinct(DestinationMaster.state)))
        )
        unique_states = result.scalar()
        assert unique_states >= 30, f"Expected at least 30 states/UTs, found {unique_states}"


@pytest.mark.anyio
async def test_spatial_proximity_benchmark():
    """
    Benchmark spatial query performance:
    Must execute in < 25ms and return sorted nearby destinations.
    """
    async with async_session_maker() as session:
        # Tirupati coordinates: 13.6288° N, 79.4192° E
        t_lat, t_lon = 13.6288, 79.4192

        start_time = time.time()
        nearby = await gis_service.find_nearby_destinations(
            session=session,
            lat=t_lat,
            lon=t_lon,
            radius_km=30.0,
            limit=10
        )
        query_time_ms = (time.time() - start_time) * 1000

        print(f"\nSpatial query completed in {query_time_ms:.2f} ms with {len(nearby)} results.")
        assert len(nearby) > 0, "Expected nearby places around Tirupati"
        assert query_time_ms < 25.0, f"Spatial query took {query_time_ms:.2f}ms, exceeding 25ms threshold"

        # Verify ascending distance ordering
        distances = [p["distance_km"] for p in nearby]
        assert distances == sorted(distances), "Results must be sorted by distance ascending"


@pytest.mark.anyio
async def test_pm_juga_tribal_homestays():
    """Verify PM-JUGA tribal homestays are seeded and retrievable."""
    async with async_session_maker() as session:
        result = await session.execute(
            select(Homestay).where(Homestay.is_tribal_pmjuga == True)
        )
        homestays = result.scalars().all()
        assert len(homestays) >= 5, "Expected at least 5 PM-JUGA tribal homestays"

        bastar_stay = next((h for h in homestays if h.district == "Bastar"), None)
        assert bastar_stay is not None, "Bastar tribal homestay must exist"
        assert bastar_stay.sanitation_trust_score >= 90
        assert bastar_stay.is_verified is True


@pytest.mark.anyio
async def test_anti_overtourism_circuits():
    """Verify anti-overtourism alternative recommendations."""
    async with async_session_maker() as session:
        result = await session.execute(
            select(AntiOvertourismPair).where(AntiOvertourismPair.popular_name == "Manali")
        )
        pair = result.scalar_one_or_none()
        assert pair is not None, "Manali anti-overtourism pair must exist"
        assert pair.alternative_name == "Tirthan Valley"
        assert pair.crowd_reduction_pct == 65
