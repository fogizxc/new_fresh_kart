const CART_STORAGE_KEY = 'freshcart_cart';
const CART_SHOP_KEY = 'freshcart_cart_shop_id';
const CART_UPDATED_EVENT = 'freshcart:cart-updated';

export function cartUpdatedEventName(): string {
  return CART_UPDATED_EVENT;
}

export function getCartShopId(): string | null {
  return localStorage.getItem(CART_SHOP_KEY);
}

export function setCartShopId(shopId: string | null): void {
  if (!shopId) {
    localStorage.removeItem(CART_SHOP_KEY);
  } else {
    localStorage.setItem(CART_SHOP_KEY, shopId);
  }
}

export function loadCart(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, number>;
    }
    return {};
  } catch {
    return {};
  }
}

export function saveCart(cart: Record<string, number>, shopId?: string | null): void {
  try {
    const hasItems = Object.values(cart).some(q => q > 0);
    if (!hasItems) {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(CART_SHOP_KEY);
    } else {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      if (shopId !== undefined) {
        setCartShopId(shopId);
      }
    }
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
  } catch (err) {
    console.error('Failed to save cart to localStorage:', err);
  }
}

export interface AddItemResult {
  success: boolean;
  conflict?: {
    currentShopId: string;
    newShopId: string;
  };
}

/**
 * Adds or updates item with strict single-shop integrity check.
 * If user attempts to add an item from Shop B when cart already has items from Shop A,
 * returns { success: false, conflict: { currentShopId, newShopId } }.
 */
export function addItemToCart(
  productId: string,
  quantity: number,
  itemShopId?: string,
  forceReplace = false
): AddItemResult {
  const current = loadCart();
  const currentShopId = getCartShopId();
  const hasItems = Object.keys(current).some(k => current[k] > 0);

  if (hasItems && currentShopId && itemShopId && currentShopId !== itemShopId && !forceReplace) {
    return {
      success: false,
      conflict: {
        currentShopId,
        newShopId: itemShopId
      }
    };
  }

  if (forceReplace && itemShopId && currentShopId !== itemShopId) {
    // Reset cart to new shop
    const freshCart: Record<string, number> = { [productId]: quantity };
    saveCart(freshCart, itemShopId);
    return { success: true };
  }

  current[productId] = (current[productId] ?? 0) + quantity;
  if (current[productId] <= 0) {
    delete current[productId];
  }
  saveCart(current, itemShopId || currentShopId);
  return { success: true };
}

export function setItemQuantity(productId: string, quantity: number, itemShopId?: string): void {
  const current = loadCart();
  const currentShopId = getCartShopId() || itemShopId || null;

  if (quantity <= 0) {
    delete current[productId];
  } else {
    current[productId] = quantity;
  }
  saveCart(current, currentShopId);
}

export function addItemsToCart(items: { productId: string; quantity: number }[], shopId?: string): void {
  const current = loadCart();
  for (const item of items) {
    if (item.productId && item.quantity > 0) {
      current[item.productId] = (current[item.productId] ?? 0) + item.quantity;
    }
  }
  saveCart(current, shopId ?? getCartShopId());
}

export function clearCart(): void {
  saveCart({}, null);
}
