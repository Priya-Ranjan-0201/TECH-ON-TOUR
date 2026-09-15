from pathlib import Path
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.database.models import Base

# Ensure SQLite file path points to a permanent local location if using sqlite
DB_URL = settings.database_url
if DB_URL.startswith("sqlite"):
    db_path = Path(__file__).resolve().parent.parent.parent / "travelsathi_dev.db"
    DB_URL = f"sqlite+aiosqlite:///{db_path}"

from sqlalchemy import event

connect_args = {"timeout": 30} if DB_URL.startswith("sqlite") else {}

# Create async engine with robust pooling
engine = create_async_engine(
    DB_URL,
    echo=False,
    future=True,
    connect_args=connect_args,
)

# High-Performance SQLite Pragmas (WAL, Memory Cache, MMAP)
if DB_URL.startswith("sqlite"):
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA busy_timeout = 30000")
            cursor.execute("PRAGMA journal_mode = WAL")
            cursor.execute("PRAGMA synchronous = NORMAL")
            cursor.execute("PRAGMA cache_size = -64000")  # 64MB RAM page cache
            cursor.execute("PRAGMA temp_store = MEMORY")
            cursor.execute("PRAGMA mmap_size = 268435456")  # 256MB memory mapped I/O
            cursor.close()
        except Exception:
            pass

# Async session factory
async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for obtaining database sessions.
    Services are responsible for calling commit() explicitly.
    The session manager only handles rollback on unhandled exceptions
    and cleanup on exit — preventing double-commit conflicts.
    """
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables and indexes."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
