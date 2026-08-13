import { useState } from 'react';
import type { InventoryItem } from '../types';
import { STOCK_REASONS } from '../types';
import { X, ShoppingCart, Package, AlertTriangle, Edit3 } from 'lucide-react';

interface ReasonModalProps {
  item: InventoryItem | null;
  delta: number;
  onClose: () => void;
  onConfirm: (reason: string, customReason?: string) => Promise<void>;
}

export function ReasonModal({ item, delta, onClose, onConfirm }: ReasonModalProps) {
  const [customText, setCustomText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isAddition = delta > 0;

  if (!item) return null;

  const validReasons = STOCK_REASONS.filter((r) => {
    if (isAddition) return ['received', 'audit', 'damaged'].includes(r.id);
    return ['sale', 'audit', 'damaged'].includes(r.id);
  });

  const getIcon = (id: string) => {
    switch (id) {
      case 'sale': return <ShoppingCart size={18} />;
      case 'received': return <Package size={18} />;
      case 'damaged': return <AlertTriangle size={18} />;
      case 'audit': return <Edit3 size={18} />;
      default: return null;
    }
  };

  const handleSelect = async (reasonLabel: string) => {
    try {
      setSubmitting(true);
      await onConfirm(reasonLabel, customText || undefined);
      setCustomText('');
      onClose();
    } catch (err) {
      console.error('Stock adjust failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // modal-backdrop wraps modal so `.modal-backdrop.open .modal` CSS rule applies
    <div className="modal-backdrop open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title">
              {isAddition ? 'Add Stock' : 'Reduce Stock'}
            </h2>
            <div className="modal-sub">
              {isAddition
                ? `Adding ${delta} unit${delta !== 1 ? 's' : ''} to ${item.part_name}`
                : `Removing ${Math.abs(delta)} unit${Math.abs(delta) !== 1 ? 's' : ''} from ${item.part_name}`}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={submitting}><X size={20} /></button>
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Optional Note / Invoice #</label>
          <input
            type="text"
            placeholder="e.g. Invoice INV-001 or Supplier name"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            disabled={submitting}
            autoFocus
          />
        </div>

        <div className="field" style={{ marginBottom: 8 }}>
          <label>Select Reason</label>
        </div>
        <div className="reason-grid">
          {validReasons.map((r) => (
            <button
              key={r.id}
              className="reason-card"
              onClick={() => handleSelect(r.label)}
              disabled={submitting}
            >
              <div className="ico">{getIcon(r.id)}</div>
              <div className="info">
                <b>{r.label}</b>
                <span>{r.description}</span>
              </div>
            </button>
          ))}
        </div>

        {submitting && (
          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
            Saving...
          </p>
        )}
      </div>
    </div>
  );
}
