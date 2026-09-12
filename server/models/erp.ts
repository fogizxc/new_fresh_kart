export type BatchStatus = 'ACTIVE' | 'NEAR_EXPIRY' | 'EXPIRED' | 'DEPLETED' | 'QUARANTINED';

export interface Batch {
  id: string;
  batchNumber: string;
  productId: string;
  productName?: string;
  sku?: string;
  shopId: string;
  mfgDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
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

export interface StockMovement {
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

export interface StockTransferItem {
  productId: string;
  productName: string;
  batchId?: string;
  batchNumber?: string;
  quantity: number;
  receivedQuantity?: number;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  sourceShopId: string;
  sourceShopName?: string;
  destShopId: string;
  destShopName?: string;
  items: StockTransferItem[];
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

export interface InventoryAuditItem {
  productId: string;
  productName: string;
  sku: string;
  batchId?: string;
  batchNumber?: string;
  systemStock: number;
  countedStock: number;
  discrepancy: number; // countedStock - systemStock
  reason?: string;
}

export interface InventoryAudit {
  id: string;
  auditNumber: string;
  shopId: string;
  title: string;
  status: InventoryAuditStatus;
  items: InventoryAuditItem[];
  conductedBy: string;
  reconciledBy?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Supplier {
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

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  unitCost: number;
  taxRate: number; // e.g., 5 for 5%
  hsnCode?: string;
  receivedQty: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  shopId: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: PurchaseOrderStatus;
  notes?: string;
  expectedDeliveryDate?: string;
  createdBy: string;
  approvedBy?: string;
  approvalHistory?: Array<{
    status: PurchaseOrderStatus;
    actorId: string;
    timestamp: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export type GoodsReceiptStatus = 'DRAFT' | 'VERIFIED' | 'PROCESSED';

export interface GoodsReceivedNoteItem {
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

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName?: string;
  shopId: string;
  items: GoodsReceivedNoteItem[];
  invoiceNumber?: string;
  invoiceAmount?: number;
  receivedBy: string;
  status: GoodsReceiptStatus;
  notes?: string;
  receivedAt: string;
  createdAt: string;
}

export type SupplierPaymentMode = 'NEFT' | 'RTGS' | 'UPI' | 'CHEQUE' | 'CASH';

export interface SupplierPayment {
  id: string;
  paymentNumber: string;
  supplierId: string;
  supplierName?: string;
  purchaseOrderId?: string;
  poNumber?: string;
  amount: number;
  paymentMode: SupplierPaymentMode;
  referenceNumber: string;
  paymentDate: string;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  notes?: string;
  recordedBy: string;
  createdAt: string;
}
