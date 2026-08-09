import { describe, expect, it } from 'vitest';
import { CommerceRuleError } from './commerce-errors';
import {
  buildPriceBreakdown,
  resolveEffectivePrice,
  roundMoney,
} from './pricing';

describe('resolveEffectivePrice', () => {
  it('falls back to the product base price when the variant has none', () => {
    expect(
      resolveEffectivePrice({ productPrice: 1_000_000, variantPrice: null }),
    ).toBe(1_000_000);
    expect(resolveEffectivePrice({ productPrice: 1_000_000 })).toBe(1_000_000);
  });

  it('lets the variant override the base price', () => {
    expect(
      resolveEffectivePrice({
        productPrice: 1_000_000,
        variantPrice: 1_200_000,
      }),
    ).toBe(1_200_000);
  });

  it('honours a variant price that is lower than the base price', () => {
    expect(
      resolveEffectivePrice({ productPrice: 1_000_000, variantPrice: 800_000 }),
    ).toBe(800_000);
  });

  it('treats a zero variant price as an override, not as missing', () => {
    expect(
      resolveEffectivePrice({ productPrice: 1_000_000, variantPrice: 0 }),
    ).toBe(0);
  });

  it('rejects negative or non-finite prices', () => {
    expect(() => resolveEffectivePrice({ productPrice: -1 })).toThrowError(
      CommerceRuleError,
    );
    expect(() =>
      resolveEffectivePrice({ productPrice: 100, variantPrice: -5 }),
    ).toThrowError(CommerceRuleError);
    expect(() =>
      resolveEffectivePrice({ productPrice: Number.NaN }),
    ).toThrowError(CommerceRuleError);
  });
});

describe('roundMoney', () => {
  it('rounds to two decimals', () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });
});

describe('buildPriceBreakdown', () => {
  it('reports the discounted price without mutating the list price', () => {
    const breakdown = buildPriceBreakdown({
      productPrice: 850_000,
      variantPrice: null,
      compareAtPrice: 950_000,
      discountAmount: 85_000,
      appliedDiscounts: [
        {
          id: 'd1',
          name: 'off10',
          code: null,
          type: 'percentage',
          value: 10,
          amount: 85_000,
        },
      ],
    });

    expect(breakdown.basePrice).toBe(850_000);
    expect(breakdown.variantPrice).toBeNull();
    expect(breakdown.listPrice).toBe(850_000);
    expect(breakdown.compareAtPrice).toBe(950_000);
    expect(breakdown.discountAmount).toBe(85_000);
    expect(breakdown.effectivePrice).toBe(765_000);
    expect(breakdown.currency).toBe('IRR');
    expect(breakdown.appliedDiscounts).toHaveLength(1);
  });

  it('uses the variant price as the list price', () => {
    const breakdown = buildPriceBreakdown({
      productPrice: 1_000_000,
      variantPrice: 1_200_000,
    });

    expect(breakdown.listPrice).toBe(1_200_000);
    expect(breakdown.variantPrice).toBe(1_200_000);
    expect(breakdown.effectivePrice).toBe(1_200_000);
  });

  it('never lets a discount push the price below zero', () => {
    const breakdown = buildPriceBreakdown({
      productPrice: 100_000,
      discountAmount: 500_000,
    });

    expect(breakdown.discountAmount).toBe(100_000);
    expect(breakdown.effectivePrice).toBe(0);
  });
});
