# Hourly Telemetry Token: tok_hourly_20260915_0400
import asyncio
from app.database.connection import engine
from app.database.models import Base

async def init_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables verified/created in database.")

if __name__ == "__main__":
    asyncio.run(init_tables())
