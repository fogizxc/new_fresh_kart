import type {
  Batch,
  GoodsReceivedNote,
  InventoryAudit,
  PurchaseOrder,
  StockMovement,
  StockTransfer,
  Supplier,
  SupplierPayment
} from '../models/erp.ts';

const now = new Date();
const iso = (d: Date) => d.toISOString();
const dateStr = (offsetDays: number) => {
  const d = new Date(now.getTime() + offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
};

export const initialSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'FarmFresh Agritech Ltd',
    contactPerson: 'Ramesh Patel',
    email: 'ramesh@farmfreshagri.in',
    phone: '9820198201',
    gstin: '07AAAAF1234A1Z5',
    pan: 'AAAAF1234A',
    address: 'Plot 44, Okhla Phase III',
    city: 'New Delhi',
    state: 'Delhi',
    paymentTermsDays: 30,
    balanceOutstanding: 14250,
    active: true,
    category: 'Fresh Produce & Fruits',
    createdAt: iso(new Date(Date.now() - 60 * 86400000))
  },
  {
    id: 'sup-2',
    name: 'Heritage Dairy Cooperative',
    contactPerson: 'Suman Sen',
    email: 'procurement@heritagedairy.coop',
    phone: '9811234567',
    gstin: '07AAACH5678B1Z2',
    pan: 'AAACH5678B',
    address: 'Sector 18, Industrial Area',
    city: 'Gurugram',
    state: 'Haryana',
    paymentTermsDays: 15,
    balanceOutstanding: 8900,
    active: true,
    category: 'Dairy & Beverages',
    createdAt: iso(new Date(Date.now() - 45 * 86400000))
  },
  {
    id: 'sup-3',
    name: 'Golden Harvest Organic Millers',
    contactPerson: 'Vikram Joshi',
    email: 'sales@goldenharvest.in',
    phone: '9876543210',
    gstin: '07AABCG9012C1Z8',
    pan: 'AABCG9012C',
    address: 'Warehouse 12, Kundli Logistics Hub',
    city: 'Sonipat',
    state: 'Haryana',
    paymentTermsDays: 45,
    balanceOutstanding: 22400,
    active: true,
    category: 'Pantry & Bakery',
    createdAt: iso(new Date(Date.now() - 90 * 86400000))
  }
];

export const initialBatches: Batch[] = [
  {
    id: 'bat-101',
    batchNumber: 'B-MIL-2609A',
    productId: 'p-3',
    productName: 'Farm Fresh Milk',
    sku: 'DR-MIL-001',
    shopId: 'shop-1',
    mfgDate: dateStr(-2),
    expiryDate: dateStr(3), // Expiring in 3 days -> NEAR_EXPIRY
    supplierId: 'sup-2',
    supplierName: 'Heritage Dairy Cooperative',
    costPrice: 48,
    sellingPrice: 64,
    quantity: 25,
    initialQuantity: 50,
    reservedQuantity: 0,
    damagedQuantity: 0,
    status: 'NEAR_EXPIRY',
    createdAt: iso(new Date(Date.now() - 2 * 86400000)),
    updatedAt: iso(now)
  },
  {
    id: 'bat-102',
    batchNumber: 'B-MIL-2609B',
    productId: 'p-3',
    productName: 'Farm Fresh Milk',
    sku: 'DR-MIL-001',
    shopId: 'shop-1',
    mfgDate: dateStr(-1),
    expiryDate: dateStr(7), // Later expiry
    supplierId: 'sup-2',
    supplierName: 'Heritage Dairy Cooperative',
    costPrice: 48,
    sellingPrice: 64,
    quantity: 40,
    initialQuantity: 40,
    reservedQuantity: 0,
    damagedQuantity: 0,
    status: 'ACTIVE',
    createdAt: iso(new Date(Date.now() - 86400000)),
    updatedAt: iso(now)
  },
  {
    id: 'bat-103',
    batchNumber: 'B-BRD-2609A',
    productId: 'p-4',
    productName: 'Organic Brown Bread',
    sku: 'PN-BRD-001',
    shopId: 'shop-1',
    mfgDate: dateStr(-3),
    expiryDate: dateStr(2), // Expiring in 2 days -> NEAR_EXPIRY
    supplierId: 'sup-3',
    supplierName: 'Golden Harvest Organic Millers',
    costPrice: 38,
    sellingPrice: 55,
    quantity: 7,
    initialQuantity: 20,
    reservedQuantity: 0,
    damagedQuantity: 0,
    status: 'NEAR_EXPIRY',
    createdAt: iso(new Date(Date.now() - 3 * 86400000)),
    updatedAt: iso(now)
  },
  {
    id: 'bat-104',
    batchNumber: 'B-MNG-2609A',
    productId: 'p-1',
    productName: 'Alphonso Mangoes',
    sku: 'FR-MNG-001',
    shopId: 'shop-1',
    mfgDate: dateStr(-4),
    expiryDate: dateStr(10),
    supplierId: 'sup-1',
    supplierName: 'FarmFresh Agritech Ltd',
    costPrice: 140,
    sellingPrice: 189,
    quantity: 42,
    initialQuantity: 60,
    reservedQuantity: 0,
    damagedQuantity: 0,
    status: 'ACTIVE',
    createdAt: iso(new Date(Date.now() - 4 * 86400000)),
    updatedAt: iso(now)
  },
  {
    id: 'bat-105',
    batchNumber: 'B-SPN-2609A',
    productId: 'p-2',
    productName: 'Baby Spinach',
    sku: 'VG-SPN-001',
    shopId: 'shop-1',
    mfgDate: dateStr(-1),
    expiryDate: dateStr(4),
    supplierId: 'sup-1',
    supplierName: 'FarmFresh Agritech Ltd',
    costPrice: 26,
    sellingPrice: 42,
    quantity: 18,
    initialQuantity: 25,
    reservedQuantity: 0,
    damagedQuantity: 0,
    status: 'ACTIVE',
    createdAt: iso(new Date(Date.now() - 86400000)),
    updatedAt: iso(now)
  }
];

export const initialStockMovements: StockMovement[] = [
  {
    id: 'mov-1',
    productId: 'p-3',
    productName: 'Farm Fresh Milk',
    batchId: 'bat-101',
    batchNumber: 'B-MIL-2609A',
    shopId: 'shop-1',
    type: 'PO_RECEIPT',
    delta: 50,
    resultingStock: 50,
    referenceId: 'GRN-202609-001',
    notes: 'Initial receipt from Heritage Dairy',
    createdBy: 'u-2',
    createdAt: iso(new Date(Date.now() - 2 * 86400000))
  },
  {
    id: 'mov-2',
    productId: 'p-3',
    productName: 'Farm Fresh Milk',
    batchId: 'bat-101',
    batchNumber: 'B-MIL-2609A',
    shopId: 'shop-1',
    type: 'SALE',
    delta: -25,
    resultingStock: 25,
    referenceId: 'ORD-1002',
    notes: 'Customer dispatch',
    createdBy: 'system',
    createdAt: iso(new Date(Date.now() - 86400000))
  },
  {
    id: 'mov-3',
    productId: 'p-3',
    productName: 'Farm Fresh Milk',
    batchId: 'bat-102',
    batchNumber: 'B-MIL-2609B',
    shopId: 'shop-1',
    type: 'PO_RECEIPT',
    delta: 40,
    resultingStock: 65,
    referenceId: 'GRN-202609-002',
    notes: 'Received fresh lot',
    createdBy: 'u-2',
    createdAt: iso(new Date(Date.now() - 86400000))
  }
];

export const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-101',
    poNumber: 'PO-202609-001',
    supplierId: 'sup-2',
    supplierName: 'Heritage Dairy Cooperative',
    shopId: 'shop-1',
    items: [
      {
        productId: 'p-3',
        productName: 'Farm Fresh Milk',
        sku: 'DR-MIL-001',
        orderedQty: 50,
        unitCost: 48,
        taxRate: 5,
        hsnCode: '0401',
        receivedQty: 50,
        totalCost: 2520 // 50 * 48 * 1.05
      }
    ],
    subtotal: 2400,
    taxAmount: 120,
    totalAmount: 2520,
    status: 'COMPLETED',
    notes: 'Regular morning dairy supply',
    expectedDeliveryDate: dateStr(0),
    createdBy: 'u-2',
    approvedBy: 'u-4',
    createdAt: iso(new Date(Date.now() - 3 * 86400000)),
    updatedAt: iso(new Date(Date.now() - 2 * 86400000))
  },
  {
    id: 'po-102',
    poNumber: 'PO-202609-002',
    supplierId: 'sup-1',
    supplierName: 'FarmFresh Agritech Ltd',
    shopId: 'shop-1',
    items: [
      {
        productId: 'p-1',
        productName: 'Alphonso Mangoes',
        sku: 'FR-MNG-001',
        orderedQty: 40,
        unitCost: 135,
        taxRate: 0,
        hsnCode: '0804',
        receivedQty: 0,
        totalCost: 5400
      },
      {
        productId: 'p-2',
        productName: 'Baby Spinach',
        sku: 'VG-SPN-001',
        orderedQty: 30,
        unitCost: 25,
        taxRate: 0,
        hsnCode: '0709',
        receivedQty: 0,
        totalCost: 750
      }
    ],
    subtotal: 6150,
    taxAmount: 0,
    totalAmount: 6150,
    status: 'APPROVED',
    notes: 'Fresh greens and mango lot for weekend rush',
    expectedDeliveryDate: dateStr(1),
    createdBy: 'u-2',
    approvedBy: 'u-4',
    createdAt: iso(new Date(Date.now() - 86400000)),
    updatedAt: iso(now)
  }
];

export const initialGoodsReceivedNotes: GoodsReceivedNote[] = [
  {
    id: 'grn-101',
    grnNumber: 'GRN-202609-001',
    purchaseOrderId: 'po-101',
    poNumber: 'PO-202609-001',
    supplierId: 'sup-2',
    supplierName: 'Heritage Dairy Cooperative',
    shopId: 'shop-1',
    items: [
      {
        productId: 'p-3',
        productName: 'Farm Fresh Milk',
        orderedQty: 50,
        receivedQty: 50,
        acceptedQty: 50,
        rejectedQty: 0,
        unitCost: 48,
        batchNumber: 'B-MIL-2609A',
        mfgDate: dateStr(-2),
        expiryDate: dateStr(3)
      }
    ],
    invoiceNumber: 'INV-HD-9081',
    invoiceAmount: 2520,
    receivedBy: 'u-2',
    status: 'PROCESSED',
    notes: 'Received in refrigerated van, cold chain maintained',
    receivedAt: iso(new Date(Date.now() - 2 * 86400000)),
    createdAt: iso(new Date(Date.now() - 2 * 86400000))
  }
];

export const initialSupplierPayments: SupplierPayment[] = [
  {
    id: 'sp-101',
    paymentNumber: 'PAY-202609-001',
    supplierId: 'sup-2',
    supplierName: 'Heritage Dairy Cooperative',
    purchaseOrderId: 'po-101',
    poNumber: 'PO-202609-001',
    amount: 2520,
    paymentMode: 'NEFT',
    referenceNumber: 'NEFT9081829374',
    paymentDate: dateStr(-1),
    status: 'PAID',
    notes: 'Payment settled against INV-HD-9081',
    recordedBy: 'u-4',
    createdAt: iso(new Date(Date.now() - 86400000))
  }
];

export const initialStockTransfers: StockTransfer[] = [
  {
    id: 'trf-101',
    transferNumber: 'TRF-202609-001',
    sourceShopId: 'shop-1',
    sourceShopName: 'GreenLeaf Market',
    destShopId: 'shop-2',
    destShopName: 'Daily Basket',
    items: [
      {
        productId: 'p-1',
        productName: 'Alphonso Mangoes',
        batchId: 'bat-104',
        batchNumber: 'B-MNG-2609A',
        quantity: 10,
        receivedQuantity: 10
      }
    ],
    status: 'RECEIVED',
    notes: 'Stock balancing transfer for high demand in Lajpat Nagar',
    requestedBy: 'u-2',
    approvedBy: 'u-4',
    dispatchedAt: iso(new Date(Date.now() - 24 * 3600000)),
    receivedAt: iso(new Date(Date.now() - 12 * 3600000)),
    createdAt: iso(new Date(Date.now() - 26 * 3600000)),
    updatedAt: iso(new Date(Date.now() - 12 * 3600000))
  }
];

export const initialInventoryAudits: InventoryAudit[] = [
  {
    id: 'aud-101',
    auditNumber: 'AUD-202609-001',
    shopId: 'shop-1',
    title: 'Weekly Fresh Produce Stock Count',
    status: 'RECONCILED',
    items: [
      {
        productId: 'p-1',
        productName: 'Alphonso Mangoes',
        sku: 'FR-MNG-001',
        batchId: 'bat-104',
        batchNumber: 'B-MNG-2609A',
        systemStock: 44,
        countedStock: 42,
        discrepancy: -2,
        reason: 'Transit shrinkage / slight weight loss'
      },
      {
        productId: 'p-2',
        productName: 'Baby Spinach',
        sku: 'VG-SPN-001',
        batchId: 'bat-105',
        batchNumber: 'B-SPN-2609A',
        systemStock: 18,
        countedStock: 18,
        discrepancy: 0,
        reason: 'Exact match'
      }
    ],
    conductedBy: 'u-2',
    reconciledBy: 'u-4',
    notes: 'Discrepancy reconciled to reflect actual shelf weight',
    createdAt: iso(new Date(Date.now() - 3 * 86400000)),
    completedAt: iso(new Date(Date.now() - 3 * 86400000))
  }
];

// In-memory active stores for fallback and runtime
export const erpStore = {
  suppliers: [...initialSuppliers],
  batches: [...initialBatches],
  stockMovements: [...initialStockMovements],
  purchaseOrders: [...initialPurchaseOrders],
  goodsReceivedNotes: [...initialGoodsReceivedNotes],
  supplierPayments: [...initialSupplierPayments],
  stockTransfers: [...initialStockTransfers],
  inventoryAudits: [...initialInventoryAudits]
};
