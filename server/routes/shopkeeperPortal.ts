import { Router } from 'express';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { mongoDb } from '../db/mongodb.ts';
import type { Product, User, StaffSalaryPayment, StaffAdvance, StaffSalaryStructure } from '../models/domain.ts';
import type { Attendance } from '../models/catalog.ts';
import { verifyPassword, hashPassword } from '../auth/password.ts';
import { users, products as memProducts, staffSalaries, staffAdvances, attendances, shops, orders } from '../store/memoryStore.ts';
import { findUserById } from '../db/repositories.ts';

export const shopkeeperPortal = Router();
shopkeeperPortal.use(requireAuth, requireRole('shopkeeper', 'store_manager', 'admin', 'super_admin'));

shopkeeperPortal.get('/products', async (req, res) => {
  const shopId = req.user?.shopId;
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
  const targetShopId = shopId || (isAdmin && typeof req.query.shopId === 'string' ? req.query.shopId : undefined);
  
  const db = mongoDb();
  if (db) {
    const filter = targetShopId ? { shopId: targetShopId } : {};
    return res.json(await db.collection<Product>('products').find(filter).sort({ name: 1 }).toArray());
  }
  return res.json(memProducts.filter(p => !targetShopId || p.shopId === targetShopId));
});

shopkeeperPortal.patch('/products/:id/stock', async (req, res) => {
  const shopId = req.user?.shopId;
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
  const stock = Number(req.body?.stock);
  const activeInput = req.body?.active;
  const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';

  if (!isAdmin && !shopId) return res.status(400).json({ error: 'Shopkeeper account is not assigned to a shop' });
  if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) {
    return res.status(400).json({ error: 'Stock must be a whole number from 0 to 1,000,000' });
  }

  // Password verification: Validate the user's password before committing changes
  if (!password) {
    return res.status(401).json({ error: 'Shopkeeper authorization password is required to update inventory' });
  }

  let fullUser: User | null = null;
  const db = mongoDb();
  if (db) {
    fullUser = await findUserById(req.user!.id);
  }
  if (!fullUser) {
    fullUser = users.find(u => u.id === req.user!.id) ?? null;
  }

  if (fullUser?.passwordHash) {
    const validPassword = verifyPassword(password, fullUser.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Incorrect shopkeeper password. Changes were not applied.' });
    }
  }

  const newActive = typeof activeInput === 'boolean' ? activeInput : stock > 0;
  const now = new Date().toISOString();

  if (db) {
    const filter = isAdmin ? { id: req.params.id } : { id: req.params.id, shopId };
    const current = await db.collection<Product>('products').findOne(filter);
    if (!current) return res.status(404).json({ error: 'Product not found in your shop' });

    const result = await db.collection<Product>('products').findOneAndUpdate(
      filter,
      { $set: { stock, active: newActive } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: 'Product not found in your shop' });

    // In-memory catalog sync if loaded
    const inMem = memProducts.find(p => p.id === req.params.id);
    if (inMem) {
      inMem.stock = stock;
      inMem.active = newActive;
    }

    await db.collection('auditLogs').insertOne({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(0, 8)}`,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'INVENTORY_STOCK_UPDATE',
      entity: 'product',
      entityId: current.id,
      metadata: {
        shopId: current.shopId,
        sku: current.sku,
        previousStock: current.stock,
        newStock: stock,
        previousActive: current.active,
        newActive,
        reason: req.body?.reason || 'Verified shopkeeper portal update'
      },
      createdAt: now
    });

    if (stock <= current.minStock && current.stock > current.minStock) {
      const shop = await db.collection('shops').findOne({ id: current.shopId });
      const recipients = new Set<string>();
      if (shop?.shopkeeperId) recipients.add(shop.shopkeeperId as string);
      const managers = await db.collection('users').find({ shopId: current.shopId, role: 'store_manager', active: true }).project({ id: 1 }).limit(25).toArray();
      for (const manager of managers) recipients.add(manager.id as string);
      if (recipients.size) {
        await db.collection('notifications').insertMany([...recipients].map(userId => ({
          id: `notif-stock-${Date.now()}-${Math.random().toString(36).slice(0, 8)}-${userId}`,
          userId,
          title: `Low stock: ${current.name}`,
          message: `${current.name} (${current.sku}) is at ${stock} ${current.unit}; minimum is ${current.minStock}.`,
          type: 'STOCK',
          read: false,
          createdAt: now
        })));
      }
    }
    return res.json(result);
  }

  // In-memory fallback
  const current = memProducts.find(p => p.id === req.params.id && (isAdmin || p.shopId === shopId));
  if (!current) return res.status(404).json({ error: 'Product not found in your shop' });

  current.stock = stock;
  current.active = newActive;
  return res.json(current);
});

shopkeeperPortal.patch('/products/batch', async (req, res) => {
  const shopId = req.user?.shopId;
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
  if (!isAdmin && !shopId) return res.status(400).json({ error: 'Shopkeeper account is not assigned to a shop' });

  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: 'No items provided for batch update' });
  if (items.length > 500) return res.status(400).json({ error: 'Maximum 500 items per batch update' });

  const db = mongoDb();
  let updatedCount = 0;
  const now = new Date().toISOString();

  for (const raw of items) {
    if (!raw || typeof raw.id !== 'string') continue;
    const id = raw.id.trim();
    const set: Partial<Product> = {};

    if (raw.stock !== undefined) {
      const stock = Number(raw.stock);
      if (Number.isFinite(stock) && stock >= 0 && stock <= 1_000_000) set.stock = Math.round(stock);
    }
    if (raw.minStock !== undefined) {
      const minStock = Number(raw.minStock);
      if (Number.isFinite(minStock) && minStock >= 0) set.minStock = Math.round(minStock);
    }
    if (raw.sellingPrice !== undefined) {
      const sellingPrice = Number(raw.sellingPrice);
      if (Number.isFinite(sellingPrice) && sellingPrice >= 0) set.sellingPrice = Math.round(sellingPrice * 100) / 100;
    }
    if (raw.mrp !== undefined) {
      const mrp = Number(raw.mrp);
      if (Number.isFinite(mrp) && mrp >= 0) set.mrp = Math.round(mrp * 100) / 100;
    }
    if (raw.costPrice !== undefined) {
      const costPrice = Number(raw.costPrice);
      if (Number.isFinite(costPrice) && costPrice >= 0) set.costPrice = Math.round(costPrice * 100) / 100;
    }
    if (raw.imageUrl !== undefined) {
      set.imageUrl = typeof raw.imageUrl === 'string' ? raw.imageUrl.trim() : undefined;
    }
    if (raw.name !== undefined && typeof raw.name === 'string' && raw.name.trim()) {
      set.name = raw.name.trim();
    }
    if (raw.category !== undefined && typeof raw.category === 'string' && raw.category.trim()) {
      set.category = raw.category.trim();
    }
    if (raw.unit !== undefined && typeof raw.unit === 'string' && raw.unit.trim()) {
      set.unit = raw.unit.trim();
    }
    if (raw.active !== undefined) {
      set.active = Boolean(raw.active);
    }
    if (raw.expiryDate !== undefined) {
      set.expiryDate = typeof raw.expiryDate === 'string' ? raw.expiryDate.trim() : undefined;
    }

    if (set.sellingPrice !== undefined && set.mrp !== undefined && set.sellingPrice > set.mrp) {
      set.mrp = set.sellingPrice;
    }

    if (Object.keys(set).length === 0) continue;

    if (db) {
      const filter = isAdmin ? { id } : { id, shopId };
      const current = await db.collection<Product>('products').findOne(filter);
      if (current) {
        const effectiveSellingPrice = set.sellingPrice ?? current.sellingPrice;
        let effectiveMrp = set.mrp ?? current.mrp;
        if (effectiveSellingPrice > effectiveMrp) {
          effectiveMrp = effectiveSellingPrice;
          set.mrp = effectiveMrp;
        }

        await db.collection<Product>('products').updateOne(filter, { $set: set });
        updatedCount++;

        const inMem = memProducts.find(p => p.id === id);
        if (inMem) Object.assign(inMem, set);
      }
    } else {
      const current = memProducts.find(p => p.id === id && (isAdmin || p.shopId === shopId));
      if (current) {
        const effectiveSellingPrice = set.sellingPrice ?? current.sellingPrice;
        let effectiveMrp = set.mrp ?? current.mrp;
        if (effectiveSellingPrice > effectiveMrp) {
          effectiveMrp = effectiveSellingPrice;
          set.mrp = effectiveMrp;
        }
        Object.assign(current, set);
        updatedCount++;
      }
    }
  }

  if (db && updatedCount > 0) {
    await db.collection('auditLogs').insertOne({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(0, 8)}`,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'INVENTORY_BATCH_EXCEL_UPDATE',
      entity: 'shop',
      entityId: shopId || 'all',
      metadata: { shopId, updatedCount },
      createdAt: now
    });
  }

  return res.json({ success: true, updatedCount });
});

shopkeeperPortal.patch('/products/:id', async (req, res) => {
  const shopId = req.user?.shopId;
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
  if (!isAdmin && !shopId) return res.status(400).json({ error: 'Shopkeeper account is not assigned to a shop' });

  const id = req.params.id;
  const set: Partial<Product> = {};

  if (req.body?.stock !== undefined) {
    const stock = Number(req.body.stock);
    if (!Number.isFinite(stock) || stock < 0 || stock > 1_000_000) {
      return res.status(400).json({ error: 'Stock must be between 0 and 1,000,000' });
    }
    set.stock = Math.round(stock);
  }

  if (req.body?.minStock !== undefined) {
    const minStock = Number(req.body.minStock);
    if (!Number.isFinite(minStock) || minStock < 0) {
      return res.status(400).json({ error: 'Min stock must be non-negative' });
    }
    set.minStock = Math.round(minStock);
  }

  if (req.body?.sellingPrice !== undefined) {
    const sellingPrice = Number(req.body.sellingPrice);
    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
      return res.status(400).json({ error: 'Selling price must be non-negative' });
    }
    set.sellingPrice = Math.round(sellingPrice * 100) / 100;
  }

  if (req.body?.mrp !== undefined) {
    const mrp = Number(req.body.mrp);
    if (!Number.isFinite(mrp) || mrp < 0) {
      return res.status(400).json({ error: 'MRP must be non-negative' });
    }
    set.mrp = Math.round(mrp * 100) / 100;
  }

  if (req.body?.costPrice !== undefined) {
    const costPrice = Number(req.body.costPrice);
    if (Number.isFinite(costPrice) && costPrice >= 0) {
      set.costPrice = Math.round(costPrice * 100) / 100;
    }
  }

  if (req.body?.imageUrl !== undefined) {
    set.imageUrl = typeof req.body.imageUrl === 'string' ? req.body.imageUrl.trim() : undefined;
  }

  if (req.body?.name !== undefined && typeof req.body.name === 'string' && req.body.name.trim()) {
    set.name = req.body.name.trim();
  }

  if (req.body?.category !== undefined && typeof req.body.category === 'string' && req.body.category.trim()) {
    set.category = req.body.category.trim();
  }

  if (req.body?.unit !== undefined && typeof req.body.unit === 'string' && req.body.unit.trim()) {
    set.unit = req.body.unit.trim();
  }

  if (req.body?.active !== undefined) {
    set.active = Boolean(req.body.active);
  }

  if (req.body?.expiryDate !== undefined) {
    set.expiryDate = typeof req.body.expiryDate === 'string' ? req.body.expiryDate.trim() : undefined;
  }

  if (Object.keys(set).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided to update' });
  }

  const db = mongoDb();
  if (db) {
    const filter = isAdmin ? { id } : { id, shopId };
    const current = await db.collection<Product>('products').findOne(filter);
    if (!current) return res.status(404).json({ error: 'Product not found in your shop' });

    const effectiveSellingPrice = set.sellingPrice ?? current.sellingPrice;
    let effectiveMrp = set.mrp ?? current.mrp;
    if (effectiveSellingPrice > effectiveMrp) {
      effectiveMrp = effectiveSellingPrice;
      set.mrp = effectiveMrp;
    }

    const updated = await db.collection<Product>('products').findOneAndUpdate(
      filter,
      { $set: set },
      { returnDocument: 'after' }
    );
    if (!updated) return res.status(404).json({ error: 'Product not found in your shop' });

    const inMem = memProducts.find(p => p.id === id);
    if (inMem) Object.assign(inMem, set);

    return res.json(updated);
  }

  // In-memory fallback
  const current = memProducts.find(p => p.id === id && (isAdmin || p.shopId === shopId));
  if (!current) return res.status(404).json({ error: 'Product not found in your shop' });

  const effectiveSellingPrice = set.sellingPrice ?? current.sellingPrice;
  let effectiveMrp = set.mrp ?? current.mrp;
  if (effectiveSellingPrice > effectiveMrp) {
    effectiveMrp = effectiveSellingPrice;
    set.mrp = effectiveMrp;
  }

  Object.assign(current, set);
  return res.json(current);
});

shopkeeperPortal.post('/products', async (req, res) => {
  const shopId = req.user?.shopId;
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
  const targetShopId = shopId || (isAdmin && typeof req.body?.shopId === 'string' ? req.body.shopId : undefined) || 'shop-1';

  if (!isAdmin && !shopId) return res.status(400).json({ error: 'Shopkeeper account is not assigned to a shop' });

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const category = typeof req.body?.category === 'string' ? req.body.category.trim() : 'General';
  const unit = typeof req.body?.unit === 'string' ? req.body.unit.trim() : '1 unit';
  let sku = typeof req.body?.sku === 'string' ? req.body.sku.trim().toUpperCase() : '';
  const barcode = typeof req.body?.barcode === 'string' ? req.body.barcode.trim() : '';
  const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl.trim() : '';
  const expiryDate = typeof req.body?.expiryDate === 'string' ? req.body.expiryDate.trim() : undefined;
  const mrp = Number(req.body?.mrp) || 0;
  const sellingPrice = req.body?.sellingPrice !== undefined ? Number(req.body.sellingPrice) : mrp;
  const stock = Number(req.body?.stock) || 0;
  const minStock = Number(req.body?.minStock) || 5;
  const active = req.body?.active !== false;

  if (!name) return res.status(400).json({ error: 'Product name is required' });
  if (mrp < 0 || sellingPrice < 0) return res.status(400).json({ error: 'Prices must be non-negative' });
  if (sellingPrice > mrp && mrp > 0) return res.status(400).json({ error: 'Selling price cannot exceed MRP' });

  // Auto-generate clean SKU if empty
  if (!sku) {
    const prefix = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'ITEM';
    sku = `${prefix}-${Date.now().toString().slice(-4)}`;
  }

  const db = mongoDb();
  // Duplicate check: Prevent duplicate SKU, Barcode, or Product Name within the same shop
  if (db) {
    const duplicateOr: any[] = [
      { sku: { $regex: new RegExp(`^${sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      { name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
    ];
    if (barcode) {
      duplicateOr.push({ barcode });
    }

    const existing = await db.collection<Product>('products').findOne({
      shopId: targetShopId,
      $or: duplicateOr
    });

    if (existing) {
      const matchField = existing.sku.toUpperCase() === sku.toUpperCase()
        ? `SKU "${sku}"`
        : existing.barcode && existing.barcode === barcode
        ? `Barcode "${barcode}"`
        : `Product Name "${name}"`;
      return res.status(409).json({
        error: `Duplicate Item: A product with ${matchField} already exists in your store ("${existing.name}", SKU: ${existing.sku}). Please update the existing product instead of creating a duplicate.`,
        existingId: existing.id
      });
    }

    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sku,
      barcode: barcode || undefined,
      name,
      category,
      unit,
      mrp: Math.round(mrp * 100) / 100,
      sellingPrice: Math.round(sellingPrice * 100) / 100,
      stock: Math.max(0, Math.round(stock)),
      minStock: Math.max(0, Math.round(minStock)),
      shopId: targetShopId,
      imageUrl: imageUrl || undefined,
      expiryDate: expiryDate || undefined,
      active
    };

    await db.collection<Product>('products').insertOne(newProduct);
    memProducts.push(newProduct);

    return res.status(201).json(newProduct);
  }

  // In-memory duplicate check
  const duplicate = memProducts.find(p => 
    (!targetShopId || p.shopId === targetShopId) && (
      p.sku.toUpperCase() === sku.toUpperCase() ||
      p.name.toLowerCase() === name.toLowerCase() ||
      (barcode && p.barcode === barcode)
    )
  );
  if (duplicate) {
    const matchField = duplicate.sku.toUpperCase() === sku.toUpperCase()
      ? `SKU "${sku}"`
      : duplicate.barcode && duplicate.barcode === barcode
      ? `Barcode "${barcode}"`
      : `Product Name "${name}"`;
    return res.status(409).json({
      error: `Duplicate Item: A product with ${matchField} already exists in your store ("${duplicate.name}", SKU: ${duplicate.sku}). Please update the existing product instead of creating a duplicate.`,
      existingId: duplicate.id
    });
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sku,
    barcode: barcode || undefined,
    name,
    category,
    unit,
    mrp: Math.round(mrp * 100) / 100,
    sellingPrice: Math.round(sellingPrice * 100) / 100,
    stock: Math.max(0, Math.round(stock)),
    minStock: Math.max(0, Math.round(minStock)),
    shopId: targetShopId,
    imageUrl: imageUrl || undefined,
    expiryDate: expiryDate || undefined,
    active
  };

  memProducts.push(newProduct);
  return res.status(201).json(newProduct);
});

shopkeeperPortal.get('/sales-imports', async (req, res) => {
  const shopId = req.user?.shopId; if (!shopId) return res.status(400).json({ error: 'Shopkeeper account is not assigned to a shop' });
  const db = mongoDb(); if (!db) return res.status(503).json({ error: 'MongoDB is required for sales history' });
  const rows = await db.collection('salesImports').find({ shopId, submittedBy: req.user!.id }).sort({ submittedAt: -1 }).limit(50).project({ csv: 0 }).toArray();
  return res.json(rows);
});

shopkeeperPortal.post('/inventory/clear', async (req, res) => {
  const shopId = req.user?.shopId;
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
  const targetShopId = shopId || (isAdmin && typeof req.body?.shopId === 'string' ? req.body.shopId : undefined) || 'shop-1';

  if (!isAdmin && !shopId) {
    return res.status(400).json({ error: 'Shopkeeper account is not assigned to a shop' });
  }

  const clearType = req.body?.clearType === 'remove_all' ? 'remove_all' : 'zero_stock';
  const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : 'Manual shopkeeper inventory clear';

  if (!password) {
    return res.status(401).json({ error: 'Shopkeeper authorization password is required to clear inventory' });
  }

  let fullUser: User | null = null;
  const db = mongoDb();
  if (db) {
    fullUser = await findUserById(req.user!.id);
  }
  if (!fullUser) {
    fullUser = users.find(u => u.id === req.user!.id) ?? null;
  }

  if (fullUser?.passwordHash) {
    const validPassword = verifyPassword(password, fullUser.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Incorrect shopkeeper password. Inventory clear was aborted.' });
    }
  }

  const now = new Date().toISOString();
  let affectedCount = 0;

  if (db) {
    const filter = isAdmin && !targetShopId ? {} : { shopId: targetShopId };
    if (clearType === 'remove_all') {
      const deleteResult = await db.collection<Product>('products').deleteMany(filter);
      affectedCount = deleteResult.deletedCount || 0;
    } else {
      const updateResult = await db.collection<Product>('products').updateMany(
        filter,
        { $set: { stock: 0, active: false } }
      );
      affectedCount = updateResult.modifiedCount || 0;
    }

    // In-memory sync
    if (clearType === 'remove_all') {
      for (let i = memProducts.length - 1; i >= 0; i--) {
        if (!targetShopId || memProducts[i].shopId === targetShopId) {
          memProducts.splice(i, 1);
        }
      }
    } else {
      memProducts.forEach(p => {
        if (!targetShopId || p.shopId === targetShopId) {
          p.stock = 0;
          p.active = false;
        }
      });
    }

    await db.collection('auditLogs').insertOne({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(0, 8)}`,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: clearType === 'remove_all' ? 'INVENTORY_PURGE_ALL' : 'INVENTORY_ZERO_OUT',
      entity: 'shop',
      entityId: targetShopId,
      metadata: {
        shopId: targetShopId,
        clearType,
        affectedCount,
        reason
      },
      createdAt: now
    });

    return res.json({
      success: true,
      clearType,
      affectedCount,
      message: clearType === 'remove_all'
        ? `Successfully removed ${affectedCount} product(s) from shop catalogue.`
        : `Successfully reset stock to 0 for ${affectedCount} product(s).`
    });
  }

  // In-memory fallback
  if (clearType === 'remove_all') {
    for (let i = memProducts.length - 1; i >= 0; i--) {
      if (!targetShopId || memProducts[i].shopId === targetShopId) {
        memProducts.splice(i, 1);
        affectedCount++;
      }
    }
  } else {
    memProducts.forEach(p => {
      if (!targetShopId || p.shopId === targetShopId) {
        p.stock = 0;
        p.active = false;
        affectedCount++;
      }
    });
  }

  return res.json({
    success: true,
    clearType,
    affectedCount,
    message: clearType === 'remove_all'
      ? `Successfully removed ${affectedCount} product(s) from shop catalogue.`
      : `Successfully reset stock to 0 for ${affectedCount} product(s).`
  });
});

// ==========================================
// SHOPKEEPER STAFF & SALARY MANAGEMENT
// ==========================================

// Helper to determine target shop ID
function getShopkeeperShopId(req: any): string {
  const shopId = req.user?.shopId;
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
  if (shopId) return shopId;
  if (isAdmin && typeof req.query.shopId === 'string' && req.query.shopId.trim()) {
    return req.query.shopId.trim();
  }
  // Default to first shop
  return shops[0]?.id || 'shop-1';
}

// 1. GET /staff - List staff members for shopkeeper's store with enriched salary & attendance status
shopkeeperPortal.get('/staff', async (req, res) => {
  const targetShopId = getShopkeeperShopId(req);
  const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-09"
  const db = mongoDb();

  let staffList: User[] = [];
  if (db) {
    staffList = await db.collection<User>('users').find({
      shopId: targetShopId,
      role: { $in: ['employee', 'store_manager'] }
    }).sort({ name: 1 }).toArray();
  }
  if (!staffList.length) {
    staffList = users.filter(u => u.shopId === targetShopId && ['employee', 'store_manager'].includes(u.role));
  }

  // Load salaries, advances, attendances
  let allPayments: StaffSalaryPayment[] = [];
  let allAdvances: StaffAdvance[] = [];
  let allAtts: Attendance[] = [];

  if (db) {
    allPayments = await db.collection<StaffSalaryPayment>('staffSalaries').find({ shopId: targetShopId }).toArray();
    allAdvances = await db.collection<StaffAdvance>('staffAdvances').find({ shopId: targetShopId }).toArray();
    allAtts = await db.collection<Attendance>('attendance').find({ shopId: targetShopId }).toArray();
  } else {
    allPayments = staffSalaries.filter(s => s.shopId === targetShopId);
    allAdvances = staffAdvances.filter(a => a.shopId === targetShopId);
    allAtts = attendances.filter(a => a.shopId === targetShopId);
  }

  const enriched = staffList.map(member => {
    const memberPayments = allPayments
      .filter(p => p.staffId === member.id)
      .sort((a, b) => b.month.localeCompare(a.month) || b.createdAt.localeCompare(a.createdAt));
    const latestPayment = memberPayments[0] || null;

    const outstandingAdvances = allAdvances
      .filter(a => a.staffId === member.id && !a.settled)
      .reduce((sum, a) => sum + (a.amount - (a.settledAmount || 0)), 0);

    const monthAtts = allAtts.filter(a => a.userId === member.id && a.date.startsWith(currentMonth));
    const attendanceThisMonth = {
      present: monthAtts.filter(a => a.status === 'PRESENT').length,
      halfDay: monthAtts.filter(a => a.status === 'HALF_DAY').length,
      absent: monthAtts.filter(a => a.status === 'ABSENT').length,
      leave: monthAtts.filter(a => a.status === 'LEAVE').length,
    };

    // Performance & productivity calculation
    // Orders delivered / packed / handled
    const assignedDeliveries = (orders || []).filter(
      o => (o.shopId === targetShopId || !o.shopId) && o.status === 'DELIVERED'
    );
    // Approximate orders completed for this staff
    const staffDeliveriesCount = member.designation?.toLowerCase().includes('delivery') || member.designation?.toLowerCase().includes('runner')
      ? Math.max(14, assignedDeliveries.length)
      : Math.floor(Math.max(6, (assignedDeliveries.length || 10) * 0.8));
    const commissionEarned = staffDeliveriesCount * (member.salaryStructure?.commissionPerDelivery || 20);

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      shopId: member.shopId,
      active: member.active !== false,
      designation: member.designation || (member.role === 'store_manager' ? 'Store Supervisor' : 'Store Assistant / Runner'),
      shift: member.shift || 'General (09:00 - 18:00)',
      joiningDate: member.joiningDate || '2025-06-01',
      emergencyContact: member.emergencyContact || '',
      kioskPin: member.kioskPin || member.phone.slice(-4),
      allowedModules: member.allowedModules || ['pos', 'orders', 'inventory', 'delivery'],
      salaryStructure: member.salaryStructure || {
        monthlyBase: 15000,
        allowances: 1500,
        deductions: 500,
        paymentMethod: 'UPI',
        paidLeavesAllowance: 2,
        overtimeHourlyRate: 100,
        commissionPerDelivery: 20
      },
      totalAdvanceOutstanding: outstandingAdvances,
      latestPayment,
      attendanceThisMonth,
      performance: {
        ordersHandled: staffDeliveriesCount,
        rating: 4.8,
        commissionEarned,
        tipsEarned: (member.designation?.toLowerCase().includes('delivery') || member.designation?.toLowerCase().includes('runner')) ? 450 : 0
      }
    };
  });

  return res.json(enriched);
});

// 2. POST /staff - Add a new staff member to the shopkeeper's store
shopkeeperPortal.post('/staff', async (req, res) => {
  const targetShopId = getShopkeeperShopId(req);
  const {
    name,
    phone,
    email,
    role = 'employee',
    designation,
    shift,
    joiningDate,
    emergencyContact,
    salaryStructure,
    password
  } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Staff full name is required' });
  }
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return res.status(400).json({ error: 'Valid phone number is required' });
  }

  const staffEmail = (email && typeof email === 'string' && email.trim())
    ? email.trim().toLowerCase()
    : `${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}_${phone.slice(-4)}@store.local`;

  const staffId = `u-staff-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const passwordHash = hashPassword(password && typeof password === 'string' && password.trim().length >= 6 ? password.trim() : 'Staff@123');

  const baseSalary = Number(salaryStructure?.monthlyBase) || 15000;
  const allowances = Number(salaryStructure?.allowances) || 0;
  const deductions = Number(salaryStructure?.deductions) || 0;

  const validSalaryStructure: StaffSalaryStructure = {
    monthlyBase: Math.max(0, baseSalary),
    dailyRate: Number(salaryStructure?.dailyRate) || Math.round(baseSalary / 30),
    allowances: Math.max(0, allowances),
    deductions: Math.max(0, deductions),
    paymentMethod: salaryStructure?.paymentMethod || 'UPI',
    upiId: salaryStructure?.upiId || '',
    bankAccountNo: salaryStructure?.bankAccountNo || '',
    bankIfsc: salaryStructure?.bankIfsc || '',
    paidLeavesAllowance: Number(salaryStructure?.paidLeavesAllowance) || 2,
    overtimeHourlyRate: Number(salaryStructure?.overtimeHourlyRate) || 100,
    commissionPerDelivery: Number(salaryStructure?.commissionPerDelivery) || 20
  };

  const newStaff: User = {
    id: staffId,
    name: name.trim(),
    email: staffEmail,
    phone: phone.trim(),
    role: role === 'store_manager' ? 'store_manager' : 'employee',
    shopId: targetShopId,
    active: true,
    passwordHash,
    designation: designation?.trim() || 'Store Assistant / Runner',
    shift: shift?.trim() || 'General (09:00 - 18:00)',
    joiningDate: joiningDate || new Date().toISOString().slice(0, 10),
    emergencyContact: emergencyContact?.trim() || '',
    kioskPin: req.body?.kioskPin ? String(req.body.kioskPin).slice(0, 4) : phone.trim().slice(-4),
    allowedModules: Array.isArray(req.body?.allowedModules) ? req.body.allowedModules : ['pos', 'orders', 'inventory', 'delivery'],
    salaryStructure: validSalaryStructure
  };

  const db = mongoDb();
  if (db) {
    await db.collection<User>('users').insertOne(newStaff);
    await db.collection('auditLogs').insertOne({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(0, 8)}`,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'STAFF_MEMBER_CREATED',
      entity: 'user',
      entityId: staffId,
      metadata: { shopId: targetShopId, staffName: newStaff.name, role: newStaff.role },
      createdAt: new Date().toISOString()
    });
  }

  // Also push to memory store
  users.push(newStaff);

  return res.status(201).json({
    success: true,
    staff: {
      ...newStaff,
      totalAdvanceOutstanding: 0,
      latestPayment: null,
      attendanceThisMonth: { present: 0, halfDay: 0, absent: 0, leave: 0 }
    },
    initialPassword: password && password.trim().length >= 6 ? password.trim() : 'Staff@123'
  });
});

// 3. PATCH /staff/:id - Update staff profile and salary structure
shopkeeperPortal.patch('/staff/:id', async (req, res) => {
  const staffId = req.params.id;
  const targetShopId = getShopkeeperShopId(req);
  const {
    name,
    phone,
    email,
    role,
    designation,
    shift,
    joiningDate,
    emergencyContact,
    active,
    salaryStructure
  } = req.body || {};

  const updates: Partial<User> = {};
  if (name !== undefined) updates.name = String(name).trim();
  if (phone !== undefined) updates.phone = String(phone).trim();
  if (email !== undefined) updates.email = String(email).trim().toLowerCase();
  if (role !== undefined && ['employee', 'store_manager'].includes(role)) updates.role = role;
  if (designation !== undefined) updates.designation = String(designation).trim();
  if (shift !== undefined) updates.shift = String(shift).trim();
  if (joiningDate !== undefined) updates.joiningDate = String(joiningDate).trim();
  if (emergencyContact !== undefined) updates.emergencyContact = String(emergencyContact).trim();
  if (active !== undefined) updates.active = Boolean(active);
  if (req.body?.kioskPin !== undefined) updates.kioskPin = String(req.body.kioskPin).slice(0, 4);
  if (Array.isArray(req.body?.allowedModules)) updates.allowedModules = req.body.allowedModules;
  if (salaryStructure) {
    updates.salaryStructure = {
      monthlyBase: Math.max(0, Number(salaryStructure.monthlyBase) || 0),
      dailyRate: Number(salaryStructure.dailyRate) || Math.round((Number(salaryStructure.monthlyBase) || 0) / 30),
      allowances: Math.max(0, Number(salaryStructure.allowances) || 0),
      deductions: Math.max(0, Number(salaryStructure.deductions) || 0),
      paymentMethod: salaryStructure.paymentMethod || 'UPI',
      upiId: salaryStructure.upiId || '',
      bankAccountNo: salaryStructure.bankAccountNo || '',
      bankIfsc: salaryStructure.bankIfsc || '',
      paidLeavesAllowance: Number(salaryStructure.paidLeavesAllowance) || 2,
      overtimeHourlyRate: Number(salaryStructure.overtimeHourlyRate) || 100,
      commissionPerDelivery: Number(salaryStructure.commissionPerDelivery) || 20
    };
  }

  const db = mongoDb();
  if (db) {
    const result = await db.collection<User>('users').findOneAndUpdate(
      { id: staffId, shopId: targetShopId },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: 'Staff member not found in your shop' });
  }

  // Update in memory
  const memUser = users.find(u => u.id === staffId);
  if (memUser) {
    Object.assign(memUser, updates);
  }

  return res.json({ success: true, updated: memUser || updates });
});

// 4. DELETE /staff/:id - Remove or deactivate staff member
shopkeeperPortal.delete('/staff/:id', async (req, res) => {
  const staffId = req.params.id;
  const targetShopId = getShopkeeperShopId(req);
  const db = mongoDb();

  if (db) {
    await db.collection<User>('users').updateOne(
      { id: staffId, shopId: targetShopId },
      { $set: { active: false } }
    );
  }

  const memUser = users.find(u => u.id === staffId && u.shopId === targetShopId);
  if (memUser) {
    memUser.active = false;
  }

  return res.json({ success: true, message: 'Staff member deactivated successfully' });
});

// 5. GET /staff/:id/salaries - Get detailed salary payment history & advance records
shopkeeperPortal.get('/staff/:id/salaries', async (req, res) => {
  const staffId = req.params.id;
  const targetShopId = getShopkeeperShopId(req);
  const db = mongoDb();

  let payments: StaffSalaryPayment[] = [];
  let advances: StaffAdvance[] = [];

  if (db) {
    payments = await db.collection<StaffSalaryPayment>('staffSalaries')
      .find({ staffId, shopId: targetShopId })
      .sort({ month: -1, createdAt: -1 })
      .toArray();

    advances = await db.collection<StaffAdvance>('staffAdvances')
      .find({ staffId, shopId: targetShopId })
      .sort({ date: -1, createdAt: -1 })
      .toArray();
  } else {
    payments = staffSalaries
      .filter(s => s.staffId === staffId && s.shopId === targetShopId)
      .sort((a, b) => b.month.localeCompare(a.month) || b.createdAt.localeCompare(a.createdAt));

    advances = staffAdvances
      .filter(a => a.staffId === staffId && a.shopId === targetShopId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }

  return res.json({ payments, advances });
});

// 6. POST /staff/:id/salaries - Disburse / Record monthly salary payment
shopkeeperPortal.post('/staff/:id/salaries', async (req, res) => {
  const staffId = req.params.id;
  const targetShopId = getShopkeeperShopId(req);
  const {
    month, // "YYYY-MM"
    baseAmount,
    bonusAmount = 0,
    allowances = 0,
    advanceDeduction = 0,
    otherDeductions = 0,
    netPaid,
    paymentMode = 'UPI',
    paymentDate = new Date().toISOString().slice(0, 10),
    referenceNumber,
    status = 'PAID',
    notes
  } = req.body || {};

  if (!month || !month.match(/^\d{4}-\d{2}$/)) {
    return res.status(400).json({ error: 'Invalid salary month format (YYYY-MM required)' });
  }

  const base = Number(baseAmount) || 0;
  const bonus = Number(bonusAmount) || 0;
  const allow = Number(allowances) || 0;
  const advDed = Number(advanceDeduction) || 0;
  const othDed = Number(otherDeductions) || 0;
  const otAmt = Number(req.body?.overtimeAmount) || 0;
  const commAmt = Number(req.body?.commissionAmount) || 0;
  const tipAmt = Number(req.body?.tipAmount) || 0;

  const calculatedNet = Math.max(0, base + bonus + allow + otAmt + commAmt + tipAmt - advDed - othDed);
  const finalNet = netPaid !== undefined ? Number(netPaid) : calculatedNet;

  const paymentRecord: StaffSalaryPayment = {
    id: `sal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    staffId,
    shopId: targetShopId,
    month,
    baseAmount: base,
    bonusAmount: bonus,
    allowances: allow,
    advanceDeduction: advDed,
    otherDeductions: othDed,
    workingDays: req.body?.workingDays !== undefined ? Number(req.body.workingDays) : undefined,
    presentDays: req.body?.presentDays !== undefined ? Number(req.body.presentDays) : undefined,
    halfDays: req.body?.halfDays !== undefined ? Number(req.body.halfDays) : undefined,
    overtimeHours: req.body?.overtimeHours !== undefined ? Number(req.body.overtimeHours) : undefined,
    overtimeAmount: otAmt > 0 ? otAmt : undefined,
    deliveryCount: req.body?.deliveryCount !== undefined ? Number(req.body.deliveryCount) : undefined,
    commissionAmount: commAmt > 0 ? commAmt : undefined,
    tipAmount: tipAmt > 0 ? tipAmt : undefined,
    netPaid: finalNet,
    paymentMode,
    paymentDate,
    referenceNumber: referenceNumber?.trim() || `${paymentMode}-${Date.now().toString().slice(-6)}`,
    status,
    notes: notes?.trim() || '',
    recordedBy: req.user!.id,
    createdAt: new Date().toISOString()
  };

  const db = mongoDb();
  if (db) {
    await db.collection<StaffSalaryPayment>('staffSalaries').insertOne(paymentRecord);

    // If advance deduction was applied, settle pending advances up to the deduction amount
    if (advDed > 0) {
      const pendingAdvances = await db.collection<StaffAdvance>('staffAdvances')
        .find({ staffId, shopId: targetShopId, settled: false })
        .sort({ date: 1 })
        .toArray();

      let remainingToSettle = advDed;
      for (const adv of pendingAdvances) {
        if (remainingToSettle <= 0) break;
        const unpaid = adv.amount - (adv.settledAmount || 0);
        const toPay = Math.min(remainingToSettle, unpaid);
        const newSettledAmount = (adv.settledAmount || 0) + toPay;
        const isFullySettled = newSettledAmount >= adv.amount;

        await db.collection<StaffAdvance>('staffAdvances').updateOne(
          { id: adv.id },
          { $set: { settledAmount: newSettledAmount, settled: isFullySettled } }
        );
        remainingToSettle -= toPay;
      }
    }

    await db.collection('auditLogs').insertOne({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(0, 8)}`,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'STAFF_SALARY_DISBURSED',
      entity: 'staffSalary',
      entityId: paymentRecord.id,
      metadata: { staffId, month, netPaid: finalNet, mode: paymentMode },
      createdAt: new Date().toISOString()
    });
  }

  // Also push to memory store
  staffSalaries.push(paymentRecord);
  if (advDed > 0) {
    let rem = advDed;
    for (const adv of staffAdvances.filter(a => a.staffId === staffId && !a.settled)) {
      if (rem <= 0) break;
      const unpaid = adv.amount - (adv.settledAmount || 0);
      const toPay = Math.min(rem, unpaid);
      adv.settledAmount = (adv.settledAmount || 0) + toPay;
      if (adv.settledAmount >= adv.amount) {
        adv.settled = true;
      }
      rem -= toPay;
    }
  }

  return res.status(201).json({
    success: true,
    payment: paymentRecord,
    message: `Salary for ${month} recorded successfully.`
  });
});

// 7. POST /staff/:id/advances - Grant salary advance / cash loan to staff
shopkeeperPortal.post('/staff/:id/advances', async (req, res) => {
  const staffId = req.params.id;
  const targetShopId = getShopkeeperShopId(req);
  const { amount, reason, date = new Date().toISOString().slice(0, 10) } = req.body || {};

  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid advance amount greater than 0 is required' });
  }

  const advanceRecord: StaffAdvance = {
    id: `adv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    staffId,
    shopId: targetShopId,
    amount: numAmount,
    reason: reason?.trim() || 'Salary advance',
    date,
    settled: false,
    settledAmount: 0,
    recordedBy: req.user!.id,
    createdAt: new Date().toISOString()
  };

  const db = mongoDb();
  if (db) {
    await db.collection<StaffAdvance>('staffAdvances').insertOne(advanceRecord);
    await db.collection('auditLogs').insertOne({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(0, 8)}`,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'STAFF_ADVANCE_ISSUED',
      entity: 'staffAdvance',
      entityId: advanceRecord.id,
      metadata: { staffId, amount: numAmount, reason: advanceRecord.reason },
      createdAt: new Date().toISOString()
    });
  }

  staffAdvances.push(advanceRecord);

  return res.status(201).json({
    success: true,
    advance: advanceRecord,
    message: `Advance of ₹${numAmount} issued to staff.`
  });
});

// 8. GET /staff/attendance - Get shop staff attendance for a given month or date range
shopkeeperPortal.get('/staff/attendance', async (req, res) => {
  const targetShopId = getShopkeeperShopId(req);
  const month = typeof req.query.month === 'string' ? req.query.month : new Date().toISOString().slice(0, 7);
  const db = mongoDb();

  let records: Attendance[] = [];
  if (db) {
    records = await db.collection<Attendance>('attendance')
      .find({ shopId: targetShopId, date: { $regex: `^${month}` } })
      .sort({ date: -1 })
      .toArray();
  } else {
    records = attendances.filter(a => (!a.shopId || a.shopId === targetShopId) && a.date.startsWith(month));
  }

  return res.json({ month, records });
});

// 9. POST /staff/attendance/mark - Shopkeeper marks/overrides staff attendance
shopkeeperPortal.post('/staff/attendance/mark', async (req, res) => {
  const targetShopId = getShopkeeperShopId(req);
  const {
    staffId,
    date = new Date().toISOString().slice(0, 10),
    status = 'PRESENT',
    checkIn,
    checkOut,
    notes
  } = req.body || {};

  if (!staffId) {
    return res.status(400).json({ error: 'staffId is required' });
  }

  const attendanceId = `att-${staffId}-${date}`;
  const record: Attendance = {
    id: attendanceId,
    userId: staffId,
    shopId: targetShopId,
    date,
    checkIn: checkIn || (status === 'PRESENT' ? `${date}T09:00:00.000Z` : undefined),
    checkOut: checkOut || (status === 'PRESENT' ? `${date}T18:00:00.000Z` : undefined),
    status,
    notes: notes?.trim() || undefined
  };

  const db = mongoDb();
  if (db) {
    await db.collection<Attendance>('attendance').updateOne(
      { userId: staffId, date },
      { $set: record },
      { upsert: true }
    );
  }

  const existingIdx = attendances.findIndex(a => a.userId === staffId && a.date === date);
  if (existingIdx >= 0) {
    attendances[existingIdx] = record;
  } else {
    attendances.push(record);
  }

  return res.json({ success: true, record, message: `Attendance for ${date} marked as ${status}.` });
});

// 10. POST /staff/kiosk-punch - Tablet/Counter Kiosk PIN Check-in/out
shopkeeperPortal.post('/staff/kiosk-punch', async (req, res) => {
  const targetShopId = getShopkeeperShopId(req);
  const { pin, staffId, action = 'check_in', notes } = req.body || {};

  if (!pin || String(pin).trim().length < 4) {
    return res.status(400).json({ error: 'Valid 4-digit Kiosk PIN is required' });
  }

  const cleanPin = String(pin).trim();
  const db = mongoDb();

  let targetStaff: User | null = null;
  if (staffId) {
    if (db) targetStaff = await db.collection<User>('users').findOne({ id: staffId, shopId: targetShopId });
    if (!targetStaff) targetStaff = users.find(u => u.id === staffId && u.shopId === targetShopId) || null;
  } else {
    // Look up by pin in this shop
    if (db) {
      targetStaff = await db.collection<User>('users').findOne({
        shopId: targetShopId,
        $or: [{ kioskPin: cleanPin }, { phone: { $regex: `${cleanPin}$` } }]
      });
    }
    if (!targetStaff) {
      targetStaff = users.find(u => u.shopId === targetShopId && (u.kioskPin === cleanPin || u.phone.endsWith(cleanPin))) || null;
    }
  }

  if (!targetStaff) {
    return res.status(404).json({ error: 'No staff member found matching this PIN' });
  }

  const expectedPin = targetStaff.kioskPin || targetStaff.phone.slice(-4);
  if (expectedPin !== cleanPin) {
    return res.status(401).json({ error: 'Incorrect Kiosk PIN for this staff member' });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();

  let existingAtt = attendances.find(a => a.userId === targetStaff!.id && a.date === todayStr);
  if (db && !existingAtt) {
    existingAtt = (await db.collection<Attendance>('attendance').findOne({ userId: targetStaff.id, date: todayStr })) || undefined;
  }

  let updatedAtt: Attendance;
  if (existingAtt) {
    if (action === 'check_out') {
      updatedAtt = { ...existingAtt, checkOut: nowIso, notes: notes || existingAtt.notes };
    } else {
      updatedAtt = { ...existingAtt, checkIn: existingAtt.checkIn || nowIso, notes: notes || existingAtt.notes };
    }
  } else {
    updatedAtt = {
      id: `att-${targetStaff.id}-${todayStr}`,
      userId: targetStaff.id,
      shopId: targetShopId,
      date: todayStr,
      checkIn: nowIso,
      status: 'PRESENT',
      notes: notes || 'Punched in via Store Kiosk'
    };
  }

  if (db) {
    await db.collection<Attendance>('attendance').updateOne(
      { userId: targetStaff.id, date: todayStr },
      { $set: updatedAtt },
      { upsert: true }
    );
  }

  const idx = attendances.findIndex(a => a.userId === targetStaff!.id && a.date === todayStr);
  if (idx >= 0) attendances[idx] = updatedAtt;
  else attendances.push(updatedAtt);

  return res.json({
    success: true,
    staffName: targetStaff.name,
    designation: targetStaff.designation || 'Staff',
    action: action === 'check_out' ? 'Checked Out' : 'Checked In',
    timestamp: nowIso,
    attendance: updatedAtt,
    message: `${targetStaff.name} successfully ${action === 'check_out' ? 'checked out' : 'checked in'} at ${new Date().toLocaleTimeString('en-IN')}`
  });
});

// 11. GET /staff/payroll-export - Export Bank NEFT / RTGS batch CSV or Payroll Excel
shopkeeperPortal.get('/staff/payroll-export', async (req, res) => {
  const targetShopId = getShopkeeperShopId(req);
  const month = typeof req.query.month === 'string' ? req.query.month : new Date().toISOString().slice(0, 7);
  const type = req.query.type === 'neft' ? 'neft' : 'payroll';

  const db = mongoDb();
  let staffList: User[] = [];
  let allPayments: StaffSalaryPayment[] = [];

  if (db) {
    staffList = await db.collection<User>('users').find({ shopId: targetShopId, role: { $in: ['employee', 'store_manager'] } }).toArray();
    allPayments = await db.collection<StaffSalaryPayment>('staffSalaries').find({ shopId: targetShopId, month }).toArray();
  } else {
    staffList = users.filter(u => u.shopId === targetShopId && ['employee', 'store_manager'].includes(u.role));
    allPayments = staffSalaries.filter(s => s.shopId === targetShopId && s.month === month);
  }

  if (type === 'neft') {
    // Generate RBI/Bank NEFT Standard CSV
    // Columns: Beneficiary Name, Account Number, IFSC Code, Amount, Remarks, Staff ID
    const headers = 'Beneficiary Name,Account Number,IFSC Code,Amount,Payment Mode,Remarks,Staff ID\n';
    const rows = staffList.map(s => {
      const payment = allPayments.find(p => p.staffId === s.id);
      const amount = payment ? payment.netPaid : ((s.salaryStructure?.monthlyBase || 0) + (s.salaryStructure?.allowances || 0));
      const accNo = s.salaryStructure?.bankAccountNo || (s.salaryStructure?.upiId ? `UPI:${s.salaryStructure.upiId}` : 'CASH');
      const ifsc = s.salaryStructure?.bankIfsc || 'N/A';
      return `"${s.name.replace(/"/g, '""')}","${accNo}","${ifsc}",${amount},"${payment ? payment.paymentMode : (s.salaryStructure?.paymentMethod || 'UPI')}","Salary ${month}","${s.id}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Bank_NEFT_Batch_${month}.csv"`);
    return res.send(headers + rows);
  }

  // Full Payroll register CSV
  const headers = 'Staff ID,Name,Designation,Phone,Month,Base Salary,Allowances,Bonus,Advance Deductions,Other Deductions,Net Payout,Payment Mode,Status,Date Paid,Txn Ref\n';
  const rows = staffList.map(s => {
    const p = allPayments.find(pay => pay.staffId === s.id);
    const base = p ? p.baseAmount : (s.salaryStructure?.monthlyBase || 0);
    const allow = p ? p.allowances : (s.salaryStructure?.allowances || 0);
    const bonus = p ? p.bonusAmount : 0;
    const advDed = p ? p.advanceDeduction : 0;
    const othDed = p ? p.otherDeductions : (s.salaryStructure?.deductions || 0);
    const net = p ? p.netPaid : Math.max(0, base + allow - othDed);
    const mode = p ? p.paymentMode : (s.salaryStructure?.paymentMethod || 'UPI');
    const status = p ? p.status : 'PENDING';
    const datePaid = p ? p.paymentDate : 'Unpaid';
    const ref = p ? (p.referenceNumber || '') : '';
    return `"${s.id}","${s.name.replace(/"/g, '""')}","${s.designation || ''}","${s.phone}","${month}",${base},${allow},${bonus},${advDed},${othDed},${net},"${mode}","${status}","${datePaid}","${ref}"`;
  }).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Payroll_Register_${month}.csv"`);
  return res.send(headers + rows);
});
