const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function shopkeeperRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('freshcart_token');
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function submitShopkeeperCsv<T = { referenceId: string; rowCount: number; status: string }>(
  fileName: string,
  csv: string
): Promise<T> {
  return shopkeeperRequest<T>('/onboarding/sales-imports', {
    method: 'POST',
    body: JSON.stringify({ fileName, csv })
  });
}

export async function adminSalesImports<T = any[]>(): Promise<T> {
  return shopkeeperRequest<T>('/admin/sales-imports');
}

export async function adminApproveCsv<T = { referenceId: string; shopId: string; appliedRows: number; status: string }>(
  referenceId: string
): Promise<T> {
  return shopkeeperRequest<T>(`/admin/sales-imports/${encodeURIComponent(referenceId)}/approve`, {
    method: 'POST'
  });
}

export async function adminRejectCsv<T = any>(
  referenceId: string,
  reason: string = 'Rejected during review'
): Promise<T> {
  return shopkeeperRequest<T>(`/admin/sales-imports/${encodeURIComponent(referenceId)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
}
