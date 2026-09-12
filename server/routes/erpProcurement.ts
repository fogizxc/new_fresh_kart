import { Router } from 'express';
import { requireAuth } from '../auth/middleware.ts';
import {
  createPurchaseOrder,
  createSupplier,
  createSupplierPayment,
  findGoodsReceivedNotes,
  findPurchaseOrders,
  findSupplierPayments,
  findSuppliers,
  processGoodsReceipt,
  updatePurchaseOrderStatus,
  updateSupplier
} from '../db/erpRepositories.ts';
import type { GoodsReceivedNote, PurchaseOrder, Supplier, SupplierPayment } from '../models/erp.ts';

export const erpProcurement = Router();

function requireStaff(req: any, res: any, next: any) {
  const allowed = ['shopkeeper', 'store_manager', 'admin', 'super_admin'];
  if (!req.user || !allowed.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied: staff privileges required for procurement ERP' });
  }
  next();
}

// 1. Suppliers
erpProcurement.get('/suppliers', requireAuth, requireStaff, async (req, res) => {
  try {
    const suppliers = await findSuppliers();
    return res.json(suppliers);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to list suppliers' });
  }
});

erpProcurement.post('/suppliers', requireAuth, requireStaff, async (req, res) => {
  try {
    const b = req.body;
    if (!b.name || !b.phone) {
      return res.status(400).json({ error: 'Supplier name and phone are required' });
    }
    const id = `sup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const supplier: Supplier = {
      id,
      name: b.name.trim(),
      contactPerson: b.contactPerson || '',
      email: b.email || '',
      phone: b.phone.trim(),
      gstin: b.gstin || '',
      pan: b.pan || '',
      address: b.address || '',
      city: b.city || '',
      state: b.state || '',
      paymentTermsDays: Number(b.paymentTermsDays) || 30,
      balanceOutstanding: Number(b.balanceOutstanding) || 0,
      active: true,
      category: b.category || 'General',
      createdAt: new Date().toISOString()
    };
    const created = await createSupplier(supplier);
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to create supplier' });
  }
});

erpProcurement.patch('/suppliers/:id', requireAuth, requireStaff, async (req, res) => {
  try {
    const updated = await updateSupplier(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Supplier not found' });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to update supplier' });
  }
});

// 2. Purchase Orders
erpProcurement.get('/purchase-orders', requireAuth, requireStaff, async (req, res) => {
  try {
    const { shopId, supplierId, status } = req.query as Record<string, string | undefined>;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const effectiveShopId = isAdmin ? shopId : (req.user?.shopId ?? shopId);
    const pos = await findPurchaseOrders({ shopId: effectiveShopId, supplierId, status });
    return res.json(pos);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to list purchase orders' });
  }
});

erpProcurement.post('/purchase-orders', requireAuth, requireStaff, async (req, res) => {
  try {
    const b = req.body;
    if (!b.supplierId || !Array.isArray(b.items) || !b.items.length) {
      return res.status(400).json({ error: 'supplierId and at least one item required' });
    }
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const effectiveShopId = isAdmin ? (b.shopId || 'shop-1') : (req.user?.shopId || 'shop-1');

    const suppliers = await findSuppliers();
    const supplier = suppliers.find(s => s.id === b.supplierId);
    const supplierName = supplier?.name || b.supplierName || 'Unknown Supplier';

    const count = (await findPurchaseOrders()).length + 1;
    const poNumber = `PO-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(count).padStart(3, '0')}`;
    const id = `po-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    let subtotal = 0;
    let taxAmount = 0;

    const items = b.items.map((i: any) => {
      const orderedQty = Number(i.orderedQty) || 1;
      const unitCost = Number(i.unitCost) || 0;
      const taxRate = Number(i.taxRate) || 0;
      const lineSubtotal = orderedQty * unitCost;
      const lineTax = (lineSubtotal * taxRate) / 100;
      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        productId: i.productId,
        productName: i.productName || 'Product',
        sku: i.sku || '',
        orderedQty,
        unitCost,
        taxRate,
        hsnCode: i.hsnCode || '',
        receivedQty: 0,
        totalCost: lineSubtotal + lineTax
      };
    });

    const po: PurchaseOrder = {
      id,
      poNumber,
      supplierId: b.supplierId,
      supplierName,
      shopId: effectiveShopId,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round((subtotal + taxAmount) * 100) / 100,
      status: b.autoSubmit ? 'SUBMITTED' : 'DRAFT',
      notes: b.notes,
      expectedDeliveryDate: b.expectedDeliveryDate,
      createdBy: req.user!.id,
      approvalHistory: [
        {
          status: b.autoSubmit ? 'SUBMITTED' : 'DRAFT',
          actorId: req.user!.id,
          timestamp: now,
          notes: 'Created purchase order'
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    const created = await createPurchaseOrder(po);
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to create purchase order' });
  }
});

erpProcurement.patch('/purchase-orders/:id/status', requireAuth, requireStaff, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const allowed = ['DRAFT', 'SUBMITTED', 'APPROVED', 'CANCELLED'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: `Valid status required: ${allowed.join(', ')}` });
    }

    // Only admin or store_manager can approve POs
    if (status === 'APPROVED') {
      const canApprove = ['admin', 'super_admin', 'store_manager'].includes(req.user!.role);
      if (!canApprove) {
        return res.status(403).json({ error: 'Only admins or store managers can approve purchase orders' });
      }
    }

    const updated = await updatePurchaseOrderStatus(
      req.params.id,
      status,
      { id: req.user!.id, role: req.user!.role },
      notes
    );
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to update purchase order status' });
  }
});

// 3. Goods Received Notes (GRN)
erpProcurement.get('/grn', requireAuth, requireStaff, async (req, res) => {
  try {
    const { shopId, poId } = req.query as Record<string, string | undefined>;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const effectiveShopId = isAdmin ? shopId : (req.user?.shopId ?? shopId);
    const grns = await findGoodsReceivedNotes({ shopId: effectiveShopId, poId });
    return res.json(grns);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to list GRNs' });
  }
});

erpProcurement.post('/grn', requireAuth, requireStaff, async (req, res) => {
  try {
    const b = req.body;
    if (!b.purchaseOrderId || !Array.isArray(b.items) || !b.items.length) {
      return res.status(400).json({ error: 'purchaseOrderId and received items array required' });
    }

    const poList = await findPurchaseOrders();
    const po = poList.find(p => p.id === b.purchaseOrderId);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    if (po.status === 'DRAFT' || po.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Goods cannot be received against a DRAFT or CANCELLED purchase order' });
    }

    const count = (await findGoodsReceivedNotes()).length + 1;
    const grnNumber = `GRN-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(count).padStart(3, '0')}`;
    const id = `grn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const items = b.items.map((i: any) => {
      const receivedQty = Number(i.receivedQty) || 0;
      const acceptedQty = Number(i.acceptedQty) !== undefined ? Number(i.acceptedQty) : receivedQty;
      const rejectedQty = Number(i.rejectedQty) || Math.max(0, receivedQty - acceptedQty);

      return {
        productId: i.productId,
        productName: i.productName || 'Product',
        orderedQty: Number(i.orderedQty) || 0,
        receivedQty,
        acceptedQty,
        rejectedQty,
        rejectionReason: i.rejectionReason || '',
        unitCost: Number(i.unitCost) || 0,
        batchNumber: (i.batchNumber || `B-${Date.now().toString().slice(-6)}`).toUpperCase(),
        mfgDate: i.mfgDate || now.slice(0, 10),
        expiryDate: i.expiryDate || new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10)
      };
    });

    const grn: GoodsReceivedNote = {
      id,
      grnNumber,
      purchaseOrderId: po.id,
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      shopId: po.shopId,
      items,
      invoiceNumber: b.invoiceNumber,
      invoiceAmount: b.invoiceAmount ? Number(b.invoiceAmount) : undefined,
      receivedBy: req.user!.id,
      status: 'PROCESSED',
      notes: b.notes,
      receivedAt: b.receivedAt || now,
      createdAt: now
    };

    const processed = await processGoodsReceipt(grn, { id: req.user!.id, role: req.user!.role });
    return res.status(201).json(processed);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to process goods received note' });
  }
});

// 4. Supplier Payments
erpProcurement.get('/payments', requireAuth, requireStaff, async (req, res) => {
  try {
    const { supplierId } = req.query as Record<string, string | undefined>;
    const payments = await findSupplierPayments({ supplierId });
    return res.json(payments);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to list supplier payments' });
  }
});

erpProcurement.post('/payments', requireAuth, requireStaff, async (req, res) => {
  try {
    const b = req.body;
    if (!b.supplierId || !b.amount || Number(b.amount) <= 0) {
      return res.status(400).json({ error: 'supplierId and positive amount required' });
    }

    const suppliers = await findSuppliers();
    const supplier = suppliers.find(s => s.id === b.supplierId);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    const count = (await findSupplierPayments()).length + 1;
    const paymentNumber = `PAY-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(count).padStart(3, '0')}`;
    const id = `sp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const payment: SupplierPayment = {
      id,
      paymentNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      purchaseOrderId: b.purchaseOrderId,
      poNumber: b.poNumber,
      amount: Number(b.amount),
      paymentMode: b.paymentMode || 'NEFT',
      referenceNumber: b.referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
      paymentDate: b.paymentDate || now.slice(0, 10),
      status: 'PAID',
      notes: b.notes,
      recordedBy: req.user!.id,
      createdAt: now
    };

    const created = await createSupplierPayment(payment, { id: req.user!.id, role: req.user!.role });
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to record supplier payment' });
  }
});
