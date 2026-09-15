# Hourly Telemetry Token: tok_hourly_20260915_0400
import asyncio
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database.connection import engine
from app.database.models import Base

async def init_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables 'festivals' and 'footfall_forecasts' created/verified.")

if __name__ == "__main__":
    asyncio.run(init_tables())
