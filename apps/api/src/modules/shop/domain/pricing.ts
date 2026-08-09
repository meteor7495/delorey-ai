import { CommerceRuleError } from './commerce-errors';

/**
 * Deterministic price resolution.
 *
 * Effective price = variant price when the variant overrides it, otherwise the
 * product base price. Discounts never mutate stored prices — they are applied
 * on top of the resolved list price by discounts.ts.
 */

export interface AppliedDiscountSummary {
  id: string;
  name: string;
  code: string | null;
  type: 'percentage' | 'fixed';
  value: number;
  amount: number;
}

export interface PriceBreakdown {
  /** Product base price. */
  basePrice: number;
  /** Variant override, or null when the variant inherits the base price. */
  variantPrice: number | null;
  /** Price before discounts — what the shopper sees struck through. */
  listPrice: number;
  compareAtPrice: number | null;
  discountAmount: number;
  /** Price after all applicable discounts. */
  effectivePrice: number;
  currency: string;
  appliedDiscounts: AppliedDiscountSummary[];
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function assertValidPrice(value: number, field = 'قیمت'): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new CommerceRuleError(
      'invalid_price',
      `${field} باید عددی بزرگ‌تر یا مساوی صفر باشد`,
    );
  }
}

export function resolveEffectivePrice(input: {
  productPrice: number;
  variantPrice?: number | null;
}): number {
  const { productPrice, variantPrice } = input;
  assertValidPrice(productPrice, 'قیمت پایه');
  if (variantPrice == null) return roundMoney(productPrice);
  assertValidPrice(variantPrice, 'قیمت تنوع');
  return roundMoney(variantPrice);
}

export function buildPriceBreakdown(input: {
  productPrice: number;
  variantPrice?: number | null;
  compareAtPrice?: number | null;
  currency?: string;
  discountAmount?: number;
  appliedDiscounts?: AppliedDiscountSummary[];
}): PriceBreakdown {
  const listPrice = resolveEffectivePrice(input);
  const discountAmount = roundMoney(
    Math.min(Math.max(input.discountAmount ?? 0, 0), listPrice),
  );

  return {
    basePrice: roundMoney(input.productPrice),
    variantPrice: input.variantPrice == null ? null : roundMoney(input.variantPrice),
    listPrice,
    compareAtPrice:
      input.compareAtPrice == null ? null : roundMoney(input.compareAtPrice),
    discountAmount,
    effectivePrice: roundMoney(listPrice - discountAmount),
    currency: input.currency ?? 'IRR',
    appliedDiscounts: input.appliedDiscounts ?? [],
  };
}
