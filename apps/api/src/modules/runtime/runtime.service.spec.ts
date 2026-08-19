import { describe, expect, it } from 'vitest';
import { composeGroundedReply } from './runtime.service';
import type { ProductFacts } from '../shop/commerce-retrieval.service';

const product = (over: Partial<ProductFacts> = {}): ProductFacts => ({
  sku: 'CASE-220',
  title: 'کیف هدفون',
  brand: null,
  category: null,
  currency: 'IRR',
  listPrice: 310000,
  finalPrice: 310000,
  discountAmount: 0,
  appliedDiscounts: [],
  availability: 'in_stock',
  availabilityLabel: 'موجود',
  available: 4,
  shortDescription: null,
  tags: [],
  variants: [],
  ...over,
});

describe('composeGroundedReply', () => {
  it('quotes catalog facts without the mock refuse line', () => {
    const text = composeGroundedReply([product()], []);
    expect(text).toContain('کیف هدفون');
    expect(text).toContain('CASE-220');
    expect(text).toContain('۳۱۰٬۰۰۰');
    expect(text).not.toContain('الان اطلاعات مطمئنی ندارم');
  });

  it('asks for a SKU when nothing matched', () => {
    expect(composeGroundedReply([], [])).toContain('CASE-220');
  });
});
