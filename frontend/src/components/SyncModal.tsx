import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '../types';
import { toast } from 'sonner';

interface SyncModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SyncProgress {
  status: 'start' | 'progress' | 'done';
  current?: number;
  total?: number;
  id?: number;
  part_name?: string;
  oem_number?: string;
  old_price?: number;
  new_price?: number;
  error?: string;
}

interface PriceUpdate {
  id: number;
  part_name: string;
  oem_number: string;
  old_price: number;
  new_price: number;
}

export function SyncModal({ open, onClose, onSuccess }: SyncModalProps) {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [updates, setUpdates] = useState<PriceUpdate[]>([]);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!open) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setSyncing(false);
      setProgress(null);
      setUpdates([]);
      setDone(false);
    }
  }, [open]);

  const startSync = () => {
    setSyncing(true);
    setDone(false);
    setUpdates([]);
    setProgress({ status: 'start', current: 0, total: 0 });

    const token = localStorage.getItem('token');
    
    // Using fetch API to read stream to pass Authorization header
    fetch('http://localhost:8000/api/sync/prices', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(async (response) => {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (!reader) {
        toast.error('Failed to start sync stream');
        setSyncing(false);
        return;
      }

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep the incomplete part in the buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring('data: '.length);
            try {
              const data = JSON.parse(dataStr) as SyncProgress;
              
              if (data.status === 'done') {
                setDone(true);
                setSyncing(false);
                return;
              }

              setProgress(data);
              
              if (data.status === 'progress' && data.new_price !== undefined && data.new_price !== null) {
                if (data.old_price !== data.new_price) {
                  setUpdates(prev => {
                    // avoid duplicates
                    if (prev.find(u => u.id === data.id)) return prev;
                    return [...prev, {
                      id: data.id as number,
                      part_name: data.part_name as string,
                      oem_number: data.oem_number as string,
                      old_price: data.old_price as number,
                      new_price: data.new_price as number
                    }];
                  });
                }
              }
            } catch (e) {
              console.error('Error parsing SSE JSON:', e);
            }
          }
        }
      }
    }).catch(err => {
      console.error(err);
      toast.error('Sync failed');
      setSyncing(false);
    });
  };

  const handleApply = async () => {
    if (updates.length === 0) {
      onClose();
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch('http://localhost:8000/api/sync/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ updates: updates.map(u => ({ id: u.id, new_price: u.new_price })) })
      });
      
      if (!res.ok) throw new Error('Failed to apply prices');
      
      const data = await res.json();
      toast.success(`Successfully updated ${data.updated_count} prices`);
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Error applying prices');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 600, width: '100%' }}>
        <div className="modal-header">
          <h3>Sync Maruti Prices</h3>
          <button className="icon-btn" onClick={onClose} disabled={syncing || saving}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {!syncing && !done && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <RefreshCw size={48} color="var(--primary)" style={{ marginBottom: 16 }} />
              <h4 style={{ marginBottom: 8 }}>Ready to scan live prices?</h4>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
                This will check all your <strong>MGP Genuine</strong> parts against the official Maruti Suzuki Genuine Parts website.
                <br/>It processes 1 item per second to prevent rate limiting.
              </p>
              <button className="btn primary" onClick={startSync}>
                Start Sync
              </button>
            </div>
          )}

          {syncing && progress && progress.status !== 'start' && (
            <div style={{ padding: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                <span>Scanning: {progress.part_name} ({progress.oem_number})</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  background: 'var(--primary)', 
                  width: `${(progress.current || 0) / (progress.total || 1) * 100}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}

          {(done || updates.length > 0) && (
            <div style={{ marginTop: syncing ? 24 : 0 }}>
              <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                {done ? <CheckCircle2 size={16} color="var(--mgp)" /> : <RefreshCw size={16} className="spin" />}
                Found {updates.length} price difference{updates.length !== 1 && 's'}
              </h4>
              
              {updates.length > 0 ? (
                <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                      <tr>
                        <th style={{ padding: '8px 12px' }}>Part</th>
                        <th style={{ padding: '8px 12px' }}>Current</th>
                        <th style={{ padding: '8px 12px' }}>New (Live)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {updates.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ fontWeight: 600 }}>{u.oem_number}</div>
                            <div style={{ color: 'var(--muted)', fontSize: 11 }}>{u.part_name}</div>
                          </td>
                          <td style={{ padding: '8px 12px', color: 'var(--muted)' }}>
                            {formatPrice(u.old_price)}
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: u.new_price > u.old_price ? 'var(--danger)' : 'var(--mgp)' }}>
                            {formatPrice(u.new_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                done && <p style={{ color: 'var(--muted)', fontSize: 13 }}>All your MGP parts are already up to date with the latest prices!</p>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose} disabled={syncing || saving}>
            Cancel
          </button>
          {(done || updates.length > 0) && (
            <button className="btn primary" onClick={handleApply} disabled={updates.length === 0 || syncing || saving}>
              {saving ? 'Saving...' : `Apply ${updates.length} Updates`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
