import { describe, expect, it, vi, afterEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { ZarinpalPaymentProvider } from './zarinpal.payment-provider';

describe('ZarinpalPaymentProvider', () => {
  const provider = new ZarinpalPaymentProvider({
    get: (key: string) => (key === 'ZARINPAL_SANDBOX' ? '1' : undefined),
  } as unknown as ConfigService);

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a sandbox pay URL on request code 100', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        json: async () => ({ data: { code: 100, authority: 'A0001' } }),
      })),
    );
    const result = await provider.request({
      orderId: 'ord-1',
      amount: 1500.4,
      description: 'سفارش',
      merchantId: 'mid',
      callbackUrl: 'http://localhost/v1/payments/zarinpal/callback',
    });
    expect(result.authority).toBe('A0001');
    expect(result.payUrl).toBe('https://sandbox.zarinpal.com/pg/StartPay/A0001');
    expect(fetch).toHaveBeenCalledWith(
      'https://sandbox.zarinpal.com/pg/v4/payment/request.json',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws when the gateway rejects the request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        json: async () => ({ data: { code: -9 } }),
      })),
    );
    await expect(
      provider.request({
        orderId: 'ord-1',
        amount: 1,
        description: 'x',
        merchantId: 'mid',
        callbackUrl: 'http://cb',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps verify code 101 to alreadyVerified', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        json: async () => ({ data: { code: 101, ref_id: 99 } }),
      })),
    );
    const result = await provider.verify({
      authority: 'A0001',
      amount: 100,
      merchantId: 'mid',
    });
    expect(result).toMatchObject({
      ok: true,
      alreadyVerified: true,
      reference: '99',
    });
  });
});
