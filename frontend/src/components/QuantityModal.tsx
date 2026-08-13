import { useState, useEffect, useRef } from 'react';
import type { InventoryItem } from '../types';
import { X, Plus, Minus, Check } from 'lucide-react';

interface QuantityModalProps {
  item: InventoryItem | null;
  mode: 'add' | 'drop' | null;
  onClose: () => void;
  onConfirm: (item: InventoryItem, qty: number, mode: 'add' | 'drop') => Promise<void>;
}

export function QuantityModal({ item, mode, onClose, onConfirm }: QuantityModalProps) {
  const [quantity, setQuantity] = useState<string>('1');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdd = mode === 'add';

  useEffect(() => {
    if (item && mode) {
      setQuantity('1');
      setSubmitting(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [item, mode]);

  if (!item || !mode) return null;

  const numQty = parseInt(quantity, 10);
  const isValid = !isNaN(numQty) && numQty > 0 && (isAdd || numQty <= item.stock);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValid || submitting) return;

    try {
      setSubmitting(true);
      await onConfirm(item, numQty, mode);
      onClose();
    } catch (err) {
      console.error('Quantity update failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const presets = isAdd ? [1, 2, 5, 10, 20, 50] : [1, 2, 3, 5, 10].filter(n => n <= item.stock);

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                display: 'grid',
                placeItems: 'center',
                background: isAdd ? 'var(--front-soft)' : 'var(--red-soft)',
                color: isAdd ? 'var(--front)' : 'var(--red)',
              }}
            >
              {isAdd ? <Plus size={20} /> : <Minus size={20} />}
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: 20 }}>
                {isAdd ? 'Add Stock' : 'Drop Stock'}
              </h2>
              <div className="modal-sub">
                {item.part_name} · Current: <strong>{item.stock}</strong>
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={submitting}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Select or Enter Quantity to {isAdd ? 'Add' : 'Drop'}</label>

            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0 12px' }}>
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`chip-option ${numQty === p ? 'selected' : ''}`}
                  onClick={() => setQuantity(String(p))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isAdd ? `+${p}` : `-${p}`}
                </button>
              ))}
            </div>

            {/* Quantity Number Input */}
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                type="number"
                min="1"
                max={isAdd ? 99999 : item.stock}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter custom quantity"
                disabled={submitting}
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  padding: '12px 14px',
                  borderRadius: 10,
                  textAlign: 'center',
                }}
              />
            </div>
            {!isAdd && numQty > item.stock && (
              <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4, fontWeight: 600 }}>
                Cannot drop more than current stock ({item.stock})
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              className="btn"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              style={{
                flex: 1,
                justify: 'center',
                background: isAdd ? 'var(--front)' : 'var(--red)',
                borderColor: isAdd ? 'var(--front)' : 'var(--red)',
              }}
              disabled={!isValid || submitting}
            >
              <Check size={16} />
              {submitting
                ? 'Updating...'
                : `${isAdd ? 'Add' : 'Drop'} ${isValid ? numQty : ''} Unit${numQty !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
