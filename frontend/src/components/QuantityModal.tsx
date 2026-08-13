import { useState, useEffect, useRef } from 'react';
import type { InventoryItem } from '../types';
import { X, Plus, Minus } from 'lucide-react';

interface QuantityModalProps {
  item: InventoryItem | null;
  mode: 'add' | 'drop' | null;
  onClose: () => void;
  onConfirm: (item: InventoryItem, qty: number, mode: 'add' | 'drop') => void;
}

export function QuantityModal({ item, mode, onClose, onConfirm }: QuantityModalProps) {
  const [qty, setQty] = useState('1');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset qty and auto-focus whenever modal opens
  useEffect(() => {
    if (item && mode) {
      setQty('1');
      setSaving(false);
      // Small delay to let CSS transition start, then focus
      setTimeout(() => inputRef.current?.select(), 100);
    }
  }, [item, mode]);

  if (!item || !mode) return null;

  const isAdd = mode === 'add';
  const parsed = parseInt(qty, 10);
  const isValid = !isNaN(parsed) && parsed > 0;
  const previewStock = isAdd
    ? item.stock + (isValid ? parsed : 0)
    : Math.max(0, item.stock - (isValid ? parsed : 0));

  const handleConfirm = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await onConfirm(item, parsed, mode);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) handleConfirm();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal qty-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-head">
          <div>
            <h2 className="modal-title">
              {isAdd ? 'Add Stock' : 'Drop Stock'}
            </h2>
            <p className="modal-sub">{item.part_name} · {item.car_model}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Current stock display */}
        <div className="qty-current-stock">
          <span className="qty-label">Current Stock</span>
          <span className="qty-stock-value">{item.stock}</span>
        </div>

        {/* Quantity input section */}
        <div className="qty-input-section">
          <label className="qty-label" htmlFor="qty-input">
            {isAdd ? 'Quantity to Add' : 'Quantity to Drop'}
          </label>
          <div className="qty-input-row">
            <button
              className="qty-step-btn"
              onClick={() => setQty(String(Math.max(1, (parsed || 1) - 1)))}
              disabled={!isValid || parsed <= 1}
            >
              <Minus size={16} />
            </button>
            <input
              id="qty-input"
              ref={inputRef}
              type="number"
              min="1"
              className="qty-input"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button
              className="qty-step-btn"
              onClick={() => setQty(String((parsed || 0) + 1))}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="qty-preview">
          <span className="qty-label">After this change</span>
          <span className={`qty-preview-value ${previewStock === 0 ? 'zero' : ''}`}>
            {item.stock} → {previewStock}
          </span>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn outline" onClick={onClose}>Cancel</button>
          <button
            className={`btn ${isAdd ? 'primary' : 'danger'}`}
            disabled={!isValid || saving}
            onClick={handleConfirm}
          >
            {saving ? 'Saving...' : isAdd ? `Add ${isValid ? parsed : ''} Unit${parsed !== 1 ? 's' : ''}` : `Drop ${isValid ? parsed : ''} Unit${parsed !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
