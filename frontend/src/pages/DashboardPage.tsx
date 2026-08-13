import { useState, useEffect } from 'react';
import type { DashboardStats } from '../types';
import { formatPrice } from '../types';
import { dashboardApi } from '../api';
import { ArrowLeft, TrendingUp, AlertCircle, PackageX, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '../components/Header';
import { TeamModal } from '../components/TeamModal';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamOpen, setTeamOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardApi.stats()
      .then(setStats)
      .catch((err) => {
        toast.error('Failed to load dashboard');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading dashboard...</div>;
  if (!stats) return <div style={{ padding: 40, textAlign: 'center' }}>Error loading stats</div>;

  return (
    <>
      <Header
        lowStockCount={stats.low_stock_count}
        searchValue=""
        onSearchChange={() => {}}
        onOpenAuditLog={() => {}}
        onAddItem={() => {}}
        onOpenTeam={() => setTeamOpen(true)}
      />
      <div className="app page-body">
        <div className="section-head" style={{ marginBottom: 24, marginTop: 10 }}>
          <div>
            <button className="btn" onClick={() => navigate('/')} style={{ marginBottom: 12 }}>
              <ArrowLeft size={14} /> Back to Inventory
            </button>
            <h2>Owner Dashboard</h2>
          </div>
        </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div className="stat-content">
            <div className="label">Total Stock Value</div>
            <div className="value">{formatPrice(stats.total_stock_value)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><AlertCircle size={20} /></div>
          <div className="stat-content">
            <div className="label">Low Stock Items</div>
            <div className="value amber">{stats.low_stock_count}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--back-soft)', color: 'var(--danger)' }}>
            <PackageX size={20} />
          </div>
          <div className="stat-content">
            <div className="label">Out of Stock</div>
            <div className="value danger">{stats.out_of_stock_count}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon navy"><Activity size={20} /></div>
          <div className="stat-content">
            <div className="label">30-Day Activity</div>
            <div className="value">{stats.thirty_day_action_count}</div>
            <div className="delta">stock movements</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="dash-section">
          <h2>Fastest Moving Parts</h2>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Part</th>
                <th>Model</th>
                <th style={{ textAlign: 'right' }}>Issued (30d)</th>
              </tr>
            </thead>
            <tbody>
              {stats.fastest_moving.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)' }}>No data</td></tr>
              ) : (
                stats.fastest_moving.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{p.part_name}</td>
                    <td>{p.car_model}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>{p.total_issued}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="dash-section">
          <h2>Items to Reorder</h2>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Part</th>
                <th>OEM #</th>
                <th style={{ textAlign: 'right' }}>Stock / Thresh</th>
              </tr>
            </thead>
            <tbody>
              {stats.reorder_list.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)' }}>No data</td></tr>
              ) : (
                stats.reorder_list.slice(0, 10).map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.part_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{p.oem_number}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: p.stock === 0 ? 'var(--danger)' : 'var(--amkt)' }}>
                        {p.stock}
                      </span> / {p.low_stock_threshold}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="dash-section">
          <h2>Stock Value by Model</h2>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Model</th>
                <th style={{ textAlign: 'right' }}>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {stats.stock_value_by_model.map((m, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{m.car_model}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatPrice(m.total_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dash-section">
          <h2>Worker Activity (30d)</h2>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Worker Name</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.worker_activity.length === 0 ? (
                <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--muted)' }}>No data</td></tr>
              ) : (
                stats.worker_activity.map((w, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{w.worker_name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{w.action_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <TeamModal open={teamOpen} onClose={() => setTeamOpen(false)} />
  </>
);
}
