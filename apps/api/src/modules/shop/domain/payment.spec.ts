import { describe, expect, it } from 'vitest';
import {
  mockPayUrl,
  parseZarinpalRequestBody,
  parseZarinpalVerifyBody,
  paymentLockKey,
  resolvePaymentProviderId,
  zarinpalEndpoints,
  zarinpalPayUrl,
} from './payment';

describe('resolvePaymentProviderId', () => {
  it('uses mock when merchant id is missing', () => {
    expect(resolvePaymentProviderId(null)).toBe('mock');
    expect(resolvePaymentProviderId('  ')).toBe('mock');
  });

  it('uses zarinpal when a merchant id is set', () => {
    expect(resolvePaymentProviderId('abc-merchant')).toBe('zarinpal');
  });
});

describe('paymentLockKey', () => {
  it('follows the tenant-scoped Redis grammar', () => {
    expect(paymentLockKey('ten-1', 'ord-9')).toBe('t:ten-1:lock:order:ord-9');
  });
});

describe('zarinpal parsing', () => {
  it('accepts request code 100 with an authority', () => {
    expect(
      parseZarinpalRequestBody({ data: { code: 100, authority: 'A0001' } }),
    ).toEqual({ ok: true, authority: 'A0001' });
  });

  it('rejects a failed request', () => {
    expect(parseZarinpalRequestBody({ data: { code: -9 } })).toEqual({
      ok: false,
    });
  });

  it('treats verify 101 as already verified', () => {
    expect(
      parseZarinpalVerifyBody({ data: { code: 101, ref_id: 42 } }),
    ).toEqual({ ok: true, alreadyVerified: true, refId: '42' });
  });

  it('rejects a failed verify', () => {
    expect(parseZarinpalVerifyBody({ data: { code: -51 } })).toEqual({
      ok: false,
    });
  });
});

describe('pay urls', () => {
  it('builds sandbox and production endpoints', () => {
    expect(zarinpalEndpoints(true).start).toContain('sandbox.zarinpal.com');
    expect(zarinpalEndpoints(false).verify).toContain('api.zarinpal.com');
    expect(zarinpalPayUrl('https://www.zarinpal.com/pg/StartPay', 'A1')).toBe(
      'https://www.zarinpal.com/pg/StartPay/A1',
    );
  });

  it('builds the local mock pay page', () => {
    expect(mockPayUrl('http://localhost:3001/', 'ord-1')).toBe(
      'http://localhost:3001/v1/payments/mock/ord-1',
    );
  });
});
