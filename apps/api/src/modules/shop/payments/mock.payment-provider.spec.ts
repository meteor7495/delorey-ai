import { describe, expect, it } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { MockPaymentProvider } from './mock.payment-provider';

describe('MockPaymentProvider', () => {
  const provider = new MockPaymentProvider({
    get: (key: string) =>
      key === 'PUBLIC_API_BASE_URL' ? 'http://localhost:3001' : undefined,
  } as unknown as ConfigService);

  it('issues a unique authority and mock pay URL', async () => {
    const a = await provider.request({
      orderId: 'ord-1',
      amount: 1000,
      description: 'test',
      merchantId: '',
      callbackUrl: 'http://localhost/cb',
    });
    const b = await provider.request({
      orderId: 'ord-1',
      amount: 1000,
      description: 'test',
      merchantId: '',
      callbackUrl: 'http://localhost/cb',
    });
    expect(a.authority).not.toBe(b.authority);
    expect(a.authority.startsWith('MOCK-ord-1-')).toBe(true);
    expect(a.payUrl).toBe('http://localhost:3001/v1/payments/mock/ord-1');
  });

  it('verify always succeeds with the authority as reference', async () => {
    const result = await provider.verify({
      authority: 'MOCK-x',
      amount: 1,
      merchantId: '',
    });
    expect(result).toEqual({ ok: true, reference: 'MOCK-x' });
  });
});
