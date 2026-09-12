import { useState, useEffect } from 'react';
import type { InventoryItem } from '../types';
import { CAR_MODELS, CATEGORIES, SIDES, QUALITY_TIERS, POSITIONS } from '../types';
import { X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { syncApi } from '../api';

interface ItemFormModalProps {
  open: boolean;
  item?: InventoryItem;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export function ItemFormModal({ open, item, onClose, onSave }: ItemFormModalProps) {
  const [formData, setFormData] = useState({
    part_name: '',
    car_model: CAR_MODELS[0] as string,
    generation_type: '',
    part_category: CATEGORIES[0],
    position: POSITIONS[0],
    side: SIDES[0],
    quality_tier: QUALITY_TIERS[0],
    oem_number: '',
    selling_price: 0,
    stock: 0,
    low_stock_threshold: 3,
    compatible_models: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  const handleFetchFromMaruti = async () => {
    if (!formData.oem_number.trim()) {
      toast.error('Please enter an OEM number first');
      return;
    }
    try {
      setLookingUp(true);
      const result = await syncApi.lookupOem(formData.oem_number);
      setFormData((prev) => ({
        ...prev,
        part_name: result.name || prev.part_name,
        selling_price: result.price ?? prev.selling_price,
        quality_tier: 'MGP Genuine',
      }));
      toast.success(`Found on Maruti: "${result.name}" @ ₹${result.price}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch details from Maruti website');
    } finally {
      setLookingUp(false);
    }
  };

  useEffect(() => {
    if (open) {
      if (item) {
        setFormData({
          part_name: item.part_name,
          car_model: item.car_model,
          generation_type: item.generation_type,
          part_category: item.part_category as any,
          position: item.position as any,
          side: item.side as any,
          quality_tier: item.quality_tier as any,
          oem_number: item.oem_number,
          selling_price: item.selling_price,
          stock: item.stock,
          low_stock_threshold: item.low_stock_threshold,
          compatible_models: item.compatible_models,
        });
      } else {
        setFormData({
          part_name: '',
          car_model: CAR_MODELS[0] as string,
          generation_type: '',
          part_category: CATEGORIES[0],
          position: POSITIONS[0],
          side: SIDES[0],
          quality_tier: QUALITY_TIERS[0],
          oem_number: '',
          selling_price: 0,
          stock: 0,
          low_stock_threshold: 3,
          compatible_models: [],
        });
      }
    }
  }, [open, item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const toggleCompatible = (model: string) => {
    setFormData((prev) => ({
      ...prev,
      compatible_models: prev.compatible_models.includes(model)
        ? prev.compatible_models.filter((m) => m !== model)
        : [...prev.compatible_models, model],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title">{item ? 'Edit Part' : 'Add New Part'}</h2>
            <div className="modal-sub">
              {item ? 'Update inventory details' : 'Add a new genuine or aftermarket part'}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field full">
              <label>Part Name *</label>
              <input name="part_name" required value={formData.part_name} onChange={handleChange} />
            </div>

            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ margin: 0 }}>OEM Number *</label>
                <button
                  type="button"
                  disabled={lookingUp || !formData.oem_number.trim()}
                  onClick={handleFetchFromMaruti}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#2563eb',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: 6,
                    padding: '2px 8px',
                    cursor: 'pointer',
                  }}
                  title="Auto-fill Part Name & Price directly from Maruti Suzuki website"
                >
                  <RefreshCw size={12} style={{ animation: lookingUp ? 'spin 1s linear infinite' : 'none' }} />
                  {lookingUp ? 'Fetching...' : 'Fetch from Maruti'}
                </button>
              </div>
              <input
                name="oem_number"
                required
                placeholder="e.g. 72470 M 55U00"
                value={formData.oem_number}
                onChange={handleChange}
              />
            </div>
            <div className="field">
              <label>Selling Price (₹) *</label>
              <input type="number" min="0" name="selling_price" required value={formData.selling_price} onChange={handleChange} />
            </div>

            <div className="field">
              <label>Vehicle Model *</label>
              <select name="car_model" value={formData.car_model} onChange={handleChange}>
                {CAR_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Generation / Type</label>
              <input name="generation_type" placeholder="e.g. Type 3 (2018-2021)" value={formData.generation_type} onChange={handleChange} />
            </div>

            <div className="field">
              <label>Category *</label>
              <select name="part_category" value={formData.part_category} onChange={handleChange}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Quality Tier *</label>
              <select name="quality_tier" value={formData.quality_tier} onChange={handleChange}>
                {QUALITY_TIERS.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>

            <div className="field">
              <label>Position *</label>
              <select name="position" value={formData.position} onChange={handleChange}>
                {POSITIONS.map((p: string) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Side *</label>
              <select name="side" value={formData.side} onChange={handleChange}>
                {SIDES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="field">
              <label>Current Stock</label>
              <input type="number" min="0" name="stock" value={formData.stock} onChange={handleChange} />
            </div>
            <div className="field">
              <label>Low Stock Threshold</label>
              <input type="number" min="0" name="low_stock_threshold" value={formData.low_stock_threshold} onChange={handleChange} />
            </div>

            <div className="field full">
              <label>Compatible Models (Cross-fit)</label>
              <div className="chip-select" style={{ marginTop: 6 }}>
                {CAR_MODELS.filter((m) => m !== formData.car_model).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`chip-option ${formData.compatible_models.includes(m) ? 'selected' : ''}`}
                    onClick={() => toggleCompatible(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Part'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
