import { CommerceRuleError } from './commerce-errors';
import { AppliedDiscountSummary, roundMoney } from './pricing';

/**
 * Centralized discount selection and calculation.
 *
 * Discounts are a separate commerce entity — they never overwrite stored
 * prices. Both the merchant API and the AI Runtime call this so a quoted price
 * is always the price the backend would actually charge.
 */

export type DiscountType = 'percentage' | 'fixed';

export type DiscountTargetType = 'all' | 'product' | 'category' | 'variant';

export interface DiscountTargetRule {
  targetType: DiscountTargetType;
  targetId?: string | null;
}

export interface DiscountRule {
  id: string;
  name: string;
  code?: string | null;
  type: DiscountType;
  value: number;
  currency?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  active: boolean;
  usageLimit?: number | null;
  usedCount?: number;
  minCartAmount?: number | null;
  maxDiscountAmount?: number | null;
  priority?: number;
  stackable?: boolean;
  /** Empty targets are treated as targeting everything. */
  targets?: DiscountTargetRule[];
}

export interface DiscountContext {
  now: Date;
  /** Amount the discount applies to — a line total or a cart subtotal. */
  subtotal: number;
  currency?: string;
  productId?: string | null;
  variantId?: string | null;
  categoryId?: string | null;
  /** Coupon code supplied by the shopper, if any. */
  code?: string | null;
}

export interface DiscountCalculation {
  subtotal: number;
  discountAmount: number;
  finalPrice: number;
  appliedDiscounts: AppliedDiscountSummary[];
}

export function assertValidDiscount(rule: {
  type: DiscountType;
  value: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  minCartAmount?: number | null;
  maxDiscountAmount?: number | null;
}): void {
  if (!Number.isFinite(rule.value)) {
    throw new CommerceRuleError('invalid_discount', 'مقدار تخفیف نامعتبر است');
  }
  if (rule.type === 'percentage') {
    if (rule.value <= 0 || rule.value > 100) {
      throw new CommerceRuleError(
        'invalid_discount',
        'درصد تخفیف باید بین ۱ تا ۱۰۰ باشد',
      );
    }
  } else if (rule.type === 'fixed') {
    if (rule.value <= 0) {
      throw new CommerceRuleError(
        'invalid_discount',
        'مبلغ تخفیف باید بزرگ‌تر از صفر باشد',
      );
    }
  } else {
    throw new CommerceRuleError('invalid_discount', 'نوع تخفیف پشتیبانی نمی‌شود');
  }

  if (rule.startsAt && rule.endsAt && rule.endsAt <= rule.startsAt) {
    throw new CommerceRuleError(
      'invalid_discount',
      'تاریخ پایان باید بعد از تاریخ شروع باشد',
    );
  }
  if (rule.minCartAmount != null && rule.minCartAmount < 0) {
    throw new CommerceRuleError(
      'invalid_discount',
      'حداقل مبلغ سبد نمی‌تواند منفی باشد',
    );
  }
  if (rule.maxDiscountAmount != null && rule.maxDiscountAmount <= 0) {
    throw new CommerceRuleError(
      'invalid_discount',
      'سقف تخفیف باید بزرگ‌تر از صفر باشد',
    );
  }
}

function withinWindow(rule: DiscountRule, now: Date): boolean {
  if (rule.startsAt && now < rule.startsAt) return false;
  if (rule.endsAt && now > rule.endsAt) return false;
  return true;
}

function withinUsageLimit(rule: DiscountRule): boolean {
  if (rule.usageLimit == null) return true;
  return (rule.usedCount ?? 0) < rule.usageLimit;
}

function codeMatches(rule: DiscountRule, context: DiscountContext): boolean {
  // No code on the rule → automatic discount, no shopper input required.
  if (!rule.code) return true;
  if (!context.code) return false;
  return rule.code.trim().toLowerCase() === context.code.trim().toLowerCase();
}

export function matchesTarget(
  targets: DiscountTargetRule[] | undefined,
  context: DiscountContext,
): boolean {
  if (!targets || targets.length === 0) return true;
  return targets.some((target) => {
    switch (target.targetType) {
      case 'all':
        return true;
      case 'product':
        return !!context.productId && target.targetId === context.productId;
      case 'variant':
        return !!context.variantId && target.targetId === context.variantId;
      case 'category':
        return !!context.categoryId && target.targetId === context.categoryId;
      default:
        return false;
    }
  });
}

export function isEligible(
  rule: DiscountRule,
  context: DiscountContext,
): boolean {
  if (!rule.active) return false;
  if (!withinWindow(rule, context.now)) return false;
  if (!withinUsageLimit(rule)) return false;
  if (rule.minCartAmount != null && context.subtotal < rule.minCartAmount) {
    return false;
  }
  if (
    rule.currency &&
    context.currency &&
    rule.currency !== context.currency
  ) {
    return false;
  }
  if (!codeMatches(rule, context)) return false;
  return matchesTarget(rule.targets, context);
}

/** Eligible discounts ordered by priority (desc), then id for determinism. */
export function selectApplicableDiscounts(
  context: DiscountContext,
  discounts: DiscountRule[],
): DiscountRule[] {
  return discounts
    .filter((rule) => isEligible(rule, context))
    .sort((a, b) => {
      const priority = (b.priority ?? 0) - (a.priority ?? 0);
      if (priority !== 0) return priority;
      return a.id.localeCompare(b.id);
    });
}

function amountFor(rule: DiscountRule, base: number): number {
  const raw =
    rule.type === 'percentage' ? (base * rule.value) / 100 : rule.value;
  const capped =
    rule.maxDiscountAmount != null
      ? Math.min(raw, rule.maxDiscountAmount)
      : raw;
  // Maximum discount protection — never below zero, never above the base.
  return roundMoney(Math.min(Math.max(capped, 0), base));
}

/**
 * Apply eligible discounts to a subtotal.
 *
 * The highest-priority discount always wins. If it is non-stackable it is the
 * only one applied; otherwise every further stackable discount is applied in
 * order against the running remainder.
 */
export function calculateDiscount(
  context: DiscountContext,
  discounts: DiscountRule[],
): DiscountCalculation {
  const subtotal = roundMoney(Math.max(context.subtotal, 0));
  const eligible = selectApplicableDiscounts(context, discounts);

  const appliedDiscounts: AppliedDiscountSummary[] = [];
  let running = subtotal;

  for (const rule of eligible) {
    const first = appliedDiscounts.length === 0;
    if (!first && !rule.stackable) continue;
    if (running <= 0) break;

    const amount = amountFor(rule, running);
    if (amount <= 0) continue;

    appliedDiscounts.push({
      id: rule.id,
      name: rule.name,
      code: rule.code ?? null,
      type: rule.type,
      value: rule.value,
      amount,
    });
    running = roundMoney(running - amount);

    if (!rule.stackable) break;
  }

  const discountAmount = roundMoney(subtotal - running);
  return {
    subtotal,
    discountAmount,
    finalPrice: roundMoney(subtotal - discountAmount),
    appliedDiscounts,
  };
}
