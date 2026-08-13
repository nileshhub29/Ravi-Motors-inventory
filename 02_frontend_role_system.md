# Task: Implement 3-Tier Role System — Frontend

## Context

The backend now has 3 roles: `owner`, `admin`, `staff`. The frontend needs to:

1. Understand that **both `owner` AND `admin`** have elevated access (add/edit/delete items, dashboard)
2. Show the correct role label in the UI (not always "staff")
3. Add an `isAdmin` check alongside `isOwner`
4. Only show role-management UI to the `owner`
5. Add a worker management section where the owner can promote/demote users

## Files to Modify

### 1. `frontend/src/types.ts` — Update AppRole type

**Current** (line 5):
```typescript
export type AppRole = 'owner' | 'staff';
```

**Change to:**
```typescript
export type AppRole = 'owner' | 'admin' | 'staff';
```

---

### 2. `frontend/src/auth.tsx` — Add `isAdmin` and `isAdminOrOwner`

**Update the AuthContextType interface** (lines 5-13):
```typescript
interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isOwner: boolean;
  isAdmin: boolean;
  isAdminOrOwner: boolean;
}
```

**Add the computed values** after the existing `isOwner` line (line 75):
```typescript
const isOwner = user?.role === 'owner';
const isAdmin = user?.role === 'admin';
const isAdminOrOwner = isOwner || isAdmin;
```

**Update the Provider value** (line 78):
```tsx
<AuthContext.Provider value={{ user, token, loading, login, signup, logout, isOwner, isAdmin, isAdminOrOwner }}>
```

---

### 3. `frontend/src/components/Header.tsx` — Use `isAdminOrOwner` for elevated UI

**Change line 14:**
```typescript
// FROM:
const { user, logout, isOwner } = useAuth();
// TO:
const { user, logout, isOwner, isAdminOrOwner } = useAuth();
```

**Change lines 57-61** (Dashboard button): Replace `isOwner` → `isAdminOrOwner`:
```tsx
{isAdminOrOwner && (
  <button className="icon-btn" onClick={() => navigate('/dashboard')} title="Dashboard">
    <LayoutDashboard size={18} />
  </button>
)}
```

**Change lines 68-73** (Add Item button): Replace `isOwner` → `isAdminOrOwner`:
```tsx
{isAdminOrOwner && (
  <button className="btn primary" onClick={onAddItem} style={{ padding: '8px 12px' }}>
    <Plus size={14} />
    <span>Add Item</span>
  </button>
)}
```

The role label in the user chip (line 79) already displays `{user?.role}` dynamically, so it will correctly show "admin" when the user is an admin. No change needed there.

---

### 4. `frontend/src/components/PartCard.tsx` — Use `isAdminOrOwner` for edit button

**Change line 16:**
```typescript
// FROM:
const { isOwner } = useAuth();
// TO:
const { isAdminOrOwner } = useAuth();
```

**Change line 151:** Replace `isOwner` → `isAdminOrOwner`:
```tsx
{isAdminOrOwner && (
  <button
    className="icon-btn"
    // ... rest stays the same
```

---

### 5. `frontend/src/App.tsx` — Allow admin to access dashboard route

**Change the `OwnerRoute` component** (lines 15-21) to also allow admin:

```tsx
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdminOrOwner } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (!isAdminOrOwner) return <Navigate to="/" />;
  return <>{children}</>;
}
```

**Update the route** on line 28 to use the renamed component:
```tsx
<Route path="/dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
```

---

### 6. `frontend/src/api.ts` — Add role update API call

Add this to the `authApi` object (after the `me` method, around line 57):

```typescript
export const authApi = {
  // ... existing methods ...
  me: () => request<any>('/api/auth/me'),
  updateRole: (userId: number, role: string) =>
    request<any>(`/api/auth/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
};
```

---

### 7. `frontend/src/components/Header.tsx` — Add team management for owner

Add a "Team" icon button that's visible **only to the owner** (not admin). This opens a panel/modal where they can see all workers and promote/demote them.

Add the import at the top:
```typescript
import { Search, Clock, Plus, LogOut, LayoutDashboard, Users } from 'lucide-react';
```

Add a new prop to `HeaderProps`:
```typescript
interface HeaderProps {
  lowStockCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onOpenAuditLog: () => void;
  onAddItem: () => void;
  onOpenTeam?: () => void;  // NEW - only owner sees this
}
```

Add a Team button **before** the Dashboard button, only for owner:
```tsx
{isOwner && onOpenTeam && (
  <button className="icon-btn" onClick={onOpenTeam} title="Manage Team">
    <Users size={18} />
  </button>
)}
```

---

### 8. Create `frontend/src/components/TeamModal.tsx` — NEW FILE

Create a new modal component for managing team roles. This modal:
- Shows a list of all workers with their current roles
- Allows the owner to promote staff → admin or demote admin → staff
- Owner's own entry is shown but not editable

```tsx
import { useState, useEffect } from 'react';
import { X, Shield, ShieldCheck, User as UserIcon } from 'lucide-react';
import { workersApi, authApi } from '../api';
import type { Worker } from '../types';
import { useAuth } from '../auth';
import { toast } from 'sonner';

interface TeamModalProps {
  open: boolean;
  onClose: () => void;
}

export function TeamModal({ open, onClose }: TeamModalProps) {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      workersApi.list()
        .then(setWorkers)
        .catch(() => toast.error('Failed to load team'))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleRoleChange = async (worker: Worker, newRole: string) => {
    try {
      await authApi.updateRole(worker.user_id, newRole);
      setWorkers((prev) =>
        prev.map((w) => (w.id === worker.id ? { ...w, role: newRole } : w))
      );
      toast.success(`${worker.name} is now ${newRole}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  if (!open) return null;

  const getRoleIcon = (role: string) => {
    if (role === 'owner') return <ShieldCheck size={16} color="var(--red)" />;
    if (role === 'admin') return <Shield size={16} color="var(--mgp)" />;
    return <UserIcon size={16} color="var(--muted)" />;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content team-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Team</h2>
          <button className="icon-btn" onClick={onClose} style={{ width: 36, height: 36 }}>
            <X size={18} />
          </button>
        </div>

        <div className="team-list">
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>Loading team...</div>
          ) : (
            workers.map((w) => {
              const isSelf = w.user_id === user?.id;
              const isOwnerRole = w.role === 'owner';

              return (
                <div key={w.id} className="team-row">
                  <div className="team-info">
                    {getRoleIcon(w.role)}
                    <div>
                      <div className="team-name">{w.name} {isSelf && <span style={{ color: 'var(--muted)', fontSize: 11 }}>(you)</span>}</div>
                      <div className="team-role">{w.role}</div>
                    </div>
                  </div>

                  {!isSelf && !isOwnerRole && (
                    <div className="team-actions">
                      {w.role === 'staff' ? (
                        <button
                          className="btn"
                          style={{ padding: '6px 12px', fontSize: 11 }}
                          onClick={() => handleRoleChange(w, 'admin')}
                        >
                          Promote to Admin
                        </button>
                      ) : (
                        <button
                          className="btn"
                          style={{ padding: '6px 12px', fontSize: 11 }}
                          onClick={() => handleRoleChange(w, 'staff')}
                        >
                          Demote to Staff
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### 9. `frontend/src/pages/InventoryPage.tsx` — Wire up TeamModal

**Add imports:**
```typescript
import { TeamModal } from '../components/TeamModal';
```

**Add state** (after the other modal states, around line 29):
```typescript
const [teamOpen, setTeamOpen] = useState(false);
```

**Pass the new prop to Header** (around line 120-126):
```tsx
<Header
  lowStockCount={lowStockCount}
  searchValue={search}
  onSearchChange={setSearch}
  onOpenAuditLog={() => setAuditOpen(true)}
  onAddItem={() => { setEditingItem(undefined); setFormOpen(true); }}
  onOpenTeam={() => setTeamOpen(true)}
/>
```

**Add TeamModal** (after QuantityModal, around line 207):
```tsx
<TeamModal open={teamOpen} onClose={() => setTeamOpen(false)} />
```

---

### 10. `frontend/src/styles.css` — Add TeamModal styles

Add these styles at the end of the CSS file:

```css
/* ============================================================
   TEAM MODAL
   ============================================================ */
.team-modal {
  max-width: 480px;
  width: 100%;
}

.team-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 0;
  max-height: 400px;
  overflow-y: auto;
}

.team-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 10px;
  transition: background 0.2s var(--ease);
}

.team-row:hover {
  background: var(--surface);
}

.team-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.team-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}

.team-role {
  font-size: 10px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.team-actions {
  display: flex;
  gap: 6px;
}
```

---

## Verification

After making all changes:
1. Run frontend: `cd /Users/nileshagarwal/parts/frontend && npm run dev`
2. Log in as owner → should see Dashboard button, Add Item button, Team (Users) button, and Edit pencil on cards
3. Log in as staff → should NOT see Dashboard, Add Item, Team, or Edit buttons. Should still see +/- stock adjust buttons.
4. Use Team modal (owner only) to promote a staff member to admin
5. Log in as the promoted admin → should see Dashboard, Add Item, Edit — but NOT the Team button
6. Role label in the header user chip should correctly show "admin" (not "staff")
