export const FREE_DELIVERY_THRESHOLD = 499;
export const STANDARD_DELIVERY_FEE = 39;

export function calculateDeliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
}

export function calculateOrderTotal(
  subtotal: number,
  discount: number = 0
): { deliveryFee: number; total: number } {
  const deliveryFee = calculateDeliveryFee(subtotal);
  const total = Math.max(0, subtotal + deliveryFee - discount);
  return { deliveryFee, total };
}
