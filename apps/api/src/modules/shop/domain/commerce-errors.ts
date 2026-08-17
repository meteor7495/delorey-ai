/**
 * Domain rule violations raised by the pure Commerce Core layer.
 *
 * The domain stays framework-free — application services translate these into
 * Nest HTTP exceptions so the same rules can back both the merchant API and
 * the AI Runtime without duplicating logic.
 */
export type CommerceRuleCode =
  | 'variant_limit_exceeded'
  | 'invalid_price'
  | 'invalid_quantity'
  | 'negative_inventory'
  | 'invalid_discount'
  | 'invalid_order_transition'
  | 'rejection_reason_required';

export class CommerceRuleError extends Error {
  constructor(
    readonly code: CommerceRuleCode,
    message: string,
  ) {
    super(message);
    this.name = 'CommerceRuleError';
  }
}
