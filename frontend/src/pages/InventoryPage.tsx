import { useState, useEffect, useMemo } from 'react';
import type { InventoryItem } from '../types';
import { inventoryApi } from '../api';
import { useWebSocket } from '../ws';
import { Header } from '../components/Header';
import { FilterToolbar } from '../components/FilterToolbar';
import { PartCard } from '../components/PartCard';
import { ItemFormModal } from '../components/ItemFormModal';
import { QuantityModal } from '../components/QuantityModal';
import { AuditLogDrawer } from '../components/AuditLogDrawer';
import { TeamModal } from '../components/TeamModal';
import { toast } from 'sonner';

export function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [model, setModel] = useState('');
  const [generation, setGeneration] = useState('');
  const [category, setCategory] = useState('');
  const [quality, setQuality] = useState('');
  const [side, setSide] = useState('');

  // Modals / Drawers
  const [auditOpen, setAuditOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>();
  const [qtyModal, setQtyModal] = useState<{ item: InventoryItem; mode: 'add' | 'drop' } | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.list();
      setItems(data);
    } catch (err: any) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Realtime updates
  useWebSocket((event) => {
    if (event.type === 'inventory_updated' || event.type === 'inventory_added') {
      const updatedItem = event.data as InventoryItem;
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.id === updatedItem.id);
        if (idx >= 0) {
          const newItems = [...prev];
          newItems[idx] = updatedItem;
          return newItems;
        }
        return [updatedItem, ...prev];
      });
    } else if (event.type === 'inventory_deleted') {
      setItems((prev) => prev.filter((i) => i.id !== event.data.id));
    }
  });

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (model && item.car_model !== model) return false;
      if (generation && item.generation_type !== generation) return false;
      if (category && item.part_category !== category) return false;
      if (quality) {
        if (quality === 'Local' && item.quality_tier !== 'Local' && item.quality_tier !== 'Aftermarket') return false;
        if (quality !== 'Local' && item.quality_tier !== quality) return false;
      }
      if (side && item.side !== side) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!item.part_name.toLowerCase().includes(q) &&
            !item.oem_number.toLowerCase().includes(q) &&
            !item.car_model.toLowerCase().includes(q) &&
            !(item.generation_type && item.generation_type.toLowerCase().includes(q))) {
          return false;
        }
      }
      return true;
    });
  }, [items, search, model, generation, category, quality, side]);

  const lowStockCount = items.filter(i => i.stock <= i.low_stock_threshold).length;

  const handleSaveForm = async (data: any) => {
    if (editingItem) {
      await inventoryApi.update(editingItem.id, data);
      toast.success('Part updated successfully');
    } else {
      await inventoryApi.create(data);
      toast.success('Part added successfully');
    }
    setFormOpen(false);
    setEditingItem(undefined);
  };

  const handleAdjustStock = async (item: InventoryItem, delta: number) => {
    if (delta === 0) return;
    const newStock = Math.max(0, item.stock + delta);

    // Optimistically update local UI state immediately
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, stock: newStock } : i))
    );

    try {
      const mode = delta > 0 ? 'Added' : 'Dropped';
      const qty = Math.abs(delta);
      const reason = `${mode} ${qty} unit${qty > 1 ? 's' : ''} directly`;
      await inventoryApi.adjustStock(item.id, delta, reason);
      toast.success(`${mode} ${qty} unit${qty > 1 ? 's' : ''} (${item.part_name})`);
    } catch (err: any) {
      toast.error('Failed to adjust stock');
      fetchItems();
    }
  };

  const handleQtyConfirm = async (item: InventoryItem, qty: number, mode: 'add' | 'drop') => {
    const delta = mode === 'add' ? qty : -qty;
    await handleAdjustStock(item, delta);
  };

  return (
    <>
      <Header
        lowStockCount={lowStockCount}
        searchValue={search}
        onSearchChange={setSearch}
        onOpenAuditLog={() => setAuditOpen(true)}
        onAddItem={() => { setEditingItem(undefined); setFormOpen(true); }}
        onOpenTeam={() => setTeamOpen(true)}
      />

      <main className="page-body app">

        <FilterToolbar
          modelFilter={model} setModelFilter={setModel}
          generationFilter={generation} setGenerationFilter={setGeneration}
          categoryFilter={category} setCategoryFilter={setCategory}
          qualityFilter={quality} setQualityFilter={setQuality}
          sideFilter={side} setSideFilter={setSide}
          items={items}
        />

        {loading && items.length === 0 ? (
          <div className="empty">
            <h3>Loading inventory...</h3>
            <p>Fetching real-time stock data</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty">
            <h3>No parts found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="parts-grid">
            {filteredItems.map(item => (
              <PartCard
                key={item.id}
                item={item}
                allItems={items}
                onAdjustStock={(item, delta) => setQtyModal({ item, mode: delta > 0 ? 'add' : 'drop' })}
                onEdit={(item) => { setEditingItem(item); setFormOpen(true); }}
              />
            ))}
          </div>
        )}
      </main>

      <AuditLogDrawer open={auditOpen} onClose={() => setAuditOpen(false)} />
      
      <ItemFormModal
        open={formOpen}
        item={editingItem}
        onClose={() => { setFormOpen(false); setEditingItem(undefined); }}
        onSave={handleSaveForm}
      />

      <QuantityModal
        item={qtyModal?.item || null}
        mode={qtyModal?.mode || null}
        onClose={() => setQtyModal(null)}
        onConfirm={handleQtyConfirm}
      />

      <TeamModal open={teamOpen} onClose={() => setTeamOpen(false)} />
    </>
  );
}
