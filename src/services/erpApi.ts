export type BatchStatus = 'ACTIVE' | 'NEAR_EXPIRY' | 'EXPIRED' | 'DEPLETED' | 'QUARANTINED';

export interface ApiBatch {
  id: string;
  batchNumber: string;
  productId: string;
  productName?: string;
  sku?: string;
  shopId: string;
  mfgDate: string;
  expiryDate: string;
  supplierId?: string;
  supplierName?: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  initialQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  status: BatchStatus;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType =
  | 'PO_RECEIPT'
  | 'SALE'
  | 'POS_SALE'
  | 'RETURN'
  | 'DAMAGE'
  | 'EXPIRY_SCRAP'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'RECONCILIATION';

export interface ApiStockMovement {
  id: string;
  productId: string;
  productName?: string;
  batchId?: string;
  batchNumber?: string;
  shopId: string;
  type: StockMovementType;
  delta: number;
  resultingStock: number;
  referenceId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export type StockTransferStatus = 'REQUESTED' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'REJECTED' | 'CANCELLED';

export interface ApiStockTransferItem {
  productId: string;
  productName: string;
  batchId?: string;
  batchNumber?: string;
  quantity: number;
  receivedQuantity?: number;
}

export interface ApiStockTransfer {
  id: string;
  transferNumber: string;
  sourceShopId: string;
  sourceShopName?: string;
  destShopId: string;
  destShopName?: string;
  items: ApiStockTransferItem[];
  status: StockTransferStatus;
  notes?: string;
  requestedBy: string;
  approvedBy?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryAuditStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'RECONCILED';

export interface ApiInventoryAuditItem {
  productId: string;
  productName: string;
  sku: string;
  batchId?: string;
  batchNumber?: string;
  systemStock: number;
  countedStock: number;
  discrepancy: number;
  reason?: string;
}

export interface ApiInventoryAudit {
  id: string;
  auditNumber: string;
  shopId: string;
  title: string;
  status: InventoryAuditStatus;
  items: ApiInventoryAuditItem[];
  conductedBy: string;
  reconciledBy?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ApiSupplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstin: string;
  pan?: string;
  address: string;
  city: string;
  state: string;
  paymentTermsDays: number;
  balanceOutstanding: number;
  active: boolean;
  category?: string;
  createdAt: string;
}

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'PARTIALLY_RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ApiPurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  unitCost: number;
  taxRate: number;
  hsnCode?: string;
  receivedQty: number;
  totalCost: number;
}

export interface ApiPurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  shopId: string;
  items: ApiPurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: PurchaseOrderStatus;
  notes?: string;
  expectedDeliveryDate?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiGoodsReceivedNoteItem {
  productId: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  rejectionReason?: string;
  unitCost: number;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
}

export interface ApiGoodsReceivedNote {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName?: string;
  shopId: string;
  items: ApiGoodsReceivedNoteItem[];
  invoiceNumber?: string;
  invoiceAmount?: number;
  receivedBy: string;
  status: 'DRAFT' | 'VERIFIED' | 'PROCESSED';
  notes?: string;
  receivedAt: string;
  createdAt: string;
}

export interface ApiSupplierPayment {
  id: string;
  paymentNumber: string;
  supplierId: string;
  supplierName?: string;
  purchaseOrderId?: string;
  poNumber?: string;
  amount: number;
  paymentMode: 'NEFT' | 'RTGS' | 'UPI' | 'CHEQUE' | 'CASH';
  referenceNumber: string;
  paymentDate: string;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('freshcart_token');
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const erpApi = {
  // Phase 1: Advanced Inventory & Batch/Expiry
  batches: {
    list: (params?: { shopId?: string; productId?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.shopId) q.set('shopId', params.shopId);
      if (params?.productId) q.set('productId', params.productId);
      if (params?.status) q.set('status', params.status);
      return request<ApiBatch[]>(`/api/erp/inventory/batches?${q.toString()}`);
    },
    create: (data: Partial<ApiBatch>) =>
      request<ApiBatch>('/api/erp/inventory/batches', { method: 'POST', body: JSON.stringify(data) }),
    writeOff: (id: string, action: 'QUARANTINE' | 'EXPIRY_SCRAP' | 'DAMAGE', quantity: number, notes?: string) =>
      request<ApiBatch>(`/api/erp/inventory/batches/${id}/write-off`, {
        method: 'POST',
        body: JSON.stringify({ action, quantity, notes })
      }),
    fefoPreview: (productId: string, quantity: number, shopId?: string) =>
      request<{
        productId: string;
        requestedQuantity: number;
        allocatedTotal: number;
        shortfall: number;
        allocationPlan: Array<{ batch: ApiBatch; allocatedQty: number }>;
      }>('/api/erp/inventory/fefo-preview', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity, shopId })
      })
  },
  movements: {
    list: (params?: { shopId?: string; productId?: string }) => {
      const q = new URLSearchParams();
      if (params?.shopId) q.set('shopId', params.shopId);
      if (params?.productId) q.set('productId', params.productId);
      return request<ApiStockMovement[]>(`/api/erp/inventory/movements?${q.toString()}`);
    }
  },
  transfers: {
    list: (params?: { shopId?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.shopId) q.set('shopId', params.shopId);
      if (params?.status) q.set('status', params.status);
      return request<ApiStockTransfer[]>(`/api/erp/inventory/transfers?${q.toString()}`);
    },
    create: (data: Partial<ApiStockTransfer>) =>
      request<ApiStockTransfer>('/api/erp/inventory/transfers', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: StockTransferStatus) =>
      request<ApiStockTransfer>(`/api/erp/inventory/transfers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
  },
  audits: {
    list: (shopId?: string) =>
      request<ApiInventoryAudit[]>(`/api/erp/inventory/audits${shopId ? `?shopId=${shopId}` : ''}`),
    create: (data: Partial<ApiInventoryAudit>) =>
      request<ApiInventoryAudit>('/api/erp/inventory/audits', { method: 'POST', body: JSON.stringify(data) }),
    reconcile: (id: string) =>
      request<ApiInventoryAudit>(`/api/erp/inventory/audits/${id}/reconcile`, { method: 'POST' })
  },

  // Phase 2: Supplier & Procurement
  suppliers: {
    list: () => request<ApiSupplier[]>('/api/erp/procurement/suppliers'),
    create: (data: Partial<ApiSupplier>) =>
      request<ApiSupplier>('/api/erp/procurement/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ApiSupplier>) =>
      request<ApiSupplier>(`/api/erp/procurement/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },
  purchaseOrders: {
    list: (params?: { shopId?: string; supplierId?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.shopId) q.set('shopId', params.shopId);
      if (params?.supplierId) q.set('supplierId', params.supplierId);
      if (params?.status) q.set('status', params.status);
      return request<ApiPurchaseOrder[]>(`/api/erp/procurement/purchase-orders?${q.toString()}`);
    },
    create: (data: Partial<ApiPurchaseOrder> & { autoSubmit?: boolean }) =>
      request<ApiPurchaseOrder>('/api/erp/procurement/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: PurchaseOrderStatus, notes?: string) =>
      request<ApiPurchaseOrder>(`/api/erp/procurement/purchase-orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      })
  },
  grn: {
    list: (params?: { shopId?: string; poId?: string }) => {
      const q = new URLSearchParams();
      if (params?.shopId) q.set('shopId', params.shopId);
      if (params?.poId) q.set('poId', params.poId);
      return request<ApiGoodsReceivedNote[]>(`/api/erp/procurement/grn?${q.toString()}`);
    },
    process: (data: Partial<ApiGoodsReceivedNote>) =>
      request<ApiGoodsReceivedNote>('/api/erp/procurement/grn', { method: 'POST', body: JSON.stringify(data) })
  },
  payments: {
    list: (supplierId?: string) =>
      request<ApiSupplierPayment[]>(`/api/erp/procurement/payments${supplierId ? `?supplierId=${supplierId}` : ''}`),
    record: (data: Partial<ApiSupplierPayment>) =>
      request<ApiSupplierPayment>('/api/erp/procurement/payments', { method: 'POST', body: JSON.stringify(data) })
  }
};
