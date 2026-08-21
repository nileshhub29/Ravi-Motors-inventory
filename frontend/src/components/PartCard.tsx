import type { InventoryItem } from '../types';
import { formatPrice, isLowStock, oppositeSide } from '../types';
import { Minus, Plus, Tag, Copy, Check, AlertTriangle, MapPin, Pencil, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../auth';

interface PartCardProps {
  item: InventoryItem;
  allItems: InventoryItem[];
  onAdjustStock: (item: InventoryItem, delta: number) => void;
  onEdit: (item: InventoryItem) => void;
  onSyncPrice?: (item: InventoryItem) => void;
}

export function PartCard({ item, allItems, onAdjustStock, onEdit, onSyncPrice }: PartCardProps) {
  const { isAdminOrOwner } = useAuth();
  const [copied, setCopied] = useState(false);
  const [stockVal, setStockVal] = useState<string>(String(item.stock));

  useEffect(() => {
    setStockVal(String(item.stock));
  }, [item.stock]);

  const handleStockBlurOrSubmit = () => {
    const num = parseInt(stockVal, 10);
    if (!isNaN(num) && num >= 0 && num !== item.stock) {
      onAdjustStock(item, num - item.stock);
    } else {
      setStockVal(String(item.stock));
    }
  };

  const low = isLowStock(item.stock, item.low_stock_threshold);
  const outOfStock = item.stock === 0;
  const stockClass = outOfStock ? 'zero' : low ? 'low' : '';

  const oppSide = oppositeSide(item.side);
  const oppositePart = oppSide
    ? allItems.find(
        (p) =>
          p.car_model === item.car_model &&
          p.generation_type === item.generation_type &&
          p.part_category === item.part_category &&
          p.position === item.position &&
          p.quality_tier === item.quality_tier &&
          p.side === oppSide
      )
    : null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(item.oem_number);
    setCopied(true);
    toast.success(`Copied ${item.oem_number}`);
    setTimeout(() => setCopied(false), 1200);
  };

  const scrollToOpposite = () => {
    if (!oppositePart) return;
    const el = document.getElementById(`part-${oppositePart.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.boxShadow = '0 0 0 3px var(--blue), var(--shadow-3)';
      setTimeout(() => { el.style.boxShadow = ''; }, 1500);
    }
  };

  let borderColor = 'var(--line)';
  if (item.position === 'Back' || item.position === 'Rear') borderColor = 'var(--red)';
  else if (item.position === 'Front') borderColor = 'var(--front)';

  return (
    <article
      id={`part-${item.id}`}
      className="part-card"
      style={{ borderTopColor: borderColor }}
    >
      <div className="part-meta">
        <div className="part-name">{item.part_name}</div>
        <div className="price-amt">{formatPrice(item.selling_price)}</div>
      </div>

      <div className="part-vehicle">
        <MapPin size={12} />
        {item.car_model} · {item.generation_type || 'All Generations'}
      </div>

      <div className="badge-row">
        {item.side !== 'FULL' && (
          <span className={`pos-pill ${item.side.toLowerCase()}`}>
            {item.side === 'LH' ? 'LH (Left)' : item.side === 'RH' ? 'RH (Right)' : item.side}
          </span>
        )}
        {item.position && item.position !== 'FULL' && (
          <span className={`pos-pill ${item.position.toLowerCase()}`}>
            {item.position === 'Front' ? 'Front' : 'Back / Rear'}
          </span>
        )}
        <span className={`pos-pill ${item.quality_tier === 'MGP Genuine' ? 'mgp' : 'aftermarket'}`}>
          {item.quality_tier === 'MGP Genuine' ? (
            <><Check size={12} /> MGP Genuine</>
          ) : (
            'Local'
          )}
        </span>
        {low && !outOfStock && (
          <span className="pos-pill low">
            <AlertTriangle size={12} /> Low Stock
          </span>
        )}
        {outOfStock && (
          <span className="pos-pill zero">
            <AlertTriangle size={12} /> Out of Stock
          </span>
        )}
      </div>

      <div className="oem-section">
        <div className="oem-left">
          <Tag size={16} color="var(--muted-2)" />
          <div>
            <div className="oem-label">OEM NUMBER</div>
            <div className="oem-val">{item.oem_number}</div>
          </div>
        </div>
        <button onClick={handleCopy} title="Copy OEM number">
          {copied ? <Check size={16} color="var(--mgp)" /> : <Copy size={16} color="var(--muted-2)" />}
        </button>
      </div>

      {isAdminOrOwner && item.quality_tier === 'MGP Genuine' && onSyncPrice && (
        <button
          onClick={() => onSyncPrice(item)}
          style={{
            width: '100%',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.02em',
            transition: 'opacity 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <RefreshCw size={13} />
          Sync Price from Maruti
        </button>
      )}

      {oppositePart && (
        <button className="pair-link" onClick={scrollToOpposite}>
          ⇆ Check {oppSide} Opposite Side
        </button>
      )}

      <div className="stock-row">
        <div className="stock-left">
          <div className="lbl">CURRENT STOCK</div>
          <input
            type="number"
            min="0"
            className={`val ${stockClass} stock-num-input`}
            value={stockVal}
            onChange={(e) => setStockVal(e.target.value)}
            onBlur={handleStockBlurOrSubmit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleStockBlurOrSubmit(); }}
            title="Click to type exact stock number directly"
          />
        </div>
        <div className="stepper">
          {isAdminOrOwner && (
            <button
              className="icon-btn"
              style={{ width: 40, height: 40, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--surface)', border: '1px solid var(--line)' }}
              onClick={() => onEdit(item)}
              title="Edit item"
            >
              <Pencil size={14} color="var(--ink)" />
            </button>
          )}
          <button
            className="minus"
            disabled={outOfStock}
            onClick={() => onAdjustStock(item, -1)}
            aria-label="Decrease stock"
          >
            <Minus size={18} />
          </button>
          <button
            className="plus"
            onClick={() => onAdjustStock(item, 1)}
            aria-label="Increase stock"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {item.compatible_models.length > 0 && (
        <div className="also-fits">
          <div className="also-fits-lbl">ALSO FITS:</div>
          <div className="also-fits-val">{item.compatible_models.join(', ')}</div>
        </div>
      )}
    </article>
  );
}
