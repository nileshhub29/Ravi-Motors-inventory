import { useState } from 'react';
import { X, RefreshCw, CheckCircle2, ArrowUp, ArrowDown } from 'lucide-react';
import { formatPrice } from '../types';
import { API_BASE } from '../api';
import { toast } from 'sonner';

interface SyncResult {
  found: boolean;
  item_id: number;
  oem_number: string;
  part_name?: string;
  maruti_name?: string;
  maruti_sku?: string;
  current_price: number;
  maruti_price: number | null;
  price_changed?: boolean;
  difference?: number;
  in_stock?: boolean;
  message?: string;
}

interface SyncModalProps {
  open: boolean;
  itemId: number | null;
  itemName: string;
  oemNumber: string;
  currentPrice: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function SyncModal({ open, itemId, itemName, oemNumber, currentPrice, onClose, onSuccess }: SyncModalProps) {
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const handleCheck = async () => {
    if (!itemId) return;
    setChecking(true);
    setResult(null);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/sync/check/${itemId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to check price');
      }
      
      const data = await res.json() as SyncResult;
      setResult(data);
    } catch (e: any) {
      toast.error(e.message || 'Error checking price');
    } finally {
      setChecking(false);
    }
  };

  const handleApply = async () => {
    if (!itemId) return;
    setApplying(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/sync/apply/${itemId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to apply price');
      }
      
      const data = await res.json();
      toast.success(`Price updated: ${formatPrice(data.old_price)} → ${formatPrice(data.new_price)}`);
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Error applying price');
    } finally {
      setApplying(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setChecking(false);
    setApplying(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 480, width: '100%' }}>
        <div className="modal-header">
          <h3>Sync Price from Maruti</h3>
          <button className="icon-btn" onClick={handleClose} disabled={checking || applying}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Part info */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{itemName}</div>
            <div style={{ color: 'var(--muted)', fontSize: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              <span>OEM: <strong>{oemNumber}</strong></span>
              <span>Current: <strong>{formatPrice(currentPrice)}</strong></span>
            </div>
          </div>

          {/* Not yet checked */}
          {!result && !checking && (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <RefreshCw size={40} color="var(--primary)" style={{ marginBottom: 12 }} />
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
                Check the live MRP for this part on the official<br/>Maruti Suzuki Genuine Parts website.
              </p>
              <button className="btn primary" onClick={handleCheck}>
                Check Live Price
              </button>
            </div>
          )}

          {/* Loading */}
          {checking && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <RefreshCw size={32} color="var(--primary)" className="spin" style={{ marginBottom: 12 }} />
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Fetching live price from marutisuzuki.com...</p>
            </div>
          )}

          {/* Result: Not found */}
          {result && !result.found && (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <p style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: 8 }}>Part not found</p>
              <p style={{ color: 'var(--muted)', fontSize: 12 }}>
                OEM number <strong>{oemNumber}</strong> was not found on Maruti's website. Check if the OEM number is correct.
              </p>
            </div>
          )}

          {/* Result: Found */}
          {result && result.found && (
            <div>
              {/* Maruti match info */}
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                Matched: <strong>{result.maruti_sku}</strong> — {result.maruti_name}
              </div>
              
              {/* Price comparison */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '16px 20px',
                gap: 12
              }}>
                {/* Current price */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Price</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{formatPrice(result.current_price)}</div>
                </div>
                
                {/* Arrow */}
                <div style={{ fontSize: 20, color: 'var(--muted)' }}>→</div>
                
                {/* Maruti price */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Maruti MRP</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: result.price_changed ? (result.difference! > 0 ? 'var(--danger)' : 'var(--mgp)') : 'var(--ink)' }}>
                    {formatPrice(result.maruti_price!)}
                  </div>
                </div>
              </div>

              {/* Difference badge */}
              {result.price_changed ? (
                <div style={{ 
                  marginTop: 12, 
                  padding: '8px 12px', 
                  borderRadius: 8, 
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: result.difference! > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                  color: result.difference! > 0 ? 'var(--danger)' : 'var(--mgp)',
                }}>
                  {result.difference! > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  Price {result.difference! > 0 ? 'increased' : 'decreased'} by {formatPrice(Math.abs(result.difference!))}
                </div>
              ) : (
                <div style={{ 
                  marginTop: 12, 
                  padding: '8px 12px', 
                  borderRadius: 8, 
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(34,197,94,0.1)',
                  color: 'var(--mgp)',
                }}>
                  <CheckCircle2 size={14} />
                  Price is already up to date!
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button className="btn" onClick={handleClose} disabled={checking || applying}>
            {result && result.found && !result.price_changed ? 'Done' : 'Cancel'}
          </button>
          {result && result.found && result.price_changed && (
            <button className="btn primary" onClick={handleApply} disabled={applying}>
              {applying ? 'Updating...' : `Update to ${formatPrice(result.maruti_price!)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
