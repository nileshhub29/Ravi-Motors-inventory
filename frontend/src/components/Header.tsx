import { useAuth } from '../auth';
import { Search, Clock, Plus, LogOut, LayoutDashboard, Users, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  lowStockCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onOpenAuditLog: () => void;
  onAddItem: () => void;
  onOpenTeam?: () => void;
  onOpenSync?: () => void;
}

export function Header({ lowStockCount, searchValue, onSearchChange, onOpenAuditLog, onAddItem, onOpenTeam, onOpenSync }: HeaderProps) {
  const { user, logout, isOwner, isAdminOrOwner } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';

  return (
    <>
      <div className="top-strip">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="badge-secure">
            ✦ Authorised Maruti Suzuki Genuine Parts Dealer
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.9, fontSize: 10 }}>
          <span>Toll Free: 1800-102-6393</span>
        </div>
      </div>

      <header className="header">
        <div className="brand">
          <div className="brand-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 16 L4 10 L8 8 L16 8 L20 10 L22 16 L22 19 L2 19 Z" />
              <circle cx="6" cy="19" r="1.5" fill="currentColor" />
              <circle cx="18" cy="19" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="t1">Maruti<span className="accent">Parts</span> Hub</span>
            <span className="t2">Lighting & Body Parts Inventory</span>
          </div>
        </div>

        <div className="header-search">
          <Search size={15} color="var(--muted)" />
          <input
            type="text"
            placeholder="Search by OEM, part name, model..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="header-actions">
          {isOwner && onOpenTeam && (
            <button className="icon-btn" onClick={onOpenTeam} title="Manage Team">
              <Users size={18} />
            </button>
          )}

          {isAdminOrOwner && (
            <button className="icon-btn" onClick={() => navigate('/dashboard')} title="Dashboard">
              <LayoutDashboard size={18} />
            </button>
          )}

          <button className="icon-btn" onClick={onOpenAuditLog} title="Audit Log" style={{ position: 'relative' }}>
            <Clock size={18} />
            {lowStockCount > 0 && <span className="dot" />}
          </button>

          {isAdminOrOwner && onOpenSync && (
            <button className="btn outline" onClick={onOpenSync} style={{ padding: '8px 12px' }} title="Sync MGP Prices">
              <RefreshCw size={14} />
              <span>Sync</span>
            </button>
          )}

          {isAdminOrOwner && (
            <button className="btn primary" onClick={onAddItem} style={{ padding: '8px 12px' }}>
              <Plus size={14} />
              <span>Add Item</span>
            </button>
          )}

          <button className="user-chip" onClick={logout} title="Sign out">
            <span className="avatar">{initials}</span>
            <span className="info">
              <span className="name">{user?.name}</span>
              <span className="role">{user?.role}</span>
            </span>
            <LogOut size={14} style={{ opacity: 0.6 }} />
          </button>
        </div>
      </header>
    </>
  );
}
