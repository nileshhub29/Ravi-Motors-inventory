# Task: Implement 3-Tier Role System — Backend

## Context

The MarutiParts Hub app currently has 2 roles: `owner` and `staff`. The problem is that admin and staff are **exactly the same** — there is no `admin` role at all. When someone logs in with what should be admin credentials, they see "staff" post-auth because only `owner` and `staff` exist in the `AppRole` enum.

We need to introduce a proper 3-tier role hierarchy:

| Role | Description | Permissions |
|------|-------------|-------------|
| `owner` | First user to register | **Everything** — add/edit/delete items, dashboard, adjust stock, promote/demote users to admin |
| `admin` | Promoted by owner | **Everything except role management** — add/edit/delete items, dashboard, adjust stock |
| `staff` | Default for new signups | **Stock adjustments only** — can view inventory and adjust stock. Cannot add/edit/delete items or view dashboard |

## Files to Modify

### 1. `backend/models.py` — Add `admin` to AppRole enum

**Current** (line 13-15):
```python
class AppRole(str, enum.Enum):
    owner = "owner"
    staff = "staff"
```

**Change to:**
```python
class AppRole(str, enum.Enum):
    owner = "owner"
    admin = "admin"
    staff = "staff"
```

> **IMPORTANT**: SQLite stores enum values as plain strings, so adding `admin` to the Python enum doesn't require a database migration. Existing data continues to work unchanged.

---

### 2. `backend/auth.py` — Add `require_min_role` with hierarchy support

Keep the existing `require_role` function as-is. Add these new items after it:

```python
# Role hierarchy: owner > admin > staff
ROLE_HIERARCHY = {
    AppRole.owner: 3,
    AppRole.admin: 2,
    AppRole.staff: 1,
}


def require_min_role(min_role: AppRole):
    """
    Returns a dependency that checks the current user has AT LEAST the
    required role level.  owner >= admin >= staff.
    Usage: Depends(require_min_role(AppRole.admin))
    """
    async def _check(
        credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ) -> User:
        user = await get_current_user(credentials, db)
        user_role = user.role_entry.role if user.role_entry else AppRole.staff
        if ROLE_HIERARCHY.get(user_role, 0) < ROLE_HIERARCHY[min_role]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {min_role.value} role or higher",
            )
        return user

    return _check
```

---

### 3. `backend/routers/inventory_router.py` — Use `require_min_role(AppRole.admin)`

**Change the import** on line 16:
```python
# FROM:
from backend.auth import get_current_user, require_role
# TO:
from backend.auth import get_current_user, require_min_role
```

**Update these 3 endpoints** — change `require_role(AppRole.owner)` → `require_min_role(AppRole.admin)`:

1. **`add_inventory_item`** (line 70): `user: Annotated[User, Depends(require_min_role(AppRole.admin))]`  
   Update docstring: `"""Admin+: add a new inventory item."""`

2. **`update_inventory_item`** (line 118): `user: Annotated[User, Depends(require_min_role(AppRole.admin))]`  
   Update docstring: `"""Admin+: update an inventory item. Logs field-level changes."""`

3. **`delete_inventory_item`** (line 165): `user: Annotated[User, Depends(require_min_role(AppRole.admin))]`  
   Update docstring: `"""Admin+: delete an inventory item."""`

---

### 4. `backend/routers/dashboard_router.py` — Use `require_min_role(AppRole.admin)`

**Change the import** on line 16:
```python
# FROM:
from backend.auth import require_role
# TO:
from backend.auth import require_min_role
```

**Update** line 23:
```python
# FROM:
user: Annotated[User, Depends(require_role(AppRole.owner))],
# TO:
user: Annotated[User, Depends(require_min_role(AppRole.admin))],
```

Update docstring: `"""Admin+: comprehensive dashboard statistics."""`

---

### 5. `backend/schemas.py` — Add RoleUpdateRequest

Add this new schema after the existing `UserOut` class (around line 33):

```python
class RoleUpdateRequest(BaseModel):
    role: str  # "admin" or "staff"
```

---

### 6. `backend/routers/auth_router.py` — Add role promotion endpoint

**Update the imports** at the top:
```python
# Add require_min_role to the import:
from backend.auth import (
    hash_password, verify_password, create_access_token, get_current_user, require_min_role
)
# Add RoleUpdateRequest to the schemas import:
from backend.schemas import SignupRequest, LoginRequest, AuthResponse, UserOut, RoleUpdateRequest
```

**Add this new endpoint** after the existing `/me` endpoint:

```python
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
```

---

## Verification

After making all changes:
1. Ensure backend starts without errors: `cd /Users/nileshagarwal/parts && python -m uvicorn backend.main:app --reload`
2. Existing owner login still works and shows `role: "owner"`
3. Staff user gets 403 on `POST /api/inventory`, `PUT /api/inventory/{id}`, `DELETE /api/inventory/{id}`, and `GET /api/dashboard`
4. Staff user CAN still call `POST /api/inventory/{id}/adjust-stock` (stock adjustments)
5. Owner can call `PUT /api/auth/users/{id}/role` with `{"role": "admin"}` to promote a staff member
6. After promotion, the promoted admin can add/edit/delete items and access dashboard
