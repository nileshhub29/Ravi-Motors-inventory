"""
workers_router.py — Worker listing endpoint.
"""
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import User, Worker
from backend.schemas import WorkerOut
from backend.auth import get_current_user

router = APIRouter(prefix="/api/workers", tags=["workers"])


@router.get("", response_model=list[WorkerOut])
async def list_workers(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all workers."""
    result = await db.execute(select(Worker).order_by(Worker.created_at.asc()))
    return result.scalars().all()
