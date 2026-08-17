import { CommerceRuleError } from './commerce-errors';

/**
 * Fulfillment / merchant workflow. Payment is a separate axis
 * (`PaymentStatus`) so “paid” is never confused with “approved to ship”.
 *
 * Legacy `confirmed` is treated as `approved`.
 */
export const ORDER_STATUSES = [
  'pending',
  'pending_payment',
  'pending_approval',
  'approved',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'rejected',
  'payment_failed',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'unpaid',
  'pending',
  'paid',
  'failed',
  'refunded',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const LEGACY_STATUS_ALIAS: Record<string, OrderStatus> = {
  confirmed: 'approved',
};

const ALLOWED_FROM: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['approved', 'rejected', 'cancelled'],
  pending_payment: ['pending_approval', 'payment_failed', 'cancelled'],
  pending_approval: ['approved', 'rejected', 'cancelled'],
  approved: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  rejected: [],
  payment_failed: ['cancelled', 'pending_approval'],
};

const RESTOCK_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'cancelled',
  'rejected',
]);

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value);
}

export function canonicalizeOrderStatus(status: string): OrderStatus {
  const mapped = LEGACY_STATUS_ALIAS[status] ?? status;
  if (!isOrderStatus(mapped)) {
    throw new CommerceRuleError(
      'invalid_order_transition',
      `وضعیت سفارش نامعتبر است: ${status}`,
    );
  }
  return mapped;
}

export function allowedTransitions(from: OrderStatus): readonly OrderStatus[] {
  return ALLOWED_FROM[from];
}

export function canTransition(from: string, to: string): boolean {
  const source = canonicalizeOrderStatus(from);
  const target = canonicalizeOrderStatus(to);
  if (source === target) return true;
  return ALLOWED_FROM[source].includes(target);
}

export function assertTransition(from: string, to: string): void {
  if (!canTransition(from, to)) {
    throw new CommerceRuleError(
      'invalid_order_transition',
      'این تغییر وضعیت مجاز نیست',
    );
  }
}

export function normalizeRejectionReason(reason: string | null | undefined): string {
  const trimmed = reason?.trim() ?? '';
  if (trimmed.length < 3) {
    throw new CommerceRuleError(
      'rejection_reason_required',
      'دلیل رد سفارش الزامی است',
    );
  }
  return trimmed;
}

export function shouldRestockInventory(from: string, to: string): boolean {
  const source = canonicalizeOrderStatus(from);
  const target = canonicalizeOrderStatus(to);
  if (source === target) return false;
  if (!RESTOCK_STATUSES.has(target)) return false;
  return !RESTOCK_STATUSES.has(source);
}

export function initialPaymentStatus(paymentMethod: string): PaymentStatus {
  return paymentMethod === 'online' ? 'pending' : 'unpaid';
}

export function initialOrderStatus(paymentMethod: string): OrderStatus {
  return paymentMethod === 'online' ? 'pending_payment' : 'pending';
}

export function isPaidFulfillmentStatus(status: string): boolean {
  const canonical = canonicalizeOrderStatus(status);
  return (
    canonical === 'pending_approval' ||
    canonical === 'approved' ||
    canonical === 'processing' ||
    canonical === 'shipped' ||
    canonical === 'delivered'
  );
}
