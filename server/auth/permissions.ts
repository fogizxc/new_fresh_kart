import type { Role } from '../models/domain.ts';

/** Fine-grained permissions used by server-side authorization checks. */
export const PERMISSIONS = {
  VIEW_OWN_SHOP_ORDERS: 'orders:view_own_shop',
  PROCESS_ORDERS: 'orders:process',
  CANCEL_ORDERS: 'orders:cancel',
  VIEW_INVENTORY: 'inventory:view',
  COUNT_INVENTORY: 'inventory:count',
  UPDATE_STOCK: 'inventory:update_stock',
  TRANSFER_STOCK: 'inventory:transfer',
  MANAGE_CATALOG: 'catalog:manage',
  CHANGE_PRICES: 'catalog:change_prices',
  MANAGE_SHOPS: 'shops:manage',
  MANAGE_STAFF: 'staff:manage',
  VIEW_PAYROLL: 'payroll:view',
  MANAGE_PAYROLL: 'payroll:manage',
  VIEW_FINANCIALS: 'finance:view',
  MANAGE_PAYMENTS: 'payments:manage',
  VIEW_AUDIT_LOGS: 'audit:view',
  APPROVE_APPLICATIONS: 'applications:approve',
  MANAGE_PLATFORM: 'platform:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Default role capabilities. These are intentionally conservative for employees.
 * Shop scope must still be enforced separately by the route/service handling the resource.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  customer: [],
  employee: [
    PERMISSIONS.VIEW_OWN_SHOP_ORDERS,
    PERMISSIONS.PROCESS_ORDERS,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.COUNT_INVENTORY,
  ],
  shopkeeper: [
    PERMISSIONS.VIEW_OWN_SHOP_ORDERS,
    PERMISSIONS.PROCESS_ORDERS,
    PERMISSIONS.CANCEL_ORDERS,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.COUNT_INVENTORY,
    PERMISSIONS.UPDATE_STOCK,
    PERMISSIONS.TRANSFER_STOCK,
    PERMISSIONS.MANAGE_CATALOG,
    PERMISSIONS.CHANGE_PRICES,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.VIEW_FINANCIALS,
  ],
  store_manager: [
    PERMISSIONS.VIEW_OWN_SHOP_ORDERS,
    PERMISSIONS.PROCESS_ORDERS,
    PERMISSIONS.CANCEL_ORDERS,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.COUNT_INVENTORY,
    PERMISSIONS.UPDATE_STOCK,
    PERMISSIONS.TRANSFER_STOCK,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.VIEW_FINANCIALS,
  ],
  admin: [
    ...Object.values(PERMISSIONS).filter(permission => permission !== PERMISSIONS.MANAGE_PLATFORM && permission !== PERMISSIONS.APPROVE_APPLICATIONS),
    PERMISSIONS.APPROVE_APPLICATIONS,
  ],
  super_admin: Object.values(PERMISSIONS),
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
