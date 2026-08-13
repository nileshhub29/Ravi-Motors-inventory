"""
dashboard_router.py — Owner-only dashboard statistics.
"""
from datetime import datetime, timedelta, timezone
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, case, and_
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import User, Inventory, StockAuditLog, AppRole
from backend.schemas import (
    DashboardStats, FastestMovingPart, StockValueByModel,
    CategoryQualityMix, WorkerActivity, InventoryOut,
)
from backend.auth import require_min_role

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardStats)
async def get_dashboard_stats(
    user: Annotated[User, Depends(require_min_role(AppRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Admin+: comprehensive dashboard statistics."""

    # Total stock value = sum(selling_price * stock)
    val_result = await db.execute(
        select(func.coalesce(func.sum(Inventory.selling_price * Inventory.stock), 0))
    )
    total_stock_value = float(val_result.scalar() or 0)

    # Low stock count
    low_result = await db.execute(
        select(func.count()).select_from(Inventory).where(
            and_(Inventory.stock > 0, Inventory.stock <= Inventory.low_stock_threshold)
        )
    )
    low_stock_count = low_result.scalar() or 0

    # Out of stock count
    oos_result = await db.execute(
        select(func.count()).select_from(Inventory).where(Inventory.stock == 0)
    )
    out_of_stock_count = oos_result.scalar() or 0

    # 30-day action count
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    action_result = await db.execute(
        select(func.count()).select_from(StockAuditLog).where(
            StockAuditLog.created_at >= thirty_days_ago
        )
    )
    thirty_day_action_count = action_result.scalar() or 0

    # Fastest-moving parts (top 8 by total issued volume)
    fast_result = await db.execute(
        select(
            StockAuditLog.part_name,
            StockAuditLog.car_model,
            func.sum(func.abs(StockAuditLog.delta)).label("total_issued"),
        )
        .where(
            and_(
                StockAuditLog.action_type == "stock_decreased",
                StockAuditLog.created_at >= thirty_days_ago,
            )
        )
        .group_by(StockAuditLog.part_name, StockAuditLog.car_model)
        .order_by(func.sum(func.abs(StockAuditLog.delta)).desc())
        .limit(8)
    )
    fastest_moving = [
        FastestMovingPart(part_name=r[0], car_model=r[1], total_issued=int(r[2] or 0))
        for r in fast_result.all()
    ]

    # Reorder list (stock <= threshold)
    reorder_result = await db.execute(
        select(Inventory)
        .where(Inventory.stock <= Inventory.low_stock_threshold)
        .order_by(Inventory.stock.asc())
    )
    reorder_list = [
        InventoryOut.model_validate(item) for item in reorder_result.scalars().all()
    ]

    # Stock value by model
    model_result = await db.execute(
        select(
            Inventory.car_model,
            func.sum(Inventory.selling_price * Inventory.stock).label("total_value"),
        )
        .group_by(Inventory.car_model)
        .order_by(func.sum(Inventory.selling_price * Inventory.stock).desc())
    )
    stock_value_by_model = [
        StockValueByModel(car_model=r[0], total_value=float(r[1] or 0))
        for r in model_result.all()
    ]

    # Category/quality mix
    mix_result = await db.execute(
        select(
            Inventory.part_category,
            Inventory.quality_tier,
            func.count().label("count"),
        )
        .group_by(Inventory.part_category, Inventory.quality_tier)
        .order_by(Inventory.part_category, Inventory.quality_tier)
    )
    category_quality_mix = [
        CategoryQualityMix(part_category=r[0], quality_tier=r[1], count=r[2])
        for r in mix_result.all()
    ]

    # Per-worker activity (30 days)
    worker_result = await db.execute(
        select(
            StockAuditLog.worker_name,
            func.count().label("action_count"),
        )
        .where(StockAuditLog.created_at >= thirty_days_ago)
        .group_by(StockAuditLog.worker_name)
        .order_by(func.count().desc())
    )
    worker_activity = [
        WorkerActivity(worker_name=r[0], action_count=r[1])
        for r in worker_result.all()
    ]

    return DashboardStats(
        total_stock_value=total_stock_value,
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
        thirty_day_action_count=thirty_day_action_count,
        fastest_moving=fastest_moving,
        reorder_list=reorder_list,
        stock_value_by_model=stock_value_by_model,
        category_quality_mix=category_quality_mix,
        worker_activity=worker_activity,
    )
