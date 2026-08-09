import { describe, expect, it } from 'vitest';
import { CommerceRuleError } from './commerce-errors';
import {
  applyAdjustment,
  applyReservation,
  availableStock,
  computeSetQuantityDelta,
  isInStock,
  stockState,
} from './inventory';

describe('availableStock', () => {
  it('subtracts reserved units from on-hand stock', () => {
    expect(availableStock({ onHand: 20, reserved: 8 })).toBe(12);
  });

  it('reports oversold stock truthfully rather than clamping', () => {
    expect(availableStock({ onHand: 2, reserved: 5 })).toBe(-3);
  });
});

describe('stockState', () => {
  it('is out of stock at or below zero', () => {
    expect(stockState({ available: 0, lowStockThreshold: 5 })).toBe(
      'out_of_stock',
    );
    expect(stockState({ available: -2, lowStockThreshold: 5 })).toBe(
      'out_of_stock',
    );
  });

  it('is low stock at or below the threshold', () => {
    expect(stockState({ available: 5, lowStockThreshold: 5 })).toBe(
      'low_stock',
    );
    expect(stockState({ available: 1, lowStockThreshold: 5 })).toBe(
      'low_stock',
    );
  });

  it('is in stock above the threshold', () => {
    expect(stockState({ available: 6, lowStockThreshold: 5 })).toBe('in_stock');
  });
});

describe('isInStock', () => {
  it('projects availability to the legacy boolean', () => {
    expect(isInStock(1)).toBe(true);
    expect(isInStock(0)).toBe(false);
    expect(isInStock(-1)).toBe(false);
  });
});

describe('applyAdjustment', () => {
  it('adds stock and recomputes availability', () => {
    const result = applyAdjustment({
      level: { onHand: 20, reserved: 0 },
      delta: 10,
      lowStockThreshold: 5,
    });

    expect(result.onHand).toBe(30);
    expect(result.available).toBe(30);
    expect(result.state).toBe('in_stock');
  });

  it('removes stock and can land on out of stock', () => {
    const result = applyAdjustment({
      level: { onHand: 3, reserved: 0 },
      delta: -3,
      lowStockThreshold: 5,
    });

    expect(result.onHand).toBe(0);
    expect(result.state).toBe('out_of_stock');
  });

  it('rejects going negative by default', () => {
    expect(() =>
      applyAdjustment({
        level: { onHand: 2, reserved: 0 },
        delta: -5,
        lowStockThreshold: 5,
      }),
    ).toThrowError(CommerceRuleError);
  });

  it('allows going negative when the tenant opted in', () => {
    const result = applyAdjustment({
      level: { onHand: 2, reserved: 0 },
      delta: -5,
      lowStockThreshold: 5,
      allowNegativeInventory: true,
    });

    expect(result.onHand).toBe(-3);
    expect(result.state).toBe('out_of_stock');
  });

  it('rejects fractional adjustments', () => {
    expect(() =>
      applyAdjustment({
        level: { onHand: 2, reserved: 0 },
        delta: 1.5,
        lowStockThreshold: 5,
      }),
    ).toThrowError(CommerceRuleError);
  });
});

describe('computeSetQuantityDelta', () => {
  it('returns the delta needed to reach the target', () => {
    expect(
      computeSetQuantityDelta({ currentOnHand: 20, targetOnHand: 30 }),
    ).toBe(10);
    expect(
      computeSetQuantityDelta({ currentOnHand: 20, targetOnHand: 5 }),
    ).toBe(-15);
  });

  it('rejects a negative target', () => {
    expect(() =>
      computeSetQuantityDelta({ currentOnHand: 20, targetOnHand: -1 }),
    ).toThrowError(CommerceRuleError);
  });
});

describe('applyReservation', () => {
  it('reserves available stock', () => {
    const result = applyReservation({
      level: { onHand: 10, reserved: 2 },
      quantity: 3,
      lowStockThreshold: 5,
    });

    expect(result.reserved).toBe(5);
    expect(result.available).toBe(5);
    expect(result.state).toBe('low_stock');
  });

  it('releases a reservation', () => {
    const result = applyReservation({
      level: { onHand: 10, reserved: 4 },
      quantity: -4,
      lowStockThreshold: 5,
    });

    expect(result.reserved).toBe(0);
    expect(result.available).toBe(10);
  });

  it('refuses to reserve more than is available', () => {
    expect(() =>
      applyReservation({
        level: { onHand: 10, reserved: 8 },
        quantity: 5,
        lowStockThreshold: 5,
      }),
    ).toThrowError(CommerceRuleError);
  });

  it('refuses to release more than is reserved', () => {
    expect(() =>
      applyReservation({
        level: { onHand: 10, reserved: 1 },
        quantity: -2,
        lowStockThreshold: 5,
      }),
    ).toThrowError(CommerceRuleError);
  });
});
