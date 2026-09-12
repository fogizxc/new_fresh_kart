import { Router } from 'express';
import { mongoDb } from '../db/mongodb.ts';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { orders as memoryOrders } from '../store/memoryStore.ts';
import type { Order } from '../models/domain.ts';

export const rewards = Router();
rewards.get('/', requireAuth, requireRole('customer'), async (req, res) => {
  const db = mongoDb();
  if (db) {
    const completed = await db.collection<Order>('orders').find({ customerId: req.user!.id, status: { $in: ['DELIVERED', 'COLLECTED'] } }).project({ total: 1 }).toArray();
    const spent = completed.reduce((sum, order) => sum + Number(order.total || 0), 0);
    return res.json({ points: Math.floor(spent), spent, orders: completed.length, rate: 1 });
  }
  const completed = memoryOrders.filter(o => o.customerId === req.user!.id && ['DELIVERED', 'COLLECTED'].includes(o.status));
  const spent = completed.reduce((sum, order) => sum + Number(order.total || 0), 0);
  return res.json({ points: Math.floor(spent), spent, orders: completed.length, rate: 1 });
});
