import { Router } from 'express';
import { mongoDb } from '../db/mongodb.ts';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { products, shops } from '../store/memoryStore.ts';

export interface Subscription {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  shopId: string;
  quantity: number;
  frequency: 'DAILY' | 'ALTERNATE_DAYS' | 'WEEKDAYS' | 'WEEKENDS';
  slot: '6:00 AM - 7:30 AM' | '7:30 AM - 9:00 AM';
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  startDate: string;
  pausedDates: string[];
  address: string;
  createdAt: string;
}

// In-memory fallback
export const memorySubscriptions: Subscription[] = [
  {
    id: 'sub_demo_1',
    userId: 'cust-1',
    productId: 'prod_amul_milk',
    productName: 'Amul Taaza Homogenised Toned Milk 1L',
    productPrice: 72,
    productImage: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80',
    shopId: 'shop-1',
    quantity: 2,
    frequency: 'DAILY',
    slot: '6:00 AM - 7:30 AM',
    status: 'ACTIVE',
    startDate: new Date().toISOString().split('T')[0],
    pausedDates: [],
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sub_demo_2',
    userId: 'cust-1',
    productId: 'prod_brown_bread',
    productName: 'English Oven 100% Whole Wheat Brown Bread 400g',
    productPrice: 50,
    productImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80',
    shopId: 'shop-1',
    quantity: 1,
    frequency: 'ALTERNATE_DAYS',
    slot: '6:00 AM - 7:30 AM',
    status: 'ACTIVE',
    startDate: new Date().toISOString().split('T')[0],
    pausedDates: [],
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru',
    createdAt: new Date().toISOString()
  }
];

export const subscriptionsRouter = Router();
subscriptionsRouter.use(requireAuth);

// GET /api/subscriptions - List user's subscriptions
subscriptionsRouter.get('/', async (req, res) => {
  const userId = req.user?.id;
  const db = mongoDb();

  if (db) {
    const list = await db.collection<Subscription>('subscriptions').find({ userId }).sort({ createdAt: -1 }).toArray();
    return res.json(list);
  }

  const userSubs = memorySubscriptions.filter(s => s.userId === userId || userId === 'guest');
  return res.json(userSubs);
});

// POST /api/subscriptions - Create new daily/recurring subscription
subscriptionsRouter.post('/', async (req, res) => {
  const userId = req.user?.id || 'guest';
  const {
    productId,
    quantity = 1,
    frequency = 'DAILY',
    slot = '6:00 AM - 7:30 AM',
    address = 'Default Doorstep Address',
    startDate = new Date().toISOString().split('T')[0]
  } = req.body ?? {};

  if (!productId) {
    return res.status(400).json({ error: 'productId is required' });
  }

  // Find product details
  const db = mongoDb();
  let foundProduct: any = null;
  if (db) {
    foundProduct = await db.collection('products').findOne({ id: productId });
  } else {
    foundProduct = products.find(p => p.id === productId);
  }

  const newSub: Subscription = {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    productId,
    productName: foundProduct?.name || 'Fresh Essential Item',
    productPrice: foundProduct?.sellingPrice || 60,
    productImage: foundProduct?.imageUrl || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80',
    shopId: foundProduct?.shopId || 'shop-1',
    quantity: Math.max(1, Number(quantity) || 1),
    frequency: ['DAILY', 'ALTERNATE_DAYS', 'WEEKDAYS', 'WEEKENDS'].includes(frequency) ? frequency : 'DAILY',
    slot: slot === '7:30 AM - 9:00 AM' ? '7:30 AM - 9:00 AM' : '6:00 AM - 7:30 AM',
    status: 'ACTIVE',
    startDate,
    pausedDates: [],
    address,
    createdAt: new Date().toISOString()
  };

  if (db) {
    await db.collection('subscriptions').insertOne(newSub);
  } else {
    memorySubscriptions.unshift(newSub);
  }

  return res.status(201).json({ ok: true, subscription: newSub });
});

// PATCH /api/subscriptions/:id/toggle - Pause / Resume
subscriptionsRouter.patch('/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const db = mongoDb();

  if (db) {
    const sub = await db.collection<Subscription>('subscriptions').findOne({ id });
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    const nextStatus = sub.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await db.collection('subscriptions').updateOne({ id }, { $set: { status: nextStatus } });
    return res.json({ ok: true, status: nextStatus });
  }

  const sub = memorySubscriptions.find(s => s.id === id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });
  sub.status = sub.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  return res.json({ ok: true, status: sub.status });
});

// POST /api/subscriptions/:id/pause-date - Skip/Pause a specific date
subscriptionsRouter.post('/:id/pause-date', async (req, res) => {
  const { id } = req.params;
  const { date } = req.body ?? {};
  if (!date) return res.status(400).json({ error: 'date string (YYYY-MM-DD) is required' });

  const db = mongoDb();
  if (db) {
    const sub = await db.collection<Subscription>('subscriptions').findOne({ id });
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    const dates = new Set(sub.pausedDates || []);
    if (dates.has(date)) dates.delete(date);
    else dates.add(date);
    const updatedDates = Array.from(dates);
    await db.collection('subscriptions').updateOne({ id }, { $set: { pausedDates: updatedDates } });
    return res.json({ ok: true, pausedDates: updatedDates });
  }

  const sub = memorySubscriptions.find(s => s.id === id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });
  const index = sub.pausedDates.indexOf(date);
  if (index >= 0) sub.pausedDates.splice(index, 1);
  else sub.pausedDates.push(date);
  return res.json({ ok: true, pausedDates: sub.pausedDates });
});

// DELETE /api/subscriptions/:id - Cancel subscription
subscriptionsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const db = mongoDb();

  if (db) {
    await db.collection('subscriptions').deleteOne({ id });
    return res.json({ ok: true, message: 'Subscription cancelled' });
  }

  const index = memorySubscriptions.findIndex(s => s.id === id);
  if (index >= 0) memorySubscriptions.splice(index, 1);
  return res.json({ ok: true, message: 'Subscription cancelled' });
});
