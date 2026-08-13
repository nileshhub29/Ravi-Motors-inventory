"""
audit_router.py — Audit log listing endpoint.
"""
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import User, StockAuditLog
from backend.schemas import AuditLogOut
from backend.auth import get_current_user

router = APIRouter(prefix="/api/audit-logs", tags=["audit"])


@router.get("", response_model=list[AuditLogOut])
async def list_audit_logs(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all audit logs in reverse-chronological order."""
    result = await db.execute(
        select(StockAuditLog).order_by(StockAuditLog.created_at.desc()).limit(200)
    )
    return result.scalars().all()
