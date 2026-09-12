import { mongoDb } from './mongodb.ts';
import { erpStore } from '../store/erpStore.ts';
import { products, shops } from '../store/memoryStore.ts';
import type { Product } from '../models/domain.ts';
import type {
  Batch,
  BatchStatus,
  GoodsReceivedNote,
  InventoryAudit,
  PurchaseOrder,
  PurchaseOrderStatus,
  StockMovement,
  StockTransfer,
  StockTransferStatus,
  Supplier,
  SupplierPayment
} from '../models/erp.ts';

function checkBatchStatus(batch: Batch): BatchStatus {
  if (batch.status === 'QUARANTINED') return 'QUARANTINED';
  if (batch.quantity <= 0) return 'DEPLETED';
  const now = new Date();
  const exp = new Date(batch.expiryDate);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'EXPIRED';
  if (diffDays <= 30) return 'NEAR_EXPIRY';
  return 'ACTIVE';
}

export async function findBatches(filter?: { shopId?: string; productId?: string; status?: string }): Promise<Batch[]> {
  const db = mongoDb();
  let list: Batch[];
  if (db) {
    const q: Record<string, unknown> = {};
    if (filter?.shopId) q.shopId = filter.shopId;
    if (filter?.productId) q.productId = filter.productId;
    if (filter?.status) q.status = filter.status;
    list = await db.collection<Batch>('batches').find(q).sort({ expiryDate: 1 }).toArray();
  } else {
    list = erpStore.batches.filter(b => {
      if (filter?.shopId && b.shopId !== filter.shopId) return false;
      if (filter?.productId && b.productId !== filter.productId) return false;
      if (filter?.status && b.status !== filter.status) return false;
      return true;
    }).sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  }

  // Update dynamic statuses if dates have crossed thresholds
  return list.map(b => {
    const dynamicStatus = checkBatchStatus(b);
    if (b.status !== dynamicStatus && b.status !== 'QUARANTINED') {
      b.status = dynamicStatus;
    }
    return b;
  });
}

export async function createBatch(batch: Batch): Promise<Batch> {
  const db = mongoDb();
  batch.status = checkBatchStatus(batch);
  if (db) {
    await db.collection<Batch>('batches').insertOne(batch);
  } else {
    erpStore.batches.unshift(batch);
  }
  return batch;
}

export async function updateBatch(id: string, updates: Partial<Batch>): Promise<Batch | null> {
  const db = mongoDb();
  if (db) {
    const res = await db.collection<Batch>('batches').findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    return res;
  }
  const idx = erpStore.batches.findIndex(b => b.id === id);
  if (idx === -1) return null;
  erpStore.batches[idx] = {
    ...erpStore.batches[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  return erpStore.batches[idx];
}

export async function recordStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement> {
  const id = `mov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const full: StockMovement = {
    ...movement,
    id,
    createdAt: new Date().toISOString()
  };
  const db = mongoDb();
  if (db) {
    await db.collection<StockMovement>('stockMovements').insertOne(full);
  } else {
    erpStore.stockMovements.unshift(full);
  }
  return full;
}

export async function findStockMovements(filter?: { shopId?: string; productId?: string; limit?: number }): Promise<StockMovement[]> {
  const db = mongoDb();
  const limit = filter?.limit ?? 100;
  if (db) {
    const q: Record<string, unknown> = {};
    if (filter?.shopId) q.shopId = filter.shopId;
    if (filter?.productId) q.productId = filter.productId;
    return db.collection<StockMovement>('stockMovements').find(q).sort({ createdAt: -1 }).limit(limit).toArray();
  }
  return erpStore.stockMovements.filter(m => {
    if (filter?.shopId && m.shopId !== filter.shopId) return false;
    if (filter?.productId && m.productId !== filter.productId) return false;
    return true;
  }).slice(0, limit);
}

// FEFO (First-Expired, First-Out) stock allocation
export async function allocateFefoStock(
  productId: string,
  shopId: string,
  quantityToAllocate: number,
  referenceId?: string,
  actorId: string = 'system'
): Promise<{ allocated: Array<{ batchId: string; batchNumber: string; quantity: number }>; remainingNeeded: number }> {
  const activeBatches = (await findBatches({ productId, shopId })).filter(
    b => (b.status === 'ACTIVE' || b.status === 'NEAR_EXPIRY') && b.quantity > 0
  ).sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

  let remainingNeeded = quantityToAllocate;
  const allocated: Array<{ batchId: string; batchNumber: string; quantity: number }> = [];

  for (const batch of activeBatches) {
    if (remainingNeeded <= 0) break;
    const canTake = Math.min(batch.quantity, remainingNeeded);
    batch.quantity -= canTake;
    batch.status = checkBatchStatus(batch);
    await updateBatch(batch.id, { quantity: batch.quantity, status: batch.status });

    allocated.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      quantity: canTake
    });

    remainingNeeded -= canTake;

    // Log movement
    await recordStockMovement({
      productId,
      productName: batch.productName,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      shopId,
      type: 'POS_SALE',
      delta: -canTake,
      resultingStock: batch.quantity,
      referenceId,
      notes: `FEFO allocation for batch ${batch.batchNumber}`,
      createdBy: actorId
    });
  }

  return { allocated, remainingNeeded };
}

// Quarantine or scrap a batch
export async function writeOffBatchStock(
  batchId: string,
  action: 'QUARANTINE' | 'EXPIRY_SCRAP' | 'DAMAGE',
  quantity: number,
  notes: string,
  actor: { id: string; role: string }
): Promise<Batch> {
  const batches = await findBatches();
  const batch = batches.find(b => b.id === batchId);
  if (!batch) throw new Error('Batch not found');
  if (quantity <= 0 || quantity > batch.quantity) throw new Error(`Invalid write-off quantity (available: ${batch.quantity})`);

  batch.quantity -= quantity;
  if (action === 'QUARANTINE') {
    batch.damagedQuantity = (batch.damagedQuantity || 0) + quantity;
    if (batch.quantity === 0) batch.status = 'QUARANTINED';
  } else {
    batch.damagedQuantity = (batch.damagedQuantity || 0) + quantity;
    batch.status = checkBatchStatus(batch);
  }

  await updateBatch(batch.id, {
    quantity: batch.quantity,
    damagedQuantity: batch.damagedQuantity,
    status: batch.status
  });

  // Also deduct from main product stock
  const db = mongoDb();
  if (db) {
    await db.collection<Product>('products').updateOne(
      { id: batch.productId, shopId: batch.shopId },
      { $inc: { stock: -quantity } }
    );
  } else {
    const prod = products.find(p => p.id === batch.productId && p.shopId === batch.shopId);
    if (prod) prod.stock = Math.max(0, prod.stock - quantity);
  }

  const movementType = action === 'EXPIRY_SCRAP' ? 'EXPIRY_SCRAP' : 'DAMAGE';
  await recordStockMovement({
    productId: batch.productId,
    productName: batch.productName,
    batchId: batch.id,
    batchNumber: batch.batchNumber,
    shopId: batch.shopId,
    type: movementType,
    delta: -quantity,
    resultingStock: batch.quantity,
    referenceId: batch.batchNumber,
    notes: `Write-off: ${action} - ${notes}`,
    createdBy: actor.id
  });

  return batch;
}

// Inter-Shop Stock Transfers
export async function findStockTransfers(filter?: { shopId?: string; status?: string }): Promise<StockTransfer[]> {
  const db = mongoDb();
  if (db) {
    const q: Record<string, unknown> = {};
    if (filter?.shopId) {
      q.$or = [{ sourceShopId: filter.shopId }, { destShopId: filter.shopId }];
    }
    if (filter?.status) q.status = filter.status;
    return db.collection<StockTransfer>('stockTransfers').find(q).sort({ createdAt: -1 }).toArray();
  }
  return erpStore.stockTransfers.filter(t => {
    if (filter?.shopId && t.sourceShopId !== filter.shopId && t.destShopId !== filter.shopId) return false;
    if (filter?.status && t.status !== filter.status) return false;
    return true;
  });
}

export async function createStockTransfer(transfer: StockTransfer): Promise<StockTransfer> {
  const db = mongoDb();
  if (db) {
    await db.collection<StockTransfer>('stockTransfers').insertOne(transfer);
  } else {
    erpStore.stockTransfers.unshift(transfer);
  }
  return transfer;
}

export async function updateStockTransferStatus(
  transferId: string,
  newStatus: StockTransferStatus,
  actor: { id: string; role: string }
): Promise<StockTransfer> {
  const transfers = await findStockTransfers();
  const transfer = transfers.find(t => t.id === transferId);
  if (!transfer) throw new Error('Transfer not found');

  const now = new Date().toISOString();
  transfer.status = newStatus;
  transfer.updatedAt = now;

  if (newStatus === 'APPROVED') {
    transfer.approvedBy = actor.id;
  } else if (newStatus === 'IN_TRANSIT') {
    transfer.dispatchedAt = now;
    // Deduct stock from source shop
    for (const item of transfer.items) {
      if (item.batchId) {
        const batch = (await findBatches()).find(b => b.id === item.batchId);
        if (batch) {
          batch.quantity = Math.max(0, batch.quantity - item.quantity);
          batch.status = checkBatchStatus(batch);
          await updateBatch(batch.id, { quantity: batch.quantity, status: batch.status });
        }
      }
      const db = mongoDb();
      if (db) {
        await db.collection<Product>('products').updateOne(
          { id: item.productId, shopId: transfer.sourceShopId },
          { $inc: { stock: -item.quantity } }
        );
      } else {
        const p = products.find(prod => prod.id === item.productId && prod.shopId === transfer.sourceShopId);
        if (p) p.stock = Math.max(0, p.stock - item.quantity);
      }

      await recordStockMovement({
        productId: item.productId,
        productName: item.productName,
        batchId: item.batchId,
        shopId: transfer.sourceShopId,
        type: 'TRANSFER_OUT',
        delta: -item.quantity,
        resultingStock: 0,
        referenceId: transfer.transferNumber,
        notes: `Dispatched to ${transfer.destShopName ?? transfer.destShopId}`,
        createdBy: actor.id
      });
    }
  } else if (newStatus === 'RECEIVED') {
    transfer.receivedAt = now;
    // Add stock to destination shop
    for (const item of transfer.items) {
      item.receivedQuantity = item.quantity;
      const db = mongoDb();
      if (db) {
        await db.collection<Product>('products').updateOne(
          { id: item.productId, shopId: transfer.destShopId },
          { $inc: { stock: item.quantity } }
        );
      } else {
        const p = products.find(prod => prod.id === item.productId && prod.shopId === transfer.destShopId);
        if (p) p.stock += item.quantity;
      }

      await recordStockMovement({
        productId: item.productId,
        productName: item.productName,
        shopId: transfer.destShopId,
        type: 'TRANSFER_IN',
        delta: item.quantity,
        resultingStock: item.quantity,
        referenceId: transfer.transferNumber,
        notes: `Received from ${transfer.sourceShopName ?? transfer.sourceShopId}`,
        createdBy: actor.id
      });
    }
  }

  const db = mongoDb();
  if (db) {
    await db.collection<StockTransfer>('stockTransfers').updateOne({ id: transferId }, { $set: transfer });
  } else {
    const idx = erpStore.stockTransfers.findIndex(t => t.id === transferId);
    if (idx !== -1) erpStore.stockTransfers[idx] = transfer;
  }

  return transfer;
}

// Physical Inventory Audits & Reconciliation
export async function findInventoryAudits(filter?: { shopId?: string }): Promise<InventoryAudit[]> {
  const db = mongoDb();
  if (db) {
    const q: Record<string, unknown> = {};
    if (filter?.shopId) q.shopId = filter.shopId;
    return db.collection<InventoryAudit>('inventoryAudits').find(q).sort({ createdAt: -1 }).toArray();
  }
  return erpStore.inventoryAudits.filter(a => !filter?.shopId || a.shopId === filter.shopId);
}

export async function createInventoryAudit(audit: InventoryAudit): Promise<InventoryAudit> {
  const db = mongoDb();
  if (db) {
    await db.collection<InventoryAudit>('inventoryAudits').insertOne(audit);
  } else {
    erpStore.inventoryAudits.unshift(audit);
  }
  return audit;
}

export async function reconcileInventoryAudit(auditId: string, actor: { id: string; role: string }): Promise<InventoryAudit> {
  const audits = await findInventoryAudits();
  const audit = audits.find(a => a.id === auditId);
  if (!audit) throw new Error('Audit not found');
  if (audit.status === 'RECONCILED') throw new Error('Audit is already reconciled');

  const now = new Date().toISOString();
  audit.status = 'RECONCILED';
  audit.reconciledBy = actor.id;
  audit.completedAt = now;

  for (const item of audit.items) {
    if (item.discrepancy !== 0) {
      const db = mongoDb();
      if (db) {
        await db.collection<Product>('products').updateOne(
          { id: item.productId, shopId: audit.shopId },
          { $set: { stock: item.countedStock } }
        );
      } else {
        const prod = products.find(p => p.id === item.productId && p.shopId === audit.shopId);
        if (prod) prod.stock = item.countedStock;
      }

      if (item.batchId) {
        await updateBatch(item.batchId, { quantity: item.countedStock });
      }

      await recordStockMovement({
        productId: item.productId,
        productName: item.productName,
        batchId: item.batchId,
        shopId: audit.shopId,
        type: 'RECONCILIATION',
        delta: item.discrepancy,
        resultingStock: item.countedStock,
        referenceId: audit.auditNumber,
        notes: `Audit reconciliation: ${item.reason || 'Physical count variance'}`,
        createdBy: actor.id
      });
    }
  }

  const db = mongoDb();
  if (db) {
    await db.collection<InventoryAudit>('inventoryAudits').updateOne({ id: auditId }, { $set: audit });
  } else {
    const idx = erpStore.inventoryAudits.findIndex(a => a.id === auditId);
    if (idx !== -1) erpStore.inventoryAudits[idx] = audit;
  }

  return audit;
}

// Suppliers
export async function findSuppliers(filter?: { active?: boolean }): Promise<Supplier[]> {
  const db = mongoDb();
  if (db) {
    const q: Record<string, unknown> = {};
    if (filter?.active !== undefined) q.active = filter.active;
    return db.collection<Supplier>('suppliers').find(q).sort({ name: 1 }).toArray();
  }
  return erpStore.suppliers.filter(s => filter?.active === undefined || s.active === filter.active);
}

export async function createSupplier(supplier: Supplier): Promise<Supplier> {
  const db = mongoDb();
  if (db) {
    await db.collection<Supplier>('suppliers').insertOne(supplier);
  } else {
    erpStore.suppliers.unshift(supplier);
  }
  return supplier;
}

export async function updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier | null> {
  const db = mongoDb();
  if (db) {
    return db.collection<Supplier>('suppliers').findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );
  }
  const idx = erpStore.suppliers.findIndex(s => s.id === id);
  if (idx === -1) return null;
  erpStore.suppliers[idx] = { ...erpStore.suppliers[idx], ...updates };
  return erpStore.suppliers[idx];
}

// Purchase Orders
export async function findPurchaseOrders(filter?: { shopId?: string; supplierId?: string; status?: string }): Promise<PurchaseOrder[]> {
  const db = mongoDb();
  if (db) {
    const q: Record<string, unknown> = {};
    if (filter?.shopId) q.shopId = filter.shopId;
    if (filter?.supplierId) q.supplierId = filter.supplierId;
    if (filter?.status) q.status = filter.status;
    return db.collection<PurchaseOrder>('purchaseOrders').find(q).sort({ createdAt: -1 }).toArray();
  }
  return erpStore.purchaseOrders.filter(po => {
    if (filter?.shopId && po.shopId !== filter.shopId) return false;
    if (filter?.supplierId && po.supplierId !== filter.supplierId) return false;
    if (filter?.status && po.status !== filter.status) return false;
    return true;
  });
}

export async function createPurchaseOrder(po: PurchaseOrder): Promise<PurchaseOrder> {
  const db = mongoDb();
  if (db) {
    await db.collection<PurchaseOrder>('purchaseOrders').insertOne(po);
  } else {
    erpStore.purchaseOrders.unshift(po);
  }
  return po;
}

export async function updatePurchaseOrderStatus(
  poId: string,
  newStatus: PurchaseOrderStatus,
  actor: { id: string; role: string },
  notes?: string
): Promise<PurchaseOrder> {
  const orders = await findPurchaseOrders();
  const po = orders.find(p => p.id === poId);
  if (!po) throw new Error('Purchase Order not found');

  const now = new Date().toISOString();
  po.status = newStatus;
  po.updatedAt = now;
  if (newStatus === 'APPROVED') {
    po.approvedBy = actor.id;
  }
  po.approvalHistory = po.approvalHistory || [];
  po.approvalHistory.push({
    status: newStatus,
    actorId: actor.id,
    timestamp: now,
    notes
  });

  const db = mongoDb();
  if (db) {
    await db.collection<PurchaseOrder>('purchaseOrders').updateOne({ id: poId }, { $set: po });
  } else {
    const idx = erpStore.purchaseOrders.findIndex(p => p.id === poId);
    if (idx !== -1) erpStore.purchaseOrders[idx] = po;
  }

  return po;
}

// Goods Received Notes (GRN)
export async function findGoodsReceivedNotes(filter?: { shopId?: string; poId?: string }): Promise<GoodsReceivedNote[]> {
  const db = mongoDb();
  if (db) {
    const q: Record<string, unknown> = {};
    if (filter?.shopId) q.shopId = filter.shopId;
    if (filter?.poId) q.purchaseOrderId = filter.poId;
    return db.collection<GoodsReceivedNote>('goodsReceivedNotes').find(q).sort({ createdAt: -1 }).toArray();
  }
  return erpStore.goodsReceivedNotes.filter(g => {
    if (filter?.shopId && g.shopId !== filter.shopId) return false;
    if (filter?.poId && g.purchaseOrderId !== filter.poId) return false;
    return true;
  });
}

export async function processGoodsReceipt(
  grn: GoodsReceivedNote,
  actor: { id: string; role: string }
): Promise<GoodsReceivedNote> {
  const poList = await findPurchaseOrders();
  const po = poList.find(p => p.id === grn.purchaseOrderId);
  if (!po) throw new Error('Associated Purchase Order not found');

  grn.status = 'PROCESSED';
  const now = new Date().toISOString();

  let totalAcceptedCost = 0;

  for (const item of grn.items) {
    if (item.acceptedQty > 0) {
      totalAcceptedCost += item.acceptedQty * item.unitCost;

      // 1. Create or update batch
      const batchId = `bat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newBatch: Batch = {
        id: batchId,
        batchNumber: item.batchNumber || `B-${Date.now().toString().slice(-6)}`,
        productId: item.productId,
        productName: item.productName,
        shopId: grn.shopId,
        mfgDate: item.mfgDate,
        expiryDate: item.expiryDate,
        supplierId: grn.supplierId,
        supplierName: grn.supplierName || po.supplierName,
        costPrice: item.unitCost,
        sellingPrice: Math.round(item.unitCost * 1.3), // default 30% margin preview
        quantity: item.acceptedQty,
        initialQuantity: item.acceptedQty,
        reservedQuantity: 0,
        damagedQuantity: item.rejectedQty,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now
      };
      await createBatch(newBatch);

      // 2. Increment product stock
      const db = mongoDb();
      if (db) {
        await db.collection<Product>('products').updateOne(
          { id: item.productId, shopId: grn.shopId },
          { $inc: { stock: item.acceptedQty } }
        );
      } else {
        const p = products.find(prod => prod.id === item.productId && prod.shopId === grn.shopId);
        if (p) p.stock += item.acceptedQty;
      }

      // 3. Record stock movement
      await recordStockMovement({
        productId: item.productId,
        productName: item.productName,
        batchId: newBatch.id,
        batchNumber: newBatch.batchNumber,
        shopId: grn.shopId,
        type: 'PO_RECEIPT',
        delta: item.acceptedQty,
        resultingStock: item.acceptedQty,
        referenceId: grn.grnNumber,
        notes: `Dock GRN receipt against PO ${grn.poNumber}`,
        createdBy: actor.id
      });
    }

    // 4. Update PO line item received quantities
    const poLine = po.items.find(pi => pi.productId === item.productId);
    if (poLine) {
      poLine.receivedQty = (poLine.receivedQty || 0) + item.acceptedQty;
    }
  }

  // 5. Update PO status
  const allCompleted = po.items.every(pi => pi.receivedQty >= pi.orderedQty);
  const nextPoStatus: PurchaseOrderStatus = allCompleted ? 'COMPLETED' : 'PARTIALLY_RECEIVED';
  await updatePurchaseOrderStatus(po.id, nextPoStatus, actor, `GRN ${grn.grnNumber} processed`);

  // 6. Increase supplier balance outstanding by invoice amount or total cost
  const netPayable = grn.invoiceAmount || totalAcceptedCost;
  const suppliers = await findSuppliers();
  const supplier = suppliers.find(s => s.id === grn.supplierId);
  if (supplier) {
    const newBal = (supplier.balanceOutstanding || 0) + netPayable;
    await updateSupplier(supplier.id, { balanceOutstanding: newBal });
  }

  // 7. Save GRN
  const db = mongoDb();
  if (db) {
    await db.collection<GoodsReceivedNote>('goodsReceivedNotes').insertOne(grn);
  } else {
    erpStore.goodsReceivedNotes.unshift(grn);
  }

  return grn;
}

// Supplier Payments
export async function findSupplierPayments(filter?: { supplierId?: string }): Promise<SupplierPayment[]> {
  const db = mongoDb();
  if (db) {
    const q: Record<string, unknown> = {};
    if (filter?.supplierId) q.supplierId = filter.supplierId;
    return db.collection<SupplierPayment>('supplierPayments').find(q).sort({ paymentDate: -1 }).toArray();
  }
  return erpStore.supplierPayments.filter(p => !filter?.supplierId || p.supplierId === filter.supplierId);
}

export async function createSupplierPayment(payment: SupplierPayment, actor: { id: string; role: string }): Promise<SupplierPayment> {
  const suppliers = await findSuppliers();
  const supplier = suppliers.find(s => s.id === payment.supplierId);
  if (!supplier) throw new Error('Supplier not found');

  const newBal = Math.max(0, (supplier.balanceOutstanding || 0) - payment.amount);
  await updateSupplier(supplier.id, { balanceOutstanding: newBal });

  const db = mongoDb();
  if (db) {
    await db.collection<SupplierPayment>('supplierPayments').insertOne(payment);
  } else {
    erpStore.supplierPayments.unshift(payment);
  }

  return payment;
}
