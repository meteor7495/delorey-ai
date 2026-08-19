import { describe, expect, it } from 'vitest';
import { mockFromContext } from './mock.provider';

describe('mockFromContext', () => {
  it('quotes ProductFacts.finalPrice instead of crashing', () => {
    const system = `You are a bot.\nCONTEXT_JSON:${JSON.stringify({
      syncHealth: 'healthy',
      matches: [
        {
          sku: 'CASE-220',
          title: 'کیف هدفون',
          finalPrice: 310000,
          availability: 'in_stock',
          availabilityLabel: 'موجود',
          currency: 'IRR',
        },
      ],
    })}`;
    const text = mockFromContext(system);
    expect(text).toContain('کیف هدفون');
    expect(text).toContain('CASE-220');
    expect(text).toContain('۳۱۰٬۰۰۰');
    expect(text).not.toBe('الان اطلاعات مطمئنی ندارم.');
  });
});
