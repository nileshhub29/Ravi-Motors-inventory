import type { AuditLog } from '../types';
import { formatTimestamp, getLogTagClass } from '../types';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auditApi } from '../api';
import { useWebSocket } from '../ws';

interface AuditLogDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AuditLogDrawer({ open, onClose }: AuditLogDrawerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await auditApi.list();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open]);

  // Listen for realtime audit logs
  useWebSocket((event) => {
    if (event.type === 'audit_log') {
      // Refresh logs if the drawer is open to get full data
      if (open) fetchLogs();
    }
  });

  return (
    <>
      <div className={`drawer-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-head">
          <div>
            <h2 className="drawer-title">Activity Log</h2>
            <div className="drawer-sub">Recent stock adjustments</div>
          </div>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {loading && logs.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>No recent activity.</div>
          ) : (
            logs.map((log) => {
              const tagClass = getLogTagClass(log.action_type, log.reason);
              const initials = log.worker_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

              return (
                <div key={log.id} className="log-entry">
                  <div className="log-avatar">{initials}</div>
                  <div className="log-content">
                    <div className="log-meta">
                      <strong>{log.worker_name}</strong>
                      <span className="log-dot" />
                      <span>{formatTimestamp(log.created_at)}</span>
                      <span className={`log-tag ${tagClass}`} style={{ marginLeft: 'auto' }}>
                        {log.action_type === 'stock_decreased' ? 'OUT' :
                         log.action_type === 'stock_increased' ? 'IN' :
                         log.action_type.replace('item_', '')}
                      </span>
                    </div>

                    <div className="log-line">
                      <b>{log.part_name}</b> ({log.car_model})
                    </div>
                    {log.previous_stock != null && log.new_stock != null ? (
                      <div className="log-line" style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink-2)' }}>
                        Stock: {log.previous_stock} → {log.new_stock}
                      </div>
                    ) : log.new_stock != null ? (
                      <div className="log-line" style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink-2)' }}>
                        Stock: {log.new_stock} units
                      </div>
                    ) : null}
                    {log.reason && (
                      <div className="log-line" style={{ color: 'var(--muted)', fontSize: 11, fontStyle: 'italic' }}>
                        "{log.reason}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
