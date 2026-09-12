import sys
import time
from pathlib import Path
from contextlib import asynccontextmanager

_workspace_root = str(Path(__file__).resolve().parent.parent.parent)
if _workspace_root not in sys.path:
    sys.path.insert(0, _workspace_root)

from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.database.connection import init_db, get_db
from app.database.models import PipelineRun
from app.api.destinations import router as destinations_router
from app.api.homestays import router as homestays_router
from app.api.overtourism import router as overtourism_router
from app.api.insights import router as insights_router
from app.api.itinerary import router as itinerary_router
from app.api.chat import router as chat_router
from app.api.reviews import router as reviews_router
from app.api.marketplace import router as marketplace_router
from app.api.dmo import router as dmo_router
from app.api.checkout import router as checkout_router
from app.api.safety import router as safety_router
from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.user import router as user_router, users_router
from app.api.tourist import router as tourist_router
from app.api.host import router as host_router
from app.api.routing import router as routing_router
from app.services.routing_service import get_route
from app.api.weather import router as weather_router
from app.api.ml_recommendations import router as ml_recommendations_router
from app.api.recommendations import router as recommendations_router, location_router
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.jobs.daily_refresh import run_daily_refresh
from app.jobs.hourly_refresh import run_hourly_refresh

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables on startup and start daily + hourly refresh schedulers."""
    await init_db()
    try:
        # Trigger initial run of hourly refresh asynchronously upon startup so hourly_token & signals are immediately live
        import asyncio
        asyncio.create_task(run_hourly_refresh())

        scheduler.add_job(
            run_daily_refresh,
            "cron",
            hour=3,
            minute=0,
            id="daily_ml_refresh",
            replace_existing=True
        )
        scheduler.add_job(
            run_hourly_refresh,
            "interval",
            hours=1,
            id="hourly_data_refresh",
            replace_existing=True
        )
        scheduler.start()
    except Exception as exc:
        print(f"Warning: Failed to start APScheduler: {exc}")
    yield
    try:
        scheduler.shutdown(wait=False)
    except Exception:
        pass


app = FastAPI(
    title="TravelSathi API",
    description="Unified Digital Public Infrastructure (DPI) & Tourism Revival Platform Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

from fastapi.middleware.gzip import GZipMiddleware

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip Compression Middleware (compresses responses > 1KB, saves 70-85% bandwidth)
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    return response


# Include API Routers under /api
app.include_router(destinations_router, prefix="/api")
app.include_router(homestays_router, prefix="/api")
app.include_router(overtourism_router, prefix="/api")
app.include_router(insights_router, prefix="/api")
app.include_router(insights_router)
app.include_router(itinerary_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(reviews_router, prefix="/api")
app.include_router(marketplace_router, prefix="/api")
app.include_router(tourist_router, prefix="/api")
app.include_router(host_router, prefix="/api")
app.include_router(host_router, prefix="/api/homestays")
app.include_router(dmo_router, prefix="/api")
app.include_router(checkout_router, prefix="/api")
app.include_router(safety_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(routing_router, prefix="/api")
app.include_router(weather_router, prefix="/api")
app.include_router(ml_recommendations_router)
app.include_router(recommendations_router)
app.include_router(location_router)


@app.get("/api/route", tags=["GIS & Routing"])
async def get_route_direct(
    start_lat: float,
    start_lng: float,
    end_lat: float,
    end_lng: float,
    mode: str = "driving-car"
):
    """
    Direct route endpoint: returns distance_km, duration_min, coordinates, geometry, and navigation URLs.
    """
    return await get_route(start_lat, start_lng, end_lat, end_lng, mode=mode)



@app.get("/", tags=["General"])
async def root():
    return {
        "name": "TravelSathi API Gateway",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "dpi_layers": [
            "Swadesh Darshan 2.0",
            "PM-JUGA Tribal Homestays",
            "PM-Vikas Artisan Verification",
            "Bhashini Vernacular Speech",
            "ONDC & Split-UPI Checkout"
        ]
    }


@app.get("/api/health", tags=["Monitoring"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "environment": settings.app_env,
        "debug": settings.debug,
        "version": "1.0.0",
        "timestamp": time.time(),
        "services": {
            "database": "ready",
            "ai_router": "ready",
            "gis_engine": "ready"
        }
    }


@app.api_route("/api/jobs/hourly", methods=["GET", "POST"], tags=["Jobs & Maintenance"])
async def trigger_hourly_data_job():
    """
    Triggers the unattended hourly data refresh pipeline on demand or via external scheduled cron.
    Refreshes weather, festivals, search trends, destination overtourism signals, and logs to pipeline_runs.
    """
    result = await run_hourly_refresh()
    return result


@app.get("/api/pipeline_runs", tags=["Jobs & Maintenance"])
@app.get("/api/jobs/pipeline-runs", tags=["Jobs & Maintenance"])
async def get_pipeline_runs_log(
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns recent pipeline execution history from pipeline_runs table.
    """
    stmt = select(PipelineRun).order_by(PipelineRun.id.desc()).limit(limit)
    res = await db.execute(stmt)
    runs = res.scalars().all()
    return {
        "success": True,
        "count": len(runs),
        "runs": [
            {
                "id": r.id,
                "run_at": r.run_at,
                "status": r.status,
                "rows_used": r.rows_used,
                "error": r.error,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in runs
        ]
    }

