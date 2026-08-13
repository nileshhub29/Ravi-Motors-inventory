// ============================================================
// api.ts — Fetch wrapper for FastAPI backend
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth';
    throw new Error('Unauthorized');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

// --- Auth ---
export const authApi = {
  signup: (email: string, password: string, name: string) =>
    request<{ token: string; user: any }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<any>('/api/auth/me'),
  updateRole: (userId: number, role: string) =>
    request<any>(`/api/auth/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  removeWorker: (userId: number) =>
    request<void>(`/api/auth/users/${userId}`, {
      method: 'DELETE',
    }),
};

// --- Inventory ---
export const inventoryApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/api/inventory${query}`);
  },
  create: (data: any) =>
    request<any>('/api/inventory', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/api/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/api/inventory/${id}`, { method: 'DELETE' }),
  adjustStock: (id: number, delta: number, reason: string) =>
    request<any>(`/api/inventory/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ delta, reason }),
    }),
};

// --- Audit Logs ---
export const auditApi = {
  list: () => request<any[]>('/api/audit-logs'),
};

// --- Workers ---
export const workersApi = {
  list: () => request<any[]>('/api/workers'),
};

// --- Dashboard ---
export const dashboardApi = {
  stats: () => request<any>('/api/dashboard'),
};

// --- WebSocket URL ---
export function getWsUrl(): string {
  const base = API_BASE.replace(/^http/, 'ws');
  return `${base}/ws`;
}
