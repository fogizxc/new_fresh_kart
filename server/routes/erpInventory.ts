import { Router } from 'express';
import { requireAuth } from '../auth/middleware.ts';
import {
  allocateFefoStock,
  createBatch,
  createInventoryAudit,
  createStockTransfer,
  findBatches,
  findInventoryAudits,
  findStockMovements,
  findStockTransfers,
  reconcileInventoryAudit,
  updateStockTransferStatus,
  writeOffBatchStock
} from '../db/erpRepositories.ts';
import type { Batch, InventoryAudit, StockTransfer } from '../models/erp.ts';

export const erpInventory = Router();

// Middleware ensuring user has inventory management role
function requireStaff(req: any, res: any, next: any) {
  const allowed = ['shopkeeper', 'store_manager', 'admin', 'super_admin'];
  if (!req.user || !allowed.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied: staff privileges required for inventory ERP' });
  }
  next();
}

// 1. Batches & Expiry Management
erpInventory.get('/batches', requireAuth, requireStaff, async (req, res) => {
  try {
    const { shopId, productId, status } = req.query as Record<string, string | undefined>;
    // If shopkeeper, restrict to their shop unless admin
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const effectiveShopId = isAdmin ? shopId : (req.user?.shopId ?? shopId);
    const batches = await findBatches({ shopId: effectiveShopId, productId, status });
    return res.json(batches);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to list batches' });
  }
});

erpInventory.post('/batches', requireAuth, requireStaff, async (req, res) => {
  try {
    const b = req.body;
    if (!b.productId || !b.batchNumber || !b.expiryDate || typeof b.quantity !== 'number') {
      return res.status(400).json({ error: 'Missing required batch fields (productId, batchNumber, expiryDate, quantity)' });
    }
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const effectiveShopId = isAdmin ? (b.shopId || 'shop-1') : (req.user?.shopId || 'shop-1');

    const id = `bat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const batch: Batch = {
      id,
      batchNumber: b.batchNumber.trim().toUpperCase(),
      productId: b.productId,
      productName: b.productName || 'Product',
      sku: b.sku,
      shopId: effectiveShopId,
      mfgDate: b.mfgDate || now.slice(0, 10),
      expiryDate: b.expiryDate,
      supplierId: b.supplierId,
      supplierName: b.supplierName,
      costPrice: Number(b.costPrice) || 0,
      sellingPrice: Number(b.sellingPrice) || 0,
      quantity: Number(b.quantity),
      initialQuantity: Number(b.quantity),
      reservedQuantity: 0,
      damagedQuantity: 0,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };
    const created = await createBatch(batch);
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to create batch' });
  }
});

erpInventory.post('/batches/:id/write-off', requireAuth, requireStaff, async (req, res) => {
  try {
    const { action, quantity, notes } = req.body;
    if (!action || !['QUARANTINE', 'EXPIRY_SCRAP', 'DAMAGE'].includes(action)) {
      return res.status(400).json({ error: 'Valid action required: QUARANTINE, EXPIRY_SCRAP, or DAMAGE' });
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number' });
    }
    const updated = await writeOffBatchStock(
      req.params.id,
      action,
      qty,
      notes || 'Manual write-off',
      { id: req.user!.id, role: req.user!.role }
    );
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Batch write-off failed' });
  }
});

// FEFO Allocation Preview
erpInventory.post('/fefo-preview', requireAuth, requireStaff, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ error: 'productId and positive quantity required' });
    }
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const effectiveShopId = isAdmin ? (req.body.shopId || 'shop-1') : (req.user?.shopId || 'shop-1');

    const allBatches = await findBatches({ productId, shopId: effectiveShopId });
    const eligible = allBatches.filter(b => (b.status === 'ACTIVE' || b.status === 'NEAR_EXPIRY') && b.quantity > 0)
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

    let remaining = quantity;
    const plan: Array<{ batch: Batch; allocatedQty: number }> = [];

    for (const b of eligible) {
      if (remaining <= 0) break;
      const take = Math.min(b.quantity, remaining);
      plan.push({ batch: b, allocatedQty: take });
      remaining -= take;
    }

    return res.json({
      productId,
      requestedQuantity: quantity,
      allocatedTotal: quantity - remaining,
      shortfall: Math.max(0, remaining),
      allocationPlan: plan
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'FEFO preview calculation failed' });
  }
});

// 2. Stock Movements Ledger
erpInventory.get('/movements', requireAuth, requireStaff, async (req, res) => {
  try {
    const { shopId, productId } = req.query as Record<string, string | undefined>;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const effectiveShopId = isAdmin ? shopId : (req.user?.shopId ?? shopId);
    const movements = await findStockMovements({ shopId: effectiveShopId, productId });
    return res.json(movements);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to list stock movements' });
  }
});

// 3. Stock Transfers (Inter-Shop)
erpInventory.get('/transfers', requireAuth, requireStaff, async (req, res) => {
  try {
    const { shopId, status } = req.query as Record<string, string | undefined>;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const effectiveShopId = isAdmin ? shopId : (req.user?.shopId ?? shopId);
    const transfers = await findStockTransfers({ shopId: effectiveShopId, status });
    return res.json(transfers);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to list transfers' });
  }
});

erpInventory.post('/transfers', requireAuth, requireStaff, async (req, res) => {
  try {
    const b = req.body;
    if (!b.sourceShopId || !b.destShopId || !Array.isArray(b.items) || !b.items.length) {
      return res.status(400).json({ error: 'sourceShopId, destShopId, and items required' });
    }
    const id = `trf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const count = (await findStockTransfers()).length + 1;
    const transferNumber = `TRF-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(count).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const transfer: StockTransfer = {
      id,
      transferNumber,
      sourceShopId: b.sourceShopId,
      sourceShopName: b.sourceShopName,
      destShopId: b.destShopId,
      destShopName: b.destShopName,
      items: b.items,
      status: 'REQUESTED',
      notes: b.notes,
      requestedBy: req.user!.id,
      createdAt: now,
      updatedAt: now
    };

    const created = await createStockTransfer(transfer);
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to create transfer' });
  }
});

erpInventory.patch('/transfers/:id/status', requireAuth, requireStaff, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['APPROVED', 'IN_TRANSIT', 'RECEIVED', 'REJECTED', 'CANCELLED'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: `Valid status required: ${allowed.join(', ')}` });
    }
    const updated = await updateStockTransferStatus(req.params.id, status, { id: req.user!.id, role: req.user!.role });
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to update transfer status' });
  }
});

// 4. Physical Audits & Discrepancy Reconciliation
erpInventory.get('/audits', requireAuth, requireStaff, async (req, res) => {
  try {
    const { shopId } = req.query as Record<string, string | undefined>;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const effectiveShopId = isAdmin ? shopId : (req.user?.shopId ?? shopId);
    const audits = await findInventoryAudits({ shopId: effectiveShopId });
    return res.json(audits);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to list inventory audits' });
  }
});

erpInventory.post('/audits', requireAuth, requireStaff, async (req, res) => {
  try {
    const b = req.body;
    if (!b.title || !Array.isArray(b.items) || !b.items.length) {
      return res.status(400).json({ error: 'Title and items array required for audit count' });
    }
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const effectiveShopId = isAdmin ? (b.shopId || 'shop-1') : (req.user?.shopId || 'shop-1');

    const id = `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const count = (await findInventoryAudits()).length + 1;
    const auditNumber = `AUD-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(count).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const items = b.items.map((i: any) => {
      const systemStock = Number(i.systemStock) || 0;
      const countedStock = Number(i.countedStock) || 0;
      return {
        productId: i.productId,
        productName: i.productName || 'Item',
        sku: i.sku || '',
        batchId: i.batchId,
        batchNumber: i.batchNumber,
        systemStock,
        countedStock,
        discrepancy: countedStock - systemStock,
        reason: i.reason || ''
      };
    });

    const audit: InventoryAudit = {
      id,
      auditNumber,
      shopId: effectiveShopId,
      title: b.title,
      status: 'IN_PROGRESS',
      items,
      conductedBy: req.user!.id,
      notes: b.notes,
      createdAt: now
    };

    const created = await createInventoryAudit(audit);
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to create inventory audit' });
  }
});

erpInventory.post('/audits/:id/reconcile', requireAuth, requireStaff, async (req, res) => {
  try {
    const reconciled = await reconcileInventoryAudit(req.params.id, { id: req.user!.id, role: req.user!.role });
    return res.json(reconciled);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to reconcile audit' });
  }
});
