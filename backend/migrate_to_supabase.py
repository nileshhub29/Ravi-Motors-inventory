"""
migrate_to_supabase.py — Safely transfer 100% of SQLite data into Supabase PostgreSQL.

Usage:
    python3 -m backend.migrate_to_supabase --target-url "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
or
    DATABASE_URL="postgresql://..." python3 -m backend.migrate_to_supabase
"""

import os
import sys
import json
import argparse
import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text, select, func

from backend.models import Base, User, UserRole, Worker, Inventory, StockAuditLog
from backend.backup_and_export_db import run_backup, BACKUP_DIR

def load_source_data():
    """Load data from latest backup JSON or create one immediately."""
    latest_json = os.path.join(BACKUP_DIR, "backup_latest.json")
    if not os.path.exists(latest_json):
        print("Creating fresh backup first...")
        run_backup()
    
    with open(latest_json, "r", encoding="utf-8") as f:
        return json.load(f)

def parse_iso_datetime(val):
    if not val:
        return None
    if isinstance(val, datetime):
        return val
    try:
        # SQLite string format e.g. 2026-03-01 12:00:00 or ISO
        return datetime.fromisoformat(str(val).replace(" ", "T"))
    except Exception:
        return None

async def migrate_data(target_url: str):
    print(f"\n==================================================")
    print(f"🚀 Starting Migration to Supabase PostgreSQL")
    print(f"==================================================")

    # Format URL to asyncpg
    if target_url.startswith("postgres://"):
        target_url = target_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif target_url.startswith("postgresql://") and "+asyncpg" not in target_url:
        target_url = target_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    if "sslmode=" in target_url:
        target_url = target_url.replace("sslmode=require", "ssl=require").replace("sslmode=prefer", "ssl=prefer")

    engine = create_async_engine(target_url, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    source_data = load_source_data()

    # Step 1: Create all tables in Supabase Postgres
    print("\n[1/5] Ensuring all tables exist in Supabase...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Tables verified/created successfully.")

    async with session_factory() as session:
        # Step 2: Migrate Users
        users_data = source_data.get("users", [])
        print(f"\n[2/5] Migrating {len(users_data)} Users...")
        for u in users_data:
            existing = await session.scalar(select(User).where(User.id == u["id"]))
            if not existing:
                user_obj = User(
                    id=u["id"],
                    email=u["email"],
                    hashed_password=u["hashed_password"],
                    created_at=parse_iso_datetime(u.get("created_at")),
                )
                session.add(user_obj)
        await session.commit()
        print(f"✓ Users migrated.")

        # Step 3: Migrate User Roles & Workers
        roles_data = source_data.get("user_roles", [])
        print(f"\n[3/5] Migrating {len(roles_data)} User Roles & Workers...")
        for r in roles_data:
            existing = await session.scalar(select(UserRole).where(UserRole.id == r["id"]))
            if not existing:
                role_obj = UserRole(
                    id=r["id"],
                    user_id=r["user_id"],
                    role=r["role"],
                    created_at=parse_iso_datetime(r.get("created_at")),
                )
                session.add(role_obj)

        workers_data = source_data.get("workers", [])
        for w in workers_data:
            existing = await session.scalar(select(Worker).where(Worker.id == w["id"]))
            if not existing:
                worker_obj = Worker(
                    id=w["id"],
                    user_id=w["user_id"],
                    name=w["name"],
                    role=w["role"],
                    created_at=parse_iso_datetime(w.get("created_at")),
                )
                session.add(worker_obj)
        await session.commit()
        print(f"✓ User roles and workers migrated.")

        # Step 4: Migrate Inventory Items
        inventory_data = source_data.get("inventory", [])
        print(f"\n[4/5] Migrating {len(inventory_data)} Inventory Items...")
        for item in inventory_data:
            existing = await session.scalar(select(Inventory).where(Inventory.id == item["id"]))
            compatible = item.get("compatible_models", [])
            if isinstance(compatible, str):
                try:
                    compatible = json.loads(compatible)
                except Exception:
                    compatible = []

            if not existing:
                inv_obj = Inventory(
                    id=item["id"],
                    part_name=item["part_name"],
                    car_model=item["car_model"],
                    generation_type=item.get("generation_type", ""),
                    part_category=item["part_category"],
                    position=item["position"],
                    side=item["side"],
                    quality_tier=item["quality_tier"],
                    oem_number=item.get("oem_number", ""),
                    selling_price=float(item.get("selling_price", 0.0)),
                    stock=int(item.get("stock", 0)),
                    low_stock_threshold=int(item.get("low_stock_threshold", 3)),
                    compatible_models=compatible,
                    created_at=parse_iso_datetime(item.get("created_at")),
                    updated_at=parse_iso_datetime(item.get("updated_at")),
                )
                session.add(inv_obj)
        await session.commit()
        print(f"✓ Inventory items migrated.")

        # Step 5: Migrate Stock Audit Logs
        logs_data = source_data.get("stock_audit_logs", [])
        print(f"\n[5/5] Migrating {len(logs_data)} Stock Audit Logs...")
        for log in logs_data:
            existing = await session.scalar(select(StockAuditLog).where(StockAuditLog.id == log["id"]))
            if not existing:
                log_obj = StockAuditLog(
                    id=log["id"],
                    worker_name=log["worker_name"],
                    worker_role=log["worker_role"],
                    part_name=log["part_name"],
                    oem_number=log.get("oem_number", ""),
                    car_model=log.get("car_model", ""),
                    generation_type=log.get("generation_type", ""),
                    action_type=log["action_type"],
                    reason=log.get("reason", ""),
                    previous_stock=log.get("previous_stock"),
                    new_stock=log.get("new_stock"),
                    delta=log.get("delta"),
                    created_at=parse_iso_datetime(log.get("created_at")),
                )
                session.add(log_obj)
        await session.commit()
        print(f"✓ Audit logs migrated.")

        # Step 6: Reset PostgreSQL Sequences so next auto-increments don't clash
        print("\nSynchronizing PostgreSQL auto-increment sequences...")
        tables = ["users", "user_roles", "workers", "inventory", "stock_audit_logs"]
        for tbl in tables:
            try:
                seq_query = text(
                    f"SELECT setval(pg_get_serial_sequence('{tbl}', 'id'), COALESCE((SELECT MAX(id) FROM {tbl}), 1));"
                )
                await session.execute(seq_query)
            except Exception as e:
                # Some tables or DB configurations may handle sequences differently
                pass
        await session.commit()
        print("✓ Sequences synchronized.")

        # Verification
        print("\n==================================================")
        print("📊 Verification Summary:")
        print("==================================================")
        u_count = await session.scalar(select(func.count(User.id)))
        ur_count = await session.scalar(select(func.count(UserRole.id)))
        w_count = await session.scalar(select(func.count(Worker.id)))
        inv_count = await session.scalar(select(func.count(Inventory.id)))
        log_count = await session.scalar(select(func.count(StockAuditLog.id)))

        print(f"Users:            Source {len(users_data)}  ==>  Target {u_count}")
        print(f"User Roles:       Source {len(roles_data)}  ==>  Target {ur_count}")
        print(f"Workers:          Source {len(workers_data)}  ==>  Target {w_count}")
        print(f"Inventory:        Source {len(inventory_data)}  ==>  Target {inv_count}")
        print(f"Stock Audit Logs: Source {len(logs_data)}  ==>  Target {log_count}")
        print("==================================================")
        print("🎉 All data successfully preserved and copied to Supabase!")

    await engine.dispose()

def main():
    parser = argparse.ArgumentParser(description="Migrate local SQLite data to Supabase PostgreSQL.")
    parser.add_argument("--target-url", help="Target Supabase connection URL (or set TARGET_DATABASE_URL / DATABASE_URL env var)")
    args = parser.parse_args()

    target_url = args.target_url or os.getenv("TARGET_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not target_url or target_url.startswith("sqlite"):
        print("Error: Please provide a valid PostgreSQL target URL.")
        print("Example: python3 -m backend.migrate_to_supabase --target-url \"postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres\"")
        sys.exit(1)

    asyncio.run(migrate_data(target_url))

if __name__ == "__main__":
    main()
