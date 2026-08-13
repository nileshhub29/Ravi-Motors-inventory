"""
inventory_router.py — CRUD + atomic stock adjustment for inventory items.
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import OperationalError
import asyncio

from backend.database import get_db
from backend.models import User, Inventory, StockAuditLog, AppRole
from backend.schemas import (
    InventoryCreate, InventoryUpdate, InventoryOut, StockAdjustRequest
)
from backend.auth import get_current_user, require_min_role
from backend.websocket import manager

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


async def _retry_on_locked(coro_fn, retries: int = 5, delay: float = 0.2):
    """Retry an async coroutine function on SQLite OperationalError (database locked)."""
    for attempt in range(retries):
        try:
            return await coro_fn()
        except OperationalError as exc:
            if "locked" in str(exc).lower() and attempt < retries - 1:
                await asyncio.sleep(delay * (attempt + 1))
                continue
            raise


@router.get("", response_model=list[InventoryOut])
async def list_inventory(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    car_model: str | None = Query(None),
    part_category: str | None = Query(None),
    quality_tier: str | None = Query(None),
    side: str | None = Query(None),
    search: str | None = Query(None),
):
    """List all inventory items with optional filters."""
    query = select(Inventory).order_by(Inventory.stock.asc(), Inventory.part_name.asc())

    if car_model:
        query = query.where(Inventory.car_model == car_model)
    if part_category:
        query = query.where(Inventory.part_category == part_category)
    if quality_tier:
        query = query.where(Inventory.quality_tier == quality_tier)
    if side:
        query = query.where(Inventory.side == side)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            Inventory.part_name.ilike(pattern)
            | Inventory.oem_number.ilike(pattern)
            | Inventory.car_model.ilike(pattern)
        )

    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=InventoryOut, status_code=201)
async def add_inventory_item(
    item: InventoryCreate,
    user: Annotated[User, Depends(require_min_role(AppRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Admin+: add a new inventory item."""
    new_item = Inventory(**item.model_dump())
    db.add(new_item)

    # Audit log
    worker_name = user.worker.name if user.worker else user.email
    audit = StockAuditLog(
        worker_name=worker_name,
        worker_role=user.role_entry.role.value if user.role_entry else "staff",
        part_name=item.part_name,
        oem_number=item.oem_number,
        car_model=item.car_model,
        generation_type=item.generation_type,
        action_type="item_added",
        reason="New item added to inventory",
        previous_stock=None,
        new_stock=item.stock,
        delta=item.stock,
    )
    db.add(audit)

    async def _commit():
        await db.commit()
        await db.refresh(new_item)

    await _retry_on_locked(_commit)

    # Broadcast to WebSocket clients
    item_dict = InventoryOut.model_validate(new_item).model_dump(mode="json")
    await manager.broadcast("inventory_added", item_dict)
    audit_dict = {
        "worker_name": audit.worker_name,
        "action_type": "item_added",
        "part_name": item.part_name,
        "reason": "New item added to inventory",
    }
    await manager.broadcast("audit_log", audit_dict)

    return new_item


@router.put("/{item_id}", response_model=InventoryOut)
async def update_inventory_item(
    item_id: int,
    updates: InventoryUpdate,
    user: Annotated[User, Depends(require_min_role(AppRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Admin+: update an inventory item. Logs field-level changes."""
    result = await db.execute(select(Inventory).where(Inventory.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    worker_name = user.worker.name if user.worker else user.email
    changes = []
    update_data = updates.model_dump(exclude_unset=True)

    for field, new_value in update_data.items():
        old_value = getattr(item, field)
        if old_value != new_value:
            changes.append(f"{field}: {old_value} → {new_value}")
            setattr(item, field, new_value)

    if changes:
        audit = StockAuditLog(
            worker_name=worker_name,
            worker_role=user.role_entry.role.value if user.role_entry else "staff",
            part_name=item.part_name,
            oem_number=item.oem_number,
            car_model=item.car_model,
            generation_type=item.generation_type,
            action_type="item_updated",
            reason=f"Fields changed: {'; '.join(changes)}",
            previous_stock=None,
            new_stock=None,
            delta=None,
        )
        db.add(audit)

    await db.commit()
    await db.refresh(item)

    item_dict = InventoryOut.model_validate(item).model_dump(mode="json")
    await manager.broadcast("inventory_updated", item_dict)

    return item


@router.delete("/{item_id}", status_code=204)
async def delete_inventory_item(
    item_id: int,
    user: Annotated[User, Depends(require_min_role(AppRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Admin+: delete an inventory item."""
    result = await db.execute(select(Inventory).where(Inventory.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    worker_name = user.worker.name if user.worker else user.email
    audit = StockAuditLog(
        worker_name=worker_name,
        worker_role=user.role_entry.role.value if user.role_entry else "staff",
        part_name=item.part_name,
        oem_number=item.oem_number,
        car_model=item.car_model,
        generation_type=item.generation_type,
        action_type="item_deleted",
        reason="Item removed from inventory",
        previous_stock=item.stock,
        new_stock=None,
        delta=None,
    )
    db.add(audit)

    await db.delete(item)
    await db.commit()

    await manager.broadcast("inventory_deleted", {"id": item_id})


@router.post("/{item_id}/adjust-stock", response_model=InventoryOut)
async def adjust_stock(
    item_id: int,
    req: StockAdjustRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Atomic stock adjustment: read-with-lock → update → write audit log in one transaction.
    Both staff and owner can adjust stock.
    """
    # with_for_update() issues SELECT ... FOR UPDATE, ensuring no other
    # concurrent session can modify this row until we commit.
    result = await db.execute(
        select(Inventory).where(Inventory.id == item_id).with_for_update()
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    previous_stock = item.stock
    new_stock = max(0, item.stock + req.delta)
    item.stock = new_stock

    worker_name = user.worker.name if user.worker else user.email
    action_type = "stock_increased" if req.delta > 0 else "stock_decreased"

    audit = StockAuditLog(
        worker_name=worker_name,
        worker_role=user.role_entry.role.value if user.role_entry else "staff",
        part_name=item.part_name,
        oem_number=item.oem_number,
        car_model=item.car_model,
        generation_type=item.generation_type,
        action_type=action_type,
        reason=req.reason,
        previous_stock=previous_stock,
        new_stock=new_stock,
        delta=req.delta,
    )
    db.add(audit)

    async def _commit():
        await db.commit()
        await db.refresh(item)
        await db.refresh(audit)

    await _retry_on_locked(_commit)

    # Broadcast updates
    item_dict = InventoryOut.model_validate(item).model_dump(mode="json")
    await manager.broadcast("inventory_updated", item_dict)

    from backend.schemas import AuditLogOut
    audit_dict = AuditLogOut.model_validate(audit).model_dump(mode="json")
    await manager.broadcast("audit_log", audit_dict)

    return item
