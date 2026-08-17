"""
database.py — SQLAlchemy async engine + SQLite setup
"""
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import event, text
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import StaticPool
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./parts_inventory.db")

# Automatically adjust Render PostgreSQL connection URLs to use the asyncpg dialect
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

is_sqlite = DATABASE_URL.startswith("sqlite")

if is_sqlite:
    # For async SQLite:
    # - StaticPool keeps a single connection so aiosqlite doesn't fight itself
    # - connect_args sets busy_timeout (milliseconds) so concurrent writes queue up
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        connect_args={
            "timeout": 30,          # seconds to wait before "database is locked" error
            "check_same_thread": False,
        },
        poolclass=StaticPool,       # single shared connection — safe for SQLite + asyncio
    )
else:
    # For PostgreSQL (e.g., Render Postgres, Neon)
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
    )


async def _apply_wal_mode(connection):
    """
    Enable WAL journal mode and set a busy timeout at the SQLite PRAGMA level.
    WAL allows simultaneous reads while a write is in progress.
    Only applicable for SQLite databases.
    """
    if is_sqlite:
        await connection.execute(text("PRAGMA journal_mode=WAL"))
        await connection.execute(text("PRAGMA busy_timeout=10000"))   # 10 s retry window
        await connection.execute(text("PRAGMA synchronous=NORMAL"))   # safer than FULL, faster than OFF
        await connection.execute(text("PRAGMA cache_size=-64000"))     # 64 MB page cache


async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    """FastAPI dependency — yields an async DB session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_tables():
    """Create all tables on startup and apply SQLite optimisation pragmas."""
    async with engine.begin() as conn:
        from backend.models import Base  # noqa: F811
        # Apply WAL + busy_timeout before creating tables so the very first
        # request is already running with the correct journal mode.
        await _apply_wal_mode(conn)
        await conn.run_sync(Base.metadata.create_all)
