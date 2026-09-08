import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.destinations import router as destinations_router
from app.api.homestays import router as homestays_router
from app.api.overtourism import router as overtourism_router
from app.api.insights import router as insights_router
from app.api.itinerary import router as itinerary_router
from app.api.chat import router as chat_router
from app.api.reviews import router as reviews_router
from app.api.marketplace import router as marketplace_router

app = FastAPI(
    title="TravelSathi API",
    description="Unified Digital Public Infrastructure (DPI) & Tourism Revival Platform Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
app.include_router(itinerary_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(reviews_router, prefix="/api")
app.include_router(marketplace_router, prefix="/api")


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
