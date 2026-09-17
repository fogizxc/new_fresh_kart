const configuredApiUrl = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL : undefined;
const API_BASE = (import.meta.env.PROD ? '/api' : (configuredApiUrl || '/api')).replace(/\/$/, '');

function persistSessionCookie(token: string) {
  if (typeof document === 'undefined' || !token) return;
  document.cookie = `freshcart_session=${encodeURIComponent(token)}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}

async function shopkeeperRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('freshcart_token');
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) { headers.set('Authorization', `Bearer ${token}`); persistSessionCookie(token); }
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function submitShopkeeperCsv<T = { referenceId: string; rowCount: number; status: string }>(fileName: string, csv: string): Promise<T> { return shopkeeperRequest<T>('/onboarding/sales-imports', { method: 'POST', body: JSON.stringify({ fileName, csv }) }); }
export async function adminSalesImports<T = any[]>(): Promise<T> { return shopkeeperRequest<T>('/admin/sales-imports'); }
export async function adminApproveCsv<T = { referenceId: string; shopId: string; appliedRows: number; status: string }>(referenceId: string): Promise<T> { return shopkeeperRequest<T>(`/admin/sales-imports/${encodeURIComponent(referenceId)}/approve`, { method: 'POST' }); }
export async function adminRejectCsv<T = any>(referenceId: string, reason: string = 'Rejected during review'): Promise<T> { return shopkeeperRequest<T>(`/admin/sales-imports/${encodeURIComponent(referenceId)}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }); }
export async function clearShopkeeperInventory<T = { success: boolean; clearType: string; affectedCount: number; message: string }>(clearType: 'zero_stock' | 'remove_all', password: string, reason?: string): Promise<T> { return shopkeeperRequest<T>('/shopkeeper-portal/inventory/clear', { method: 'POST', body: JSON.stringify({ clearType, password, reason }) }); }
export async function updateShopkeeperProduct<T = any>(id: string, updates: Record<string, unknown>): Promise<T> { return shopkeeperRequest<T>(`/shopkeeper-portal/products/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(updates) }); }
export async function batchUpdateShopkeeperProducts<T = { success: boolean; updatedCount: number }>(items: Array<Record<string, unknown> & { id: string }>): Promise<T> { return shopkeeperRequest<T>('/shopkeeper-portal/products/batch', { method: 'PATCH', body: JSON.stringify({ items }) }); }
export async function createShopkeeperProduct<T = any>(product: Record<string, unknown> & { name: string; category: string; unit: string; mrp: number; sellingPrice: number; stock: number }): Promise<T> { return shopkeeperRequest<T>('/shopkeeper-portal/products', { method: 'POST', body: JSON.stringify(product) }); }

export interface StaffSalaryStructure { monthlyBase: number; dailyRate?: number; allowances: number; deductions: number; paymentMethod?: 'UPI' | 'CASH' | 'BANK_TRANSFER'; upiId?: string; bankAccountNo?: string; bankIfsc?: string; paidLeavesAllowance?: number; overtimeHourlyRate?: number; commissionPerDelivery?: number; }
export interface StaffSalaryPayment { id: string; staffId: string; shopId: string; month: string; baseAmount: number; bonusAmount: number; allowances: number; advanceDeduction: number; otherDeductions: number; workingDays?: number; presentDays?: number; halfDays?: number; overtimeHours?: number; overtimeAmount?: number; deliveryCount?: number; commissionAmount?: number; tipAmount?: number; netPaid: number; paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER'; paymentDate: string; referenceNumber?: string; status: 'PAID' | 'PENDING' | 'PARTIAL'; notes?: string; recordedBy?: string; createdAt: string; }
export interface StaffAdvance { id: string; staffId: string; shopId: string; amount: number; reason: string; date: string; settled: boolean; settledAmount: number; recordedBy?: string; createdAt: string; }
export interface ShopStaffMember { id: string; name: string; email: string; phone: string; role: 'employee' | 'store_manager'; shopId?: string; active: boolean; designation: string; shift: string; joiningDate: string; emergencyContact?: string; kioskPin?: string; allowedModules?: Array<'pos' | 'orders' | 'inventory' | 'delivery' | 'all'>; salaryStructure: StaffSalaryStructure; totalAdvanceOutstanding: number; latestPayment: StaffSalaryPayment | null; attendanceThisMonth: { present: number; halfDay: number; absent: number; leave: number; }; performance?: { ordersHandled: number; rating: number; commissionEarned: number; tipsEarned: number; }; }
export async function getShopStaffList(shopId?: string): Promise<ShopStaffMember[]> { return shopkeeperRequest(`/shopkeeper-portal/staff${shopId ? `?shopId=${encodeURIComponent(shopId)}` : ''}`); }
export async function createShopStaff(data: Record<string, unknown>): Promise<any> { return shopkeeperRequest('/shopkeeper-portal/staff', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateShopStaff(id: string, updates: Record<string, unknown>): Promise<any> { return shopkeeperRequest(`/shopkeeper-portal/staff/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(updates) }); }
export async function deleteShopStaff(id: string): Promise<any> { return shopkeeperRequest(`/shopkeeper-portal/staff/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
export async function getStaffSalariesAndAdvances(staffId: string): Promise<any> { return shopkeeperRequest(`/shopkeeper-portal/staff/${encodeURIComponent(staffId)}/salaries`); }
export async function recordStaffSalaryPayment(staffId: string, payment: Record<string, unknown>): Promise<any> { return shopkeeperRequest(`/shopkeeper-portal/staff/${encodeURIComponent(staffId)}/salaries`, { method: 'POST', body: JSON.stringify(payment) }); }
export async function issueStaffSalaryAdvance(staffId: string, data: Record<string, unknown>): Promise<any> { return shopkeeperRequest(`/shopkeeper-portal/staff/${encodeURIComponent(staffId)}/advances`, { method: 'POST', body: JSON.stringify(data) }); }
export async function getShopStaffAttendance(month?: string): Promise<any> { return shopkeeperRequest(`/shopkeeper-portal/staff/attendance${month ? `?month=${encodeURIComponent(month)}` : ''}`); }
export async function markShopStaffAttendance(data: Record<string, unknown>): Promise<any> { return shopkeeperRequest('/shopkeeper-portal/staff/attendance/mark', { method: 'POST', body: JSON.stringify(data) }); }
export async function punchStaffKiosk(data: Record<string, unknown>): Promise<any> { return shopkeeperRequest('/shopkeeper-portal/staff/kiosk-punch', { method: 'POST', body: JSON.stringify(data) }); }
export function getPayrollExportUrl(month: string, type: 'payroll' | 'neft' = 'payroll'): string { return `/api/shopkeeper-portal/staff/payroll-export?month=${encodeURIComponent(month)}&type=${encodeURIComponent(type)}`; }
