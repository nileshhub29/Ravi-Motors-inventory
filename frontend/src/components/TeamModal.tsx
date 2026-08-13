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

  const handleRemoveWorker = async (worker: Worker) => {
    if (!window.confirm(`Are you sure you want to completely remove ${worker.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await authApi.removeWorker(worker.user_id);
      setWorkers((prev) => prev.filter((w) => w.id !== worker.id));
      toast.success(`${worker.name} has been removed`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove user');
    }
  };

  if (!open) return null;

  const getRoleIcon = (role: string) => {
    if (role === 'owner') return <ShieldCheck size={16} color="var(--red)" />;
    if (role === 'admin') return <Shield size={16} color="var(--mgp)" />;
    return <UserIcon size={16} color="var(--muted)" />;
  };

  return (
    <div className="modal-backdrop open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal team-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title">Manage Team</h2>
            <div className="modal-sub">Promote, demote, or manage team members</div>
          </div>
          <button className="modal-close" onClick={onClose}>
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
                      
                      <button
                        className="btn danger"
                        style={{ padding: '6px 12px', fontSize: 11 }}
                        onClick={() => handleRemoveWorker(w)}
                      >
                        Remove
                      </button>
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
