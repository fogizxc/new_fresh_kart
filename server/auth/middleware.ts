import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../models/domain.ts';
import { getUserFromToken } from './auth.ts';
import { roleHasPermission, PERMISSIONS, type Permission } from './permissions.ts';
import { mongoDb } from '../db/mongodb.ts';
import { shops } from '../store/memoryStore.ts';

declare global { namespace Express { interface Request { user?: import('../models/domain.ts').User } } }

async function resolveShopId(user: import('../models/domain.ts').User) {
  if (user.shopId) return user.shopId;
  if (!['shopkeeper', 'store_manager', 'employee'].includes(user.role)) return undefined;
  const db = mongoDb();
  if (db) {
    const shop = await db.collection('shops').findOne<{ id: string }>({ shopkeeperId: user.id, active: true }, { projection: { id: 1 } });
    if (shop?.id) return shop.id;
    const staffShop = await db.collection('shops').findOne<{ id: string }>({ active: true, $or: [{ managerId: user.id }, { managerIds: user.id }, { employeeIds: user.id }] }, { projection: { id: 1 } });
    if (staffShop?.id) return staffShop.id;
  }
  return shops.find(shop => shop.active && (shop.shopkeeperId === user.id || (shop as any).managerId === user.id || (shop as any).managerIds?.includes?.(user.id) || (shop as any).employeeIds?.includes?.(user.id)))?.id;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authorization = req.headers?.authorization;
    const token = typeof authorization === 'string' ? authorization.replace(/^Bearer\s+/i, '') : undefined;
    const user = await getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    if (process.env.NODE_ENV === 'production' && !mongoDb()) return res.status(503).json({ error: 'Authentication database is unavailable' });
    const shopId = await resolveShopId(user);
    if (shopId && !user.shopId) user.shopId = shopId;
    req.user = user;
    return next();
  } catch (error) {
    console.error(error);
    return res.status(503).json({ error: 'Authentication service unavailable' });
  }
}

export function requireRole(...roles: Role[]) { return (req: Request, res: Response, next: NextFunction) => { if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' }); next(); }; }
export function requirePermission(permission: Permission) { return (req: Request, res: Response, next: NextFunction) => { if (!req.user || !roleHasPermission(req.user.role, permission)) return res.status(403).json({ error: 'Insufficient permissions', requiredPermission: permission }); next(); }; }

export function requirePortalPermission(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  const path = req.path.toLowerCase();
  let permission: Permission = PERMISSIONS.VIEW_INVENTORY;
  if (path.includes('/attendance')) permission = PERMISSIONS.PROCESS_ORDERS;
  else if (path.includes('/payroll')) permission = req.method === 'GET' ? PERMISSIONS.VIEW_PAYROLL : PERMISSIONS.MANAGE_PAYROLL;
  else if (path.includes('/staff') || path.includes('/salary')) permission = req.method === 'GET' ? PERMISSIONS.MANAGE_STAFF : PERMISSIONS.MANAGE_STAFF;
  else if (path.includes('/products')) {
    if (req.method === 'GET') permission = PERMISSIONS.VIEW_INVENTORY;
    else if (path.includes('/stock') || path.includes('/batch')) permission = PERMISSIONS.UPDATE_STOCK;
    else permission = PERMISSIONS.MANAGE_CATALOG;
  } else if (path.includes('/orders')) permission = req.method === 'GET' ? PERMISSIONS.VIEW_OWN_SHOP_ORDERS : PERMISSIONS.PROCESS_ORDERS;
  if (!roleHasPermission(req.user.role, permission)) return res.status(403).json({ error: 'Insufficient permissions', requiredPermission: permission });
  next();
}
