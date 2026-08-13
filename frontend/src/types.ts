// ============================================================
// types.ts — Shared types, constants, and utility functions
// ============================================================

export type AppRole = 'owner' | 'admin' | 'staff';

export const VEHICLE_DATA: Record<string, { name: string; generations: string[] }> = {
  'Swift':        { name: 'Swift',        generations: ['Type 1 (2005–2010)', 'Type 2 (2011–2017)', 'Type 3 (2018–2021)', 'Type 4 (2022+)'] },
  'Dzire':        { name: 'Dzire',        generations: ['Type 1 (2008–2012)', 'Type 2 (2012–2017)', 'Type 3 (2017–2020)', 'Type 4 (2020+)'] },
  'Baleno':       { name: 'Baleno',       generations: ['Type 1 (2015–2022)', 'Type 2 (2022+)'] },
  'WagonR':       { name: 'WagonR',       generations: ['Type 1 (1999–2010)', 'Type 2 (2010–2019)', 'Type 3 (2019+)'] },
  'Alto':         { name: 'Alto',         generations: ['Alto 800', 'Alto K10 (New)', 'Alto Original'] },
  'Alto K10':     { name: 'Alto K10',     generations: ['Alto K10 (New)', 'Alto K10 (Old)'] },
  'Celerio':      { name: 'Celerio',      generations: ['Type 1 (2014–2021)', 'Type 2 (2021+)'] },
  'Ciaz':         { name: 'Ciaz',         generations: ['Type 1 (2014–2018)', 'Type 2 (2018+)'] },
  'Ertiga':       { name: 'Ertiga',       generations: ['Type 1 (2012–2018)', 'Type 2 (2018+)'] },
  'XL6':          { name: 'XL6',          generations: ['Type 1 (2019–2022)', 'Type 2 (2022+)'] },
  'Eeco':         { name: 'Eeco',         generations: ['5-Seater', '7-Seater'] },
  'Ritz':         { name: 'Ritz',         generations: ['Type 1 (2009–2017)'] },
  'Brezza':       { name: 'Brezza',       generations: ['Type 1 (2016–2022)', 'Type 2 (2022+)'] },
  'Fronx':        { name: 'Fronx',        generations: ['Type 1 (2023+)'] },
  'Grand Vitara': { name: 'Grand Vitara', generations: ['Type 1 (2022+)'] },
  'Ignis':        { name: 'Ignis',        generations: ['Type 1 (2017+)'] },
  'S-Presso':     { name: 'S-Presso',     generations: ['Type 1 (2019+)'] },
  'Super Carry':  { name: 'Super Carry',  generations: ['Type 1 (Commercial)'] },
};

export const CAR_MODELS = Object.keys(VEHICLE_DATA);

export const CATEGORIES = ['Headlights', 'Backlights', 'Bumpers'] as const;
export const SIDES = ['LH', 'RH', 'Universal'] as const;
export const QUALITY_TIERS = ['MGP Genuine', 'Aftermarket'] as const;
export const POSITIONS = ['Front', 'Back'] as const;

export interface InventoryItem {
  id: number;
  part_name: string;
  car_model: string;
  generation_type: string;
  part_category: string;
  position: string;
  side: string;
  quality_tier: string;
  oem_number: string;
  selling_price: number;
  stock: number;
  low_stock_threshold: number;
  compatible_models: string[];
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  worker_name: string;
  worker_role: string;
  part_name: string;
  oem_number: string;
  car_model: string;
  generation_type: string;
  action_type: string;
  reason: string;
  previous_stock: number | null;
  new_stock: number | null;
  delta: number | null;
  created_at: string;
}

export interface Worker {
  id: number;
  user_id: number;
  name: string;
  role: string;
  created_at: string;
}

export interface UserInfo {
  id: number;
  email: string;
  name: string;
  role: AppRole;
}

export interface DashboardStats {
  total_stock_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  thirty_day_action_count: number;
  fastest_moving: { part_name: string; car_model: string; total_issued: number }[];
  reorder_list: InventoryItem[];
  stock_value_by_model: { car_model: string; total_value: number }[];
  category_quality_mix: { part_category: string; quality_tier: string; count: number }[];
  worker_activity: { worker_name: string; action_count: number }[];
}

export const STOCK_REASONS = [
  { id: 'sale', label: 'Customer Sale', description: 'Item billed out', icon: 'shopping-cart' },
  { id: 'received', label: 'Stock Received', description: 'From supplier / inward', icon: 'package' },
  { id: 'damaged', label: 'Damaged / Returned', description: 'Write-off / customer return', icon: 'alert-triangle' },
  { id: 'audit', label: 'Manual Audit Correction', description: 'Physical count correction', icon: 'edit-3' },
] as const;

export function isLowStock(stock: number, threshold: number): boolean {
  return stock <= threshold;
}

export function oppositeSide(side: string): string | null {
  if (side === 'LH') return 'RH';
  if (side === 'RH') return 'LH';
  return null;
}

export function formatPrice(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return '';

  let cleanIso = iso.trim().replace(' ', 'T');
  if (!cleanIso.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(cleanIso)) {
    cleanIso += 'Z';
  }

  const d = new Date(cleanIso);
  if (isNaN(d.getTime())) return iso;

  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isToday) return `Today · ${time}`;
  if (isYesterday) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${time}`;
}

export function getLogTagClass(actionType: string, reason: string): string {
  if (actionType === 'item_added') return 'added';
  if (actionType === 'item_deleted') return 'deleted';
  if (actionType === 'item_updated') return 'updated';
  if (reason.toLowerCase().includes('sale')) return 'sale';
  if (reason.toLowerCase().includes('received')) return 'received';
  if (reason.toLowerCase().includes('damaged') || reason.toLowerCase().includes('return')) return 'damaged';
  return 'audit';
}
