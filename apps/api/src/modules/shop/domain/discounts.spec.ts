import { describe, expect, it } from 'vitest';
import { CommerceRuleError } from './commerce-errors';
import {
  DiscountContext,
  DiscountRule,
  assertValidDiscount,
  calculateDiscount,
  isEligible,
  selectApplicableDiscounts,
} from './discounts';

const NOW = new Date('2026-08-08T12:00:00.000Z');

function rule(overrides: Partial<DiscountRule> = {}): DiscountRule {
  return {
    id: 'd1',
    name: 'تخفیف تابستان',
    type: 'percentage',
    value: 10,
    active: true,
    usedCount: 0,
    ...overrides,
  };
}

function context(overrides: Partial<DiscountContext> = {}): DiscountContext {
  return { now: NOW, subtotal: 1_000_000, ...overrides };
}

describe('assertValidDiscount', () => {
  it('accepts a valid percentage and fixed discount', () => {
    expect(() =>
      assertValidDiscount({ type: 'percentage', value: 10 }),
    ).not.toThrow();
    expect(() =>
      assertValidDiscount({ type: 'fixed', value: 50_000 }),
    ).not.toThrow();
  });

  it('rejects a percentage outside 1..100', () => {
    expect(() => assertValidDiscount({ type: 'percentage', value: 0 })).toThrowError(
      CommerceRuleError,
    );
    expect(() =>
      assertValidDiscount({ type: 'percentage', value: 101 }),
    ).toThrowError(CommerceRuleError);
  });

  it('rejects a non-positive fixed amount', () => {
    expect(() => assertValidDiscount({ type: 'fixed', value: 0 })).toThrowError(
      CommerceRuleError,
    );
  });

  it('rejects an end date on or before the start date', () => {
    expect(() =>
      assertValidDiscount({
        type: 'percentage',
        value: 10,
        startsAt: new Date('2026-08-10T00:00:00.000Z'),
        endsAt: new Date('2026-08-01T00:00:00.000Z'),
      }),
    ).toThrowError(CommerceRuleError);
  });
});

describe('isEligible', () => {
  it('respects the validity window', () => {
    const expired = rule({ endsAt: new Date('2026-08-01T00:00:00.000Z') });
    const notStarted = rule({ startsAt: new Date('2026-09-01T00:00:00.000Z') });
    const current = rule({
      startsAt: new Date('2026-08-01T00:00:00.000Z'),
      endsAt: new Date('2026-09-01T00:00:00.000Z'),
    });

    expect(isEligible(expired, context())).toBe(false);
    expect(isEligible(notStarted, context())).toBe(false);
    expect(isEligible(current, context())).toBe(true);
  });

  it('respects the active flag', () => {
    expect(isEligible(rule({ active: false }), context())).toBe(false);
  });

  it('enforces the minimum cart amount', () => {
    const withMinimum = rule({ minCartAmount: 2_000_000 });

    expect(isEligible(withMinimum, context({ subtotal: 1_000_000 }))).toBe(false);
    expect(isEligible(withMinimum, context({ subtotal: 2_000_000 }))).toBe(true);
  });

  it('enforces the usage limit', () => {
    expect(
      isEligible(rule({ usageLimit: 5, usedCount: 5 }), context()),
    ).toBe(false);
    expect(
      isEligible(rule({ usageLimit: 5, usedCount: 4 }), context()),
    ).toBe(true);
  });

  it('requires a matching coupon code, case-insensitively', () => {
    const coded = rule({ code: 'SUMMER' });

    expect(isEligible(coded, context())).toBe(false);
    expect(isEligible(coded, context({ code: 'summer' }))).toBe(true);
    expect(isEligible(coded, context({ code: 'WINTER' }))).toBe(false);
  });

  it('applies automatic discounts without a code', () => {
    expect(isEligible(rule({ code: null }), context())).toBe(true);
  });

  it('targets products, variants and categories', () => {
    const productOnly = rule({
      targets: [{ targetType: 'product', targetId: 'p1' }],
    });
    const categoryOnly = rule({
      targets: [{ targetType: 'category', targetId: 'c1' }],
    });
    const variantOnly = rule({
      targets: [{ targetType: 'variant', targetId: 'v1' }],
    });

    expect(isEligible(productOnly, context({ productId: 'p1' }))).toBe(true);
    expect(isEligible(productOnly, context({ productId: 'p2' }))).toBe(false);
    expect(isEligible(categoryOnly, context({ categoryId: 'c1' }))).toBe(true);
    expect(isEligible(categoryOnly, context({ categoryId: 'c2' }))).toBe(false);
    expect(isEligible(variantOnly, context({ variantId: 'v1' }))).toBe(true);
    expect(isEligible(variantOnly, context({ variantId: 'v2' }))).toBe(false);
  });

  it('treats an empty target list as targeting everything', () => {
    expect(isEligible(rule({ targets: [] }), context())).toBe(true);
    expect(
      isEligible(rule({ targets: [{ targetType: 'all' }] }), context()),
    ).toBe(true);
  });

  it('ignores discounts in another currency', () => {
    expect(
      isEligible(rule({ currency: 'USD' }), context({ currency: 'IRR' })),
    ).toBe(false);
  });
});

describe('selectApplicableDiscounts', () => {
  it('orders by priority, then deterministically by id', () => {
    const discounts = [
      rule({ id: 'b', priority: 1 }),
      rule({ id: 'a', priority: 1 }),
      rule({ id: 'c', priority: 5 }),
    ];

    expect(
      selectApplicableDiscounts(context(), discounts).map((d) => d.id),
    ).toEqual(['c', 'a', 'b']);
  });

  it('filters out ineligible discounts', () => {
    const discounts = [rule({ id: 'a' }), rule({ id: 'b', active: false })];

    expect(
      selectApplicableDiscounts(context(), discounts).map((d) => d.id),
    ).toEqual(['a']);
  });
});

describe('calculateDiscount', () => {
  it('applies a percentage discount', () => {
    const result = calculateDiscount(context({ subtotal: 850_000 }), [
      rule({ type: 'percentage', value: 10 }),
    ]);

    expect(result.discountAmount).toBe(85_000);
    expect(result.finalPrice).toBe(765_000);
    expect(result.appliedDiscounts).toHaveLength(1);
  });

  it('applies a fixed discount', () => {
    const result = calculateDiscount(context({ subtotal: 850_000 }), [
      rule({ type: 'fixed', value: 100_000 }),
    ]);

    expect(result.discountAmount).toBe(100_000);
    expect(result.finalPrice).toBe(750_000);
  });

  it('never discounts more than the subtotal', () => {
    const result = calculateDiscount(context({ subtotal: 50_000 }), [
      rule({ type: 'fixed', value: 200_000 }),
    ]);

    expect(result.discountAmount).toBe(50_000);
    expect(result.finalPrice).toBe(0);
  });

  it('honours the maximum discount cap', () => {
    const result = calculateDiscount(context({ subtotal: 10_000_000 }), [
      rule({ type: 'percentage', value: 50, maxDiscountAmount: 1_000_000 }),
    ]);

    expect(result.discountAmount).toBe(1_000_000);
    expect(result.finalPrice).toBe(9_000_000);
  });

  it('applies only the highest-priority discount when it is not stackable', () => {
    const result = calculateDiscount(context({ subtotal: 1_000_000 }), [
      rule({ id: 'high', priority: 10, value: 20, stackable: false }),
      rule({ id: 'low', priority: 1, value: 10, stackable: true }),
    ]);

    expect(result.appliedDiscounts.map((d) => d.id)).toEqual(['high']);
    expect(result.discountAmount).toBe(200_000);
  });

  it('stacks discounts sequentially on the running remainder', () => {
    const result = calculateDiscount(context({ subtotal: 1_000_000 }), [
      rule({ id: 'first', priority: 10, value: 10, stackable: true }),
      rule({ id: 'second', priority: 5, value: 10, stackable: true }),
    ]);

    // 1,000,000 - 100,000 = 900,000 then -90,000
    expect(result.appliedDiscounts.map((d) => d.amount)).toEqual([
      100_000, 90_000,
    ]);
    expect(result.discountAmount).toBe(190_000);
    expect(result.finalPrice).toBe(810_000);
  });

  it('returns the untouched subtotal when nothing is eligible', () => {
    const result = calculateDiscount(context({ subtotal: 500_000 }), [
      rule({ active: false }),
    ]);

    expect(result.discountAmount).toBe(0);
    expect(result.finalPrice).toBe(500_000);
    expect(result.appliedDiscounts).toEqual([]);
  });

  it('is deterministic across repeated calls', () => {
    const discounts = [
      rule({ id: 'a', priority: 1, value: 10, stackable: true }),
      rule({ id: 'b', priority: 1, value: 5, stackable: true }),
    ];

    const first = calculateDiscount(context(), discounts);
    const second = calculateDiscount(context(), discounts);

    expect(first).toEqual(second);
  });
});
