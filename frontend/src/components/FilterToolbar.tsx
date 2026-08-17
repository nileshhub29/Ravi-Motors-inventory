import { CAR_MODELS, VEHICLE_DATA } from '../types';
import { Filter, CarFront, SlidersHorizontal, Calendar } from 'lucide-react';
import { useMemo } from 'react';
import type { InventoryItem } from '../types';

interface FilterToolbarProps {
  modelFilter: string;
  setModelFilter: (val: string) => void;
  generationFilter: string;
  setGenerationFilter: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  qualityFilter: string;
  setQualityFilter: (val: string) => void;
  sideFilter: string;
  setSideFilter: (val: string) => void;
  items: InventoryItem[];
}

export function FilterToolbar({
  modelFilter, setModelFilter,
  generationFilter, setGenerationFilter,
  categoryFilter, setCategoryFilter,
  qualityFilter, setQualityFilter,
  sideFilter, setSideFilter,
  items,
}: FilterToolbarProps) {

  // Count parts per model
  const modelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item.car_model] = (counts[item.car_model] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Count parts per generation for selected model
  const genCounts = useMemo(() => {
    if (!modelFilter) return {};
    const counts: Record<string, number> = {};
    items.forEach(item => {
      if (item.car_model === modelFilter && item.generation_type) {
        counts[item.generation_type] = (counts[item.generation_type] || 0) + 1;
      }
    });
    return counts;
  }, [items, modelFilter]);

  const generations = modelFilter ? (VEHICLE_DATA[modelFilter]?.generations || []) : [];

  return (
    <>
      {/* ── Model Tabs ── */}
      <div className="model-tabs-section">
        <div className="model-tabs-header">
          <CarFront size={16} />
          <span>Vehicle Models</span>
          <span className="model-count-badge">{CAR_MODELS.length} models</span>
        </div>
        <div className="model-tabs-rail">
          <button
            className={`model-tab ${modelFilter === '' ? 'active' : ''}`}
            onClick={() => { setModelFilter(''); setGenerationFilter(''); }}
          >
            <span className="model-tab-name">All Vehicles</span>
            <span className="model-tab-count">{items.length}</span>
          </button>
          {CAR_MODELS.map((m) => (
            <button
              key={m}
              className={`model-tab ${modelFilter === m ? 'active' : ''}`}
              onClick={() => { setModelFilter(m); setGenerationFilter(''); }}
            >
              <span className="model-tab-name">{m}</span>
              <span className="model-tab-count">{modelCounts[m] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Generation Sub-tabs ── */}
      {modelFilter && generations.length > 0 && (
        <div className="gen-tabs-section">
          <div className="gen-tabs-header">
            <Calendar size={14} />
            <span>{modelFilter} — Types &amp; Generations</span>
          </div>
          <div className="gen-tabs-rail">
            <button
              className={`gen-tab ${generationFilter === '' ? 'active' : ''}`}
              onClick={() => setGenerationFilter('')}
            >
              All Types
              <span className="gen-tab-count">{Object.values(genCounts).reduce((a, b) => a + b, 0) || modelCounts[modelFilter] || 0}</span>
            </button>
            {generations.map((g) => (
              <button
                key={g}
                className={`gen-tab ${generationFilter === g ? 'active' : ''}`}
                onClick={() => setGenerationFilter(g)}
              >
                {g}
                <span className="gen-tab-count">{genCounts[g] || 0}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter Controls ── */}
      <div className="controls-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Filter size={14} /> Filters
        </div>

        <div className="seg">
          <button className={categoryFilter === '' ? 'active' : ''} onClick={() => setCategoryFilter('')}>All Categories</button>
          <button className={categoryFilter === 'Headlights' ? 'active' : ''} onClick={() => setCategoryFilter('Headlights')}>Headlights</button>
          <button className={categoryFilter === 'Backlights' ? 'active' : ''} onClick={() => setCategoryFilter('Backlights')}>Backlights</button>
          <button className={categoryFilter === 'Bumpers' ? 'active' : ''} onClick={() => setCategoryFilter('Bumpers')}>Bumpers</button>
        </div>

        <div className="seg">
          <button className={qualityFilter === '' ? 'active' : ''} onClick={() => setQualityFilter('')}>All Quality</button>
          <button className={`${qualityFilter === 'MGP Genuine' ? 'active q-mgp' : ''}`} onClick={() => setQualityFilter('MGP Genuine')}>MGP</button>
          <button className={`${qualityFilter === 'Local' || qualityFilter === 'Aftermarket' ? 'active q-amkt' : ''}`} onClick={() => setQualityFilter(qualityFilter === 'Local' ? '' : 'Local')}>Local</button>
        </div>

        <div className="seg">
          <button className={sideFilter === '' ? 'active' : ''} onClick={() => setSideFilter('')}>All Sides</button>
          <button className={`${sideFilter === 'LH' ? 'active s-lh' : ''}`} onClick={() => setSideFilter('LH')}>LH</button>
          <button className={`${sideFilter === 'RH' ? 'active s-rh' : ''}`} onClick={() => setSideFilter('RH')}>RH</button>
          <button className={`${sideFilter === 'Universal' ? 'active s-uni' : ''}`} onClick={() => setSideFilter('Universal')}>UNI</button>
        </div>

        <div className="action-group">
          {(modelFilter || generationFilter || categoryFilter || qualityFilter || sideFilter) && (
            <button
              className="btn"
              onClick={() => {
                setModelFilter('');
                setGenerationFilter('');
                setCategoryFilter('');
                setQualityFilter('');
                setSideFilter('');
              }}
            >
              <SlidersHorizontal size={14} /> Clear All
            </button>
          )}
        </div>
      </div>
    </>
  );
}
