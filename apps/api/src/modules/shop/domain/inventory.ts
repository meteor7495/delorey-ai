import { CommerceRuleError } from './commerce-errors';

/**
 * Inventory arithmetic.
 *
 * available = onHand - reserved
 *
 * Every quantity change goes through applyAdjustment / applyReservation so the
 * caller always has the resulting on-hand value to write into the append-only
 * inventory_transactions ledger.
 */

export type StockState = 'in_stock' | 'low_stock' | 'out_of_stock';

export type InventoryTransactionType =
  | 'initial'
  | 'adjustment'
  | 'sale'
  | 'reservation'
  | 'reservation_release'
  | 'return'
  | 'restock'
  | 'correction';

export const INVENTORY_TRANSACTION_TYPES: InventoryTransactionType[] = [
  'initial',
  'adjustment',
  'sale',
  'reservation',
  'reservation_release',
  'return',
  'restock',
  'correction',
];

export interface StockLevel {
  onHand: number;
  reserved: number;
}

export interface AdjustmentResult {
  onHand: number;
  reserved: number;
  available: number;
  state: StockState;
}

/** Truthful availability — may be negative when oversold. */
export function availableStock(level: StockLevel): number {
  return level.onHand - level.reserved;
}

export function stockState(input: {
  available: number;
  lowStockThreshold: number;
}): StockState {
  if (input.available <= 0) return 'out_of_stock';
  if (input.available <= input.lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

/** Projection written back to Product.inStock for storefront and AI reads. */
export function isInStock(available: number): boolean {
  return available > 0;
}

/**
 * Availability for a product that may not be inventory-tracked.
 *
 * Products imported from Shopify/WooCommerce/Instagram and everything created
 * before inventory tracking existed have no InventoryLevel rows. Treating their
 * missing levels as zero would report sellable goods as ناموجود, so the legacy
 * Product.inStock flag stays authoritative until real levels exist.
 */
export function resolveStockState(input: {
  tracked: boolean;
  available: number;
  lowStockThreshold: number;
  inStockFlag: boolean;
}): StockState {
  if (!input.tracked) return input.inStockFlag ? 'in_stock' : 'out_of_stock';
  return stockState({
    available: input.available,
    lowStockThreshold: input.lowStockThreshold,
  });
}

function assertInteger(value: number, field: string): void {
  if (!Number.isInteger(value)) {
    throw new CommerceRuleError(
      'invalid_quantity',
      `${field} باید عدد صحیح باشد`,
    );
  }
}

/**
 * Change physical stock. Negative results are rejected unless the tenant has
 * explicitly enabled negative inventory in commerce settings.
 */
export function applyAdjustment(input: {
  level: StockLevel;
  delta: number;
  lowStockThreshold: number;
  allowNegativeInventory?: boolean;
}): AdjustmentResult {
  assertInteger(input.delta, 'مقدار تغییر موجودی');

  const onHand = input.level.onHand + input.delta;
  if (onHand < 0 && !input.allowNegativeInventory) {
    throw new CommerceRuleError(
      'negative_inventory',
      'موجودی نمی‌تواند منفی شود',
    );
  }

  const reserved = input.level.reserved;
  const available = availableStock({ onHand, reserved });
  return {
    onHand,
    reserved,
    available,
    state: stockState({
      available,
      lowStockThreshold: input.lowStockThreshold,
    }),
  };
}

/** Set stock to an absolute value; returns the delta to record in the ledger. */
export function computeSetQuantityDelta(input: {
  currentOnHand: number;
  targetOnHand: number;
}): number {
  assertInteger(input.targetOnHand, 'موجودی جدید');
  if (input.targetOnHand < 0) {
    throw new CommerceRuleError(
      'negative_inventory',
      'موجودی نمی‌تواند منفی شود',
    );
  }
  return input.targetOnHand - input.currentOnHand;
}

/**
 * Reserve (positive quantity) or release (negative quantity) stock.
 * Reserving more than is available is rejected unless negative inventory is on.
 */
export function applyReservation(input: {
  level: StockLevel;
  quantity: number;
  lowStockThreshold: number;
  allowNegativeInventory?: boolean;
}): AdjustmentResult {
  assertInteger(input.quantity, 'مقدار رزرو');

  const reserved = input.level.reserved + input.quantity;
  if (reserved < 0) {
    throw new CommerceRuleError(
      'invalid_quantity',
      'مقدار رزروشده نمی‌تواند منفی شود',
    );
  }

  const onHand = input.level.onHand;
  const available = availableStock({ onHand, reserved });
  if (available < 0 && !input.allowNegativeInventory) {
    throw new CommerceRuleError(
      'negative_inventory',
      'موجودی قابل فروش کافی نیست',
    );
  }

  return {
    onHand,
    reserved,
    available,
    state: stockState({
      available,
      lowStockThreshold: input.lowStockThreshold,
    }),
  };
}
