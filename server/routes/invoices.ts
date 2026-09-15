import { Router } from 'express';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { mongoDb } from '../db/mongodb.ts';

export const invoices = Router();
invoices.use(requireAuth, requireRole('shopkeeper', 'store_manager', 'admin', 'super_admin'));

function invoiceId() {
  return `INV-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

invoices.post('/invoices', async (req, res) => {
  const body = req.body ?? {};
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ error: 'At least one invoice item is required' });
  }
  const invoice = {
    id: invoiceId(),
    orderId: typeof body.orderId === 'string' ? body.orderId : undefined,
    shopId: req.user?.shopId,
    createdBy: req.user?.id,
    customer: {
      name: String(body.customer?.name ?? 'Walk-in Customer').trim(),
      phone: String(body.customer?.phone ?? '').trim(),
      address: String(body.customer?.address ?? '').trim(),
    },
    items: body.items,
    subtotal: Number(body.subtotal) || 0,
    tax: Number(body.tax) || 0,
    discount: Number(body.discount) || 0,
    total: Number(body.total) || 0,
    createdAt: new Date().toISOString(),
  };

  const db = mongoDb();
  if (db) await db.collection('invoices').insertOne(invoice);
  return res.status(201).json({ invoice });
});

invoices.get('/invoices', async (req, res) => {
  const db = mongoDb();
  if (!db) return res.json([]);
  const filter = req.user?.role === 'admin' || req.user?.role === 'super_admin'
    ? {}
    : { shopId: req.user?.shopId };
  const records = await db.collection('invoices').find(filter).sort({ createdAt: -1 }).limit(200).toArray();
  return res.json(records);
});
