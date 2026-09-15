import { Router } from 'express';
import { addresses, deliverySlots, offers, orders, payments, products, shops, users } from '../store/memoryStore.ts';
import type { Address, Offer, Payment } from '../models/catalog.ts';
import type { OrderStatus } from '../models/domain.ts';
import { requireAuth } from '../auth/middleware.ts';
import { listProducts, listShops, listAddresses, insertAddress, listDeliverySlots, createOrderTransaction, cancelOrderTransaction, findOrders, findUserById, updateOrderStatus } from '../db/repositories.ts';
import { mongoDb } from '../db/mongodb.ts';
import { calculateDistanceKm, calculateDeliveryEta, isShopOpen } from '../services/hyperlocal.ts';
import { notifyOrderStatusChange } from '../services/notificationService.ts';

export const api = Router();
api.get('/health', (_req, res) => res.json({ ok: true, service: 'freshcart-api', timestamp: new Date().toISOString() }));

api.get('/products', async (req, res) => {
  const shopId = typeof req.query.shopId === 'string' ? req.query.shopId : undefined;
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  const persistent = await listProducts(shopId, category, q);
  if (mongoDb()) return res.json(persistent);
  return res.json(products.filter(p => p.active && (!shopId || p.shopId === shopId) && (!category || p.category === category) && (!q || p.name.toLowerCase().includes(q))));
});

api.get('/shops', async (req, res) => {
  const userLat = typeof req.query.lat === 'string' ? parseFloat(req.query.lat) : undefined;
  const userLng = typeof req.query.lng === 'string' ? parseFloat(req.query.lng) : undefined;
  const hasLocation = Number.isFinite(userLat) && Number.isFinite(userLng);

  const persistent = await listShops();
  const rawShops = mongoDb() ? persistent : shops.filter(s => s.active);

  const mapped = rawShops.map(shop => {
    const isOpen = isShopOpen(shop.openingTime || '06:00', shop.closingTime || '23:30');
    let distanceKm: number | undefined;
    let eta: { minMinutes: number; maxMinutes: number; displayText: string } | undefined;
    let isDeliverable = true;

    if (hasLocation && shop.lat != null && shop.lng != null) {
      distanceKm = calculateDistanceKm({ lat: userLat!, lng: userLng! }, { lat: shop.lat, lng: shop.lng });
      const maxRadius = shop.serviceRadiusKm ?? 10;
      isDeliverable = distanceKm <= maxRadius;
      eta = calculateDeliveryEta(distanceKm, shop.prepTimeMinutes ?? 10);
    } else {
      eta = { minMinutes: 15, maxMinutes: 25, displayText: '15-25 mins' };
    }

    return {
      ...shop,
      isOpen,
      distanceKm,
      isDeliverable,
      eta
    };
  });

  // Sort deliverable and open shops first, then by closest distance
  mapped.sort((a, b) => {
    if (a.isDeliverable !== b.isDeliverable) return a.isDeliverable ? -1 : 1;
    if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
    if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
    return 0;
  });

  return res.json(mapped);
});

api.get('/users/:id', requireAuth, async (req, res) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin' && req.user?.id !== req.params.id) return res.status(403).json({ error: 'Insufficient permissions' });
  if (mongoDb()) {
    const user = await findUserById(req.params.id);
    return user ? res.json(user) : res.status(404).json({ error: 'User not found' });
  }
  const user = users.find(item => item.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return res.json(publicUser);
});

api.get('/addresses', requireAuth, async (req, res) => {
  const persistent = await listAddresses(req.user!.id);
  if (mongoDb()) return res.json(persistent);
  return res.json(addresses.filter(address => address.userId === req.user?.id));
});

api.post('/addresses', requireAuth, async (req, res) => {
  if (req.user?.role !== 'customer') return res.status(403).json({ error: 'Only customers can manage addresses' });
  const { label = 'HOME', line1, line2, city, state, postalCode, landmark, isDefault = false } = req.body ?? {};
  if (!['HOME', 'WORK', 'OTHER'].includes(label) || typeof line1 !== 'string' || typeof city !== 'string' || typeof state !== 'string' || typeof postalCode !== 'string' || !line1.trim() || !city.trim() || !state.trim() || !postalCode.trim()) return res.status(400).json({ error: 'Valid label, line1, city, state and postalCode are required' });
  const address: Address = { id: `addr-${Date.now()}`, userId: req.user.id, label, line1: line1.trim(), line2: typeof line2 === 'string' ? line2.trim() : undefined, city: city.trim(), state: state.trim(), postalCode: postalCode.trim(), landmark: typeof landmark === 'string' ? landmark.trim() : undefined, isDefault: Boolean(isDefault) };
  if (mongoDb()) { if (!(await listAddresses(req.user.id)).length) address.isDefault = true; await insertAddress(address); return res.status(201).json(address); }
  const userAddresses = addresses.filter(item => item.userId === req.user!.id);
  if (address.isDefault) userAddresses.forEach(item => { item.isDefault = false; });
  address.isDefault = address.isDefault || userAddresses.length === 0;
  addresses.push(address);
  return res.status(201).json(address);
});

api.get('/delivery-slots', requireAuth, async (req, res) => {
  if (req.user?.role !== 'customer') return res.status(403).json({ error: 'Only customers can view delivery slots' });
  const persistent = await listDeliverySlots();
  if (mongoDb()) return res.json(persistent);
  return res.json(deliverySlots.filter(slot => slot.active && slot.booked < slot.capacity));
});

api.get('/orders', requireAuth, async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status as OrderStatus : undefined;
  const requestedShopId = typeof req.query.shopId === 'string' ? req.query.shopId : undefined;
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
  const shopId = isAdmin ? requestedShopId : req.user?.shopId;
  const customerId = req.user?.role === 'customer' ? req.user.id : undefined;
  const filter = { ...(status ? { status } : {}), ...(shopId ? { shopId } : {}), ...(customerId ? { customerId } : {}) };

  if (mongoDb()) {
    const db = mongoDb()!;
    const rawOrders = await findOrders(filter);
    const enriched = await Promise.all(rawOrders.map(async o => {
      const user = await db.collection<import('../models/domain').User>('users').findOne({ id: o.customerId });
      const address = o.addressId ? await db.collection<Address>('addresses').findOne({ id: o.addressId }) : null;
      return {
        ...o,
        customerName: (o as any).customerName || user?.name || 'Customer',
        customerPhone: (o as any).customerPhone || user?.phone || '',
        customerEmail: (o as any).customerEmail || user?.email || '',
        address: (o as any).address || address || undefined
      };
    }));
    return res.json(enriched);
  }

  const rawOrders = orders.filter(o => (!status || o.status === status) && (!shopId || o.shopId === shopId) && (!customerId || o.customerId === customerId));
  const enriched = rawOrders.map(o => {
    const user = users.find(u => u.id === o.customerId);
    const address = addresses.find(a => a.id === o.addressId);
    return {
      ...o,
      customerName: (o as any).customerName || user?.name || 'Customer',
      customerPhone: (o as any).customerPhone || user?.phone || '',
      customerEmail: (o as any).customerEmail || user?.email || '',
      address: (o as any).address || address || undefined
    };
  });
  return res.json(enriched);
});

api.post('/orders', requireAuth, async (req, res) => {
  const { shopId, items, paymentMethod = 'COD', addressId, deliverySlotId } = req.body ?? {};
  const couponCode = typeof req.body?.couponCode === 'string' ? req.body.couponCode.trim().toUpperCase() : '';
  const idempotencyHeader = req.headers['idempotency-key'];
  const idempotencyKey = typeof idempotencyHeader === 'string' ? idempotencyHeader.trim() : Array.isArray(idempotencyHeader) ? idempotencyHeader[0]?.trim() : undefined;
  if (req.user?.role !== 'customer') return res.status(403).json({ error: 'Only customers can place orders' });
  if (typeof shopId !== 'string' || !shopId.trim() || !Array.isArray(items) || !items.length || items.length > 100 || typeof addressId !== 'string' || typeof deliverySlotId !== 'string') return res.status(400).json({ error: 'shopId, 1-100 items, addressId and deliverySlotId are required' });
  if (idempotencyKey && (idempotencyKey.length < 16 || idempotencyKey.length > 128)) return res.status(400).json({ error: 'Idempotency-Key must be between 16 and 128 characters' });
  if (!['UPI', 'CARD', 'COD'].includes(paymentMethod)) return res.status(400).json({ error: 'Invalid payment method' });
  if (couponCode && !/^[A-Z0-9_-]{2,64}$/.test(couponCode)) return res.status(400).json({ error: 'Invalid coupon code' });
  const normalizedInput = items.map((raw: unknown) => {
    const item = raw as { productId?: unknown; quantity?: unknown };
    const productId = typeof item.productId === 'string' ? item.productId.trim() : '';
    const quantity = Number(item.quantity);
    return { productId, quantity };
  });
  if (normalizedInput.some(item => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) || new Set(normalizedInput.map(item => item.productId)).size !== normalizedInput.length) return res.status(400).json({ error: 'Each product must have a unique integer quantity between 1 and 100' });
  if (mongoDb()) {
    const db = mongoDb()!;
    if (idempotencyKey) {
      const existing = await db.collection<import('../models/domain').Order>('orders').findOne({ customerId: req.user.id, idempotencyKey });
      if (existing) {
        const payment = await db.collection<Payment>('payments').findOne({ orderId: existing.id });
        const address = existing.addressId ? await db.collection<Address>('addresses').findOne({ id: existing.addressId, userId: req.user.id }) : null;
        const slot = existing.deliverySlotId ? await db.collection<import('../models/catalog').DeliverySlot>('deliverySlots').findOne({ id: existing.deliverySlotId }) : null;
        return res.status(200).json({ ...existing, ...(address ? { address } : {}), ...(slot ? { deliverySlot: slot } : {}), ...(payment ? { payment } : {}) });
      }
    }
    const address = await db.collection<Address>('addresses').findOne({ id: addressId, userId: req.user.id });
    if (!address) return res.status(400).json({ error: 'Valid delivery address is required' });
    const orderId = `FC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const dbProducts = await db.collection<import('../models/domain').Product>('products').find({ id: { $in: normalizedInput.map(item => item.productId) }, shopId: shopId.trim(), active: true }).toArray();
    if (dbProducts.length !== normalizedInput.length) return res.status(400).json({ error: 'One or more products are unavailable' });
    const orderProductMap = new Map(dbProducts.map(product => [product.id, product]));
    const completeItems = normalizedInput.map(item => { const product = orderProductMap.get(item.productId)!; return { productId: product.id, name: product.name, quantity: item.quantity, unitPrice: product.sellingPrice }; });
    const subtotal = completeItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const settings = await db.collection('shopSettings').findOne<{ shopId:string; delivery?:{freeDeliveryMinimum?:number;deliveryFee?:number} }>({ shopId: shopId.trim() });
    const freeDeliveryMinimum = Number.isFinite(Number(settings?.delivery?.freeDeliveryMinimum)) ? Math.max(0, Number(settings!.delivery!.freeDeliveryMinimum)) : 499;
    const configuredDeliveryFee = Number.isFinite(Number(settings?.delivery?.deliveryFee)) ? Math.max(0, Number(settings!.delivery!.deliveryFee)) : 39;
    let discount = 0;
    let appliedOffer: Offer | undefined;
    if (couponCode) {
      const now = new Date().toISOString();
      appliedOffer = await db.collection<Offer>('offers').findOne({ code: couponCode, active: true, startsAt: { $lte: now }, endsAt: { $gte: now } });
      if (!appliedOffer) return res.status(400).json({ error: 'Coupon is invalid or expired' });
      if (subtotal < appliedOffer.minOrderValue) return res.status(400).json({ error: `Minimum order value for this coupon is ₹${appliedOffer.minOrderValue}` });
      discount = appliedOffer.discountType === 'PERCENT' ? subtotal * (appliedOffer.discountValue / 100) : appliedOffer.discountValue;
      if (appliedOffer.maxDiscount != null) discount = Math.min(discount, appliedOffer.maxDiscount);
      discount = Math.min(Math.max(0, discount), subtotal);
    }
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const deliveryFee = discountedSubtotal >= freeDeliveryMinimum ? 0 : configuredDeliveryFee;
    const tip = Math.max(0, Number(req.body?.tip) || 0);
    const handlingFee = 5;
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const order = { id: orderId, customerId: req.user.id, shopId: shopId.trim(), items: completeItems, subtotal, discount, couponCode: appliedOffer?.code, deliveryFee, tip, handlingFee, deliveryOtp, total: discountedSubtotal + deliveryFee + tip + handlingFee, paymentMethod: paymentMethod as 'UPI' | 'CARD' | 'COD', fulfilment: 'DELIVERY' as const, status: 'PLACED' as const, createdAt: new Date().toISOString(), addressId: address.id, deliverySlotId, ...(idempotencyKey ? { idempotencyKey } : {}) };
    const payment: Payment = { id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, orderId: order.id, method: order.paymentMethod, status: 'PENDING', amount: order.total, provider: order.paymentMethod === 'COD' ? undefined : 'pending', createdAt: new Date().toISOString() };
    try {
      const result = await createOrderTransaction(order, payment, normalizedInput, deliverySlotId);
      return res.status(201).json({ ...result.order, address, deliverySlot: result.slot, payment: result.payment });
    } catch (error) {
      if (idempotencyKey && error instanceof Error && /duplicate key/i.test(error.message)) {
        const existing = await db.collection<import('../models/domain').Order>('orders').findOne({ customerId: req.user.id, idempotencyKey });
        if (existing) return res.status(200).json(existing);
      }
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to place order' });
    }
  }
  const address = addresses.find(item => item.id === addressId && item.userId === req.user!.id);
  const slot = deliverySlots.find(item => item.id === deliverySlotId && item.active);
  if (!address) return res.status(400).json({ error: 'Valid delivery address is required' });
  if (!slot || slot.booked >= slot.capacity) return res.status(400).json({ error: 'Delivery slot is unavailable' });
  const normalizedItems = normalizedInput.map(item => { const product = products.find(p => p.id === item.productId && p.active && p.shopId === shopId); if (!product || product.stock < item.quantity) return null; return { product, quantity: item.quantity }; });
  if (normalizedItems.some(item => item === null)) return res.status(400).json({ error: 'One or more products are unavailable or have insufficient stock' });
  const orderItems = normalizedItems.map(item => ({ productId: item!.product.id, name: item!.product.name, quantity: item!.quantity, unitPrice: item!.product.sellingPrice }));
  const subtotal = orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  let discount = 0;
  if (couponCode) {
    const offer = offers.find(o => o.code.toUpperCase() === couponCode.toUpperCase() && o.active);
    if (!offer) return res.status(400).json({ error: 'Invalid or expired coupon code' });
    const now = new Date().toISOString();
    if (offer.startsAt > now || offer.endsAt < now) return res.status(400).json({ error: 'Coupon has expired' });
    if (subtotal < offer.minOrderValue) return res.status(400).json({ error: `Minimum order value of ₹${offer.minOrderValue} required for coupon ${offer.code}` });
    discount = offer.discountType === 'PERCENT' ? Math.round((subtotal * offer.discountValue) / 100) : offer.discountValue;
    if (offer.maxDiscount !== undefined && discount > offer.maxDiscount) discount = offer.maxDiscount;
  }
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const deliveryFee = discountedSubtotal >= 499 ? 0 : 39;
  const tip = Math.max(0, Number(req.body?.tip) || 0);
  const handlingFee = 5;
  const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
  const total = discountedSubtotal + deliveryFee + tip + handlingFee;
  const order = { id: `FC-${Date.now()}-${orders.length}`, customerId: req.user.id, shopId, items: orderItems, subtotal, discount, couponCode: couponCode ? couponCode.toUpperCase() : undefined, total, deliveryFee, tip, handlingFee, deliveryOtp, paymentMethod: paymentMethod as 'UPI' | 'CARD' | 'COD', fulfilment: 'DELIVERY' as const, status: 'PLACED' as const, createdAt: new Date().toISOString(), addressId, deliverySlotId };
  orderItems.forEach(item => { const product = products.find(p => p.id === item.productId); if (product) product.stock -= item.quantity; }); slot.booked += 1; orders.unshift(order);
  const payment: Payment = { id: `pay-${Date.now()}`, orderId: order.id, method: order.paymentMethod, status: 'PENDING', amount: order.total, provider: order.paymentMethod === 'COD' ? undefined : 'pending', createdAt: new Date().toISOString() }; payments.push(payment);
  void notifyOrderStatusChange(order as any, 'PLACED');
  return res.status(201).json({ ...order, address, deliverySlot: slot, payment });
});

api.patch('/orders/:id/status', requireAuth, async (req, res) => {
  const status = req.body?.status as OrderStatus;
  const allowed: OrderStatus[] = ['PLACED', 'ACCEPTED', 'PICKING', 'PACKING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (mongoDb()) {
    const order = await mongoDb()!.collection<import('../models/domain').Order>('orders').findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const canManage = isAdmin || (['shopkeeper', 'employee', 'store_manager'].includes(req.user?.role ?? '') && req.user?.shopId === order.shopId);
    if (status === 'CANCELLED') {
      if (!canManage && !(req.user?.role === 'customer' && req.user.id === order.customerId)) return res.status(403).json({ error: 'Insufficient permissions' });
      if (order.status === 'CANCELLED') return res.json(order);
      if (!['PLACED', 'ACCEPTED'].includes(order.status)) return res.status(409).json({ error: 'Order can no longer be cancelled' });
      try { const cancelled = await cancelOrderTransaction(order); void notifyOrderStatusChange(order as any, 'CANCELLED'); return res.json(cancelled); }
      catch (error) { return res.status(409).json({ error: error instanceof Error ? error.message : 'Unable to cancel order' }); }
    }
    if (!canManage) return res.status(403).json({ error: 'Insufficient permissions' });
    try { const updated = await updateOrderStatus(order.id, status); if (updated) void notifyOrderStatusChange(updated as any, status); return updated ? res.json(updated) : res.status(404).json({ error: 'Order not found' }); }
    catch (error) { return res.status(409).json({ error: error instanceof Error ? error.message : 'Unable to update order status' }); }
  }
  const order = orders.find(o => o.id === req.params.id); if (!order) return res.status(404).json({ error: 'Order not found' });
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin'; const canManage = isAdmin || (['shopkeeper', 'employee', 'store_manager'].includes(req.user?.role ?? '') && req.user?.shopId === order.shopId);
  const memoryTransitions: Record<OrderStatus, readonly OrderStatus[]> = { PLACED: ['ACCEPTED', 'CANCELLED'], ACCEPTED: ['PICKING', 'CANCELLED'], PICKING: ['PACKING'], PACKING: ['READY'], READY: ['OUT_FOR_DELIVERY', 'COLLECTED'], OUT_FOR_DELIVERY: ['DELIVERED'], DELIVERED: [], CANCELLED: [], COLLECTED: [] };
  if (status === 'CANCELLED') {
    if (!canManage && !(req.user?.role === 'customer' && req.user.id === order.customerId)) return res.status(403).json({ error: 'Insufficient permissions' });
    if (order.status === 'CANCELLED') return res.json(order);
    if (!['PLACED', 'ACCEPTED'].includes(order.status)) return res.status(409).json({ error: 'Order can no longer be cancelled' });
    order.items.forEach(item => { const product = products.find(p => p.id === item.productId && p.shopId === order.shopId); if (product) product.stock += item.quantity; });
    const slot = deliverySlots.find(item => item.id === order.deliverySlotId); if (slot && slot.booked > 0) slot.booked -= 1;
    const payment = payments.find(item => item.orderId === order.id); if (payment) payment.status = order.paymentMethod === 'COD' ? 'CANCELLED' : 'REFUND_PENDING';
    order.status = 'CANCELLED'; void notifyOrderStatusChange(order as any, 'CANCELLED'); return res.json(order);
  }
  if (!canManage) return res.status(403).json({ error: 'Insufficient permissions' });
  if (order.status === status) return res.json(order);
  if (!memoryTransitions[order.status].includes(status)) return res.status(409).json({ error: `Invalid order status transition: ${order.status} -> ${status}` });
  order.status = status; void notifyOrderStatusChange(order as any, status); return res.json(order);
});

api.patch('/products/:id/stock', requireAuth, async (req, res) => {
  const stock = Number(req.body?.stock); if (!Number.isFinite(stock) || stock < 0) return res.status(400).json({ error: 'Stock must be a non-negative number' });
  if (mongoDb()) {
    const product = await mongoDb()!.collection<import('../models/domain').Product>('products').findOne({ id: req.params.id }); if (!product) return res.status(404).json({ error: 'Product not found' });
    const canManage = (req.user?.role === 'admin' || req.user?.role === 'super_admin') || (['shopkeeper', 'employee', 'store_manager'].includes(req.user?.role ?? '') && product.shopId === req.user?.shopId); if (!canManage) return res.status(403).json({ error: 'Insufficient permissions' });
    const updated = await mongoDb()!.collection<import('../models/domain').Product>('products').findOneAndUpdate({ id: product.id }, { $set: { stock } }, { returnDocument: 'after' }); return res.json(updated);
  }
  const product = products.find(p => p.id === req.params.id); if (!product) return res.status(404).json({ error: 'Product not found' }); const canManage = (req.user?.role === 'admin' || req.user?.role === 'super_admin') || (['shopkeeper', 'employee', 'store_manager'].includes(req.user?.role ?? '') && product.shopId === req.user?.shopId); if (!canManage) return res.status(403).json({ error: 'Insufficient permissions' }); product.stock = stock; return res.json(product);
});

api.post('/cart/validate', async (req, res) => {
  const { shopId, items } = req.body ?? {};
  if (typeof shopId !== 'string' || !shopId.trim() || !Array.isArray(items)) {
    return res.status(400).json({ valid: false, error: 'shopId and items array are required' });
  }

  const normalizedItems = items.map((i: any) => ({
    productId: String(i.productId || ''),
    quantity: Number(i.quantity) || 1
  }));

  if (mongoDb()) {
    const db = mongoDb()!;
    const productIds = normalizedItems.map(i => i.productId);
    const dbProducts = await db.collection<import('../models/domain').Product>('products').find({
      id: { $in: productIds },
      active: true
    }).toArray();

    const unavailable: string[] = [];
    const outOfStock: Array<{ productId: string; requested: number; available: number }> = [];
    const foreignShopItems: string[] = [];

    const pMap = new Map(dbProducts.map(p => [p.id, p]));

    for (const item of normalizedItems) {
      const p = pMap.get(item.productId);
      if (!p) {
        unavailable.push(item.productId);
      } else if (p.shopId && p.shopId !== shopId) {
        foreignShopItems.push(item.productId);
      } else if (p.stock < item.quantity) {
        outOfStock.push({ productId: item.productId, requested: item.quantity, available: p.stock });
      }
    }

    const valid = unavailable.length === 0 && outOfStock.length === 0 && foreignShopItems.length === 0;
    return res.json({
      valid,
      unavailable,
      outOfStock,
      foreignShopItems,
      message: valid ? 'Cart items are available' : 'Some items have changed stock or belong to another merchant'
    });
  }

  // In-memory validation
  const unavailable: string[] = [];
  const outOfStock: Array<{ productId: string; requested: number; available: number }> = [];
  const foreignShopItems: string[] = [];

  for (const item of normalizedItems) {
    const p = products.find(prod => prod.id === item.productId && prod.active);
    if (!p) {
      unavailable.push(item.productId);
    } else if (p.shopId && p.shopId !== shopId) {
      foreignShopItems.push(item.productId);
    } else if (p.stock < item.quantity) {
      outOfStock.push({ productId: item.productId, requested: item.quantity, available: p.stock });
    }
  }

  const valid = unavailable.length === 0 && outOfStock.length === 0 && foreignShopItems.length === 0;
  return res.json({
    valid,
    unavailable,
    outOfStock,
    foreignShopItems,
    message: valid ? 'Cart items are available' : 'Some items have changed stock or belong to another merchant'
  });
});

