"""
auth_router.py — Signup, login, and current-user endpoints.
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import User, UserRole, Worker, AppRole
from backend.schemas import SignupRequest, LoginRequest, AuthResponse, UserOut, RoleUpdateRequest
from backend.auth import (
    hash_password, verify_password, create_access_token, get_current_user, require_min_role
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignupRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Determine role: first user = owner, rest = staff
    count_result = await db.execute(select(func.count()).select_from(User))
    user_count = count_result.scalar() or 0
    role = AppRole.owner if user_count == 0 else AppRole.staff

    # Create user
    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    await db.flush()  # get user.id

    # Create role entry
    role_entry = UserRole(user_id=user.id, role=role)
    db.add(role_entry)

    # Create worker record
    name = req.name if req.name else req.email.split("@")[0]
    worker = Worker(user_id=user.id, name=name, role=role)
    db.add(worker)

    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id, user.email, role.value)
    return AuthResponse(
        token=token,
        user=UserOut(id=user.id, email=user.email, name=name, role=role.value),
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    role = user.role_entry.role.value if user.role_entry else "staff"
    name = user.worker.name if user.worker else user.email.split("@")[0]

    token = create_access_token(user.id, user.email, role)
    return AuthResponse(
        token=token,
        user=UserOut(id=user.id, email=user.email, name=name, role=role),
    )


@router.get("/me", response_model=UserOut)
async def get_me(user: Annotated[User, Depends(get_current_user)]):
    role = user.role_entry.role.value if user.role_entry else "staff"
    name = user.worker.name if user.worker else user.email.split("@")[0]
    return UserOut(id=user.id, email=user.email, name=name, role=role)

@router.put("/users/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: int,
    req: RoleUpdateRequest,
    current_user: Annotated[User, Depends(require_min_role(AppRole.owner))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Owner-only: promote a user to admin or demote to staff."""
    if req.role not in ("admin", "staff"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'staff'")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.role_entry:
        if target_user.role_entry.role == AppRole.owner:
            raise HTTPException(status_code=400, detail="Cannot change owner's role")
        target_user.role_entry.role = AppRole(req.role)

    if target_user.worker:
        target_user.worker.role = AppRole(req.role)

    await db.commit()

    name = target_user.worker.name if target_user.worker else target_user.email.split("@")[0]
    return UserOut(id=target_user.id, email=target_user.email, name=name, role=req.role)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user: Annotated[User, Depends(require_min_role(AppRole.owner))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Owner-only: remove a user completely."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.role_entry and target_user.role_entry.role == AppRole.owner:
        raise HTTPException(status_code=400, detail="Cannot delete an owner")

    if target_user.role_entry:
        await db.delete(target_user.role_entry)
    if target_user.worker:
        await db.delete(target_user.worker)

    await db.delete(target_user)
    await db.commit()
