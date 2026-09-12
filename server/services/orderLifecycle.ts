import type { OrderStatus } from '../models/domain';

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PLACED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PICKING', 'CANCELLED'],
  PICKING: ['PACKING'],
  PACKING: ['READY'],
  READY: ['OUT_FOR_DELIVERY', 'COLLECTED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  COLLECTED: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return from === to || ORDER_TRANSITIONS[from].includes(to);
}
