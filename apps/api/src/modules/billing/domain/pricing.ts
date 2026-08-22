import type { BillingServiceCode } from './billing.types';

export type PricingRuleMatch = {
  unitType: string;
  unitPrice: number;
  markup: number;
  provider: string;
  model: string;
};

export type PricingQuote = {
  providerCost: number;
  customerCharge: number;
  markup: number;
  inputCost: number;
  outputCost: number;
};

/**
 * customer_charge = ceil(provider_cost * markup)
 * Formula is documented on billing_settings.charge_formula; this is the engine.
 */
export function computeCustomerCharge(
  providerCost: number,
  markup: number,
): number {
  if (providerCost <= 0) return 0;
  const m = markup > 0 ? markup : 1;
  return Math.ceil(providerCost * m);
}

export function computeProviderCost(
  inputUnits: number,
  outputUnits: number,
  inputPrice: number,
  outputPrice: number,
): { inputCost: number; outputCost: number; providerCost: number } {
  const inputCost = Math.max(0, inputUnits) * Math.max(0, inputPrice);
  const outputCost = Math.max(0, outputUnits) * Math.max(0, outputPrice);
  return {
    inputCost,
    outputCost,
    providerCost: inputCost + outputCost,
  };
}

export function quoteUsage(args: {
  inputUnits: number;
  outputUnits: number;
  inputRule: PricingRuleMatch | null;
  outputRule: PricingRuleMatch | null;
  requestRule?: PricingRuleMatch | null;
}): PricingQuote {
  const inputPrice = args.inputRule?.unitPrice ?? 0;
  const outputPrice = args.outputRule?.unitPrice ?? 0;
  const { inputCost, outputCost, providerCost: tokenCost } = computeProviderCost(
    args.inputUnits,
    args.outputUnits,
    inputPrice,
    outputPrice,
  );
  const requestCost = args.requestRule
    ? args.requestRule.unitPrice
    : 0;
  const providerCost = tokenCost + requestCost;
  const markup =
    args.outputRule?.markup ??
    args.inputRule?.markup ??
    args.requestRule?.markup ??
    1;
  return {
    providerCost,
    customerCharge: computeCustomerCharge(providerCost, markup),
    markup,
    inputCost,
    outputCost,
  };
}

export function estimateChatReservation(args: {
  estimatedInputUnits: number;
  maxOutputUnits: number;
  inputRule: PricingRuleMatch | null;
  outputRule: PricingRuleMatch | null;
}): number {
  const q = quoteUsage({
    inputUnits: args.estimatedInputUnits,
    outputUnits: args.maxOutputUnits,
    inputRule: args.inputRule,
    outputRule: args.outputRule,
  });
  return Math.max(1, q.customerCharge);
}

export function captureSplit(
  reserved: number,
  actualCharge: number,
): { charge: number; release: number; extra: number } {
  const r = Math.max(0, Math.trunc(reserved));
  const a = Math.max(0, Math.trunc(actualCharge));
  if (a <= r) {
    return { charge: a, release: r - a, extra: 0 };
  }
  return { charge: r, release: 0, extra: a - r };
}

export function specificityScore(provider: string, model: string): number {
  let s = 0;
  if (provider !== '*') s += 2;
  if (model !== '*') s += 1;
  return s;
}

export function pickBestRule<T extends { provider: string; model: string }>(
  rules: T[],
): T | null {
  if (!rules.length) return null;
  return [...rules].sort(
    (a, b) => specificityScore(b.provider, b.model) - specificityScore(a.provider, a.model),
  )[0]!;
}

export function mapTaskClassToService(taskClass: string): BillingServiceCode {
  if (taskClass.startsWith('embed.')) return 'EMBEDDING';
  if (taskClass.startsWith('vision.')) return 'IMAGE_GENERATION';
  if (taskClass.includes('content')) return 'CONTENT_GENERATION';
  return 'AI_CHAT';
}

export function estimateInputTokens(system: string, user: string): number {
  const chars = (system?.length ?? 0) + (user?.length ?? 0);
  return Math.max(1, Math.ceil(chars / 3));
}

export function shouldTriggerAutoRecharge(args: {
  enabled: boolean;
  pausedReason: string | null;
  available: number;
  threshold: number;
  cooldownUntil: Date | null;
  now?: Date;
}): boolean {
  if (!args.enabled) return false;
  if (args.pausedReason) return false;
  if (args.available > args.threshold) return false;
  const now = args.now ?? new Date();
  if (args.cooldownUntil && args.cooldownUntil > now) return false;
  return true;
}

export function monthlyCapExceeded(
  spentOrRecharged: number,
  additional: number,
  monthlyLimit: number | null | undefined,
): boolean {
  if (monthlyLimit == null || monthlyLimit <= 0) return false;
  return spentOrRecharged + additional > monthlyLimit;
}
