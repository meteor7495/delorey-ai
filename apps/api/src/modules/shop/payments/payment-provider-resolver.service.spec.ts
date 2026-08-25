import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { encryptSecret } from '../../platform/crypto.util';
import { PaymentProviderResolver } from './payment-provider-resolver.service';
import type { IPaymentProvider } from './payment-provider';

const SECRET = 'test-secret-key';

function mockConfig(map: Record<string, string | undefined> = {}) {
  return {
    get: (key: string) => map[key],
  };
}

function fakeProvider(id: 'mock' | 'zarinpal'): IPaymentProvider {
  return {
    id,
    request: vi.fn(async () => ({
      authority: `${id}-AUTH`,
      payUrl: `https://example.test/${id}`,
    })),
    verify: vi.fn(async () => ({ ok: true, reference: 'ref' })),
  };
}

describe('PaymentProviderResolver', () => {
  it('resolves PLATFORM to mock when Seloma env merchant is empty', () => {
    const mock = fakeProvider('mock');
    const zarinpal = fakeProvider('zarinpal');
    const resolver = new PaymentProviderResolver(
      mockConfig({ JWT_SECRET: SECRET }) as never,
      mock as never,
      zarinpal as never,
    );

    const resolved = resolver.resolve({
      tenantId: 't1',
      paymentMode: 'platform',
      paymentProvider: 'seloma',
      zarinpalMerchantId: null,
    });

    expect(resolved.mode).toBe('platform');
    expect(resolved.gateway).toBe('seloma');
    expect(resolved.providerId).toBe('mock');
    expect(resolved.provider).toBe(mock);
    expect(resolved.merchantId).toBe('');
  });

  it('resolves PLATFORM to zarinpal with Seloma env merchant', () => {
    const mock = fakeProvider('mock');
    const zarinpal = fakeProvider('zarinpal');
    const resolver = new PaymentProviderResolver(
      mockConfig({
        JWT_SECRET: SECRET,
        SELOMA_ZARINPAL_MERCHANT_ID: 'platform-merchant',
      }) as never,
      mock as never,
      zarinpal as never,
    );

    const resolved = resolver.resolve({
      tenantId: 't1',
      paymentMode: 'platform',
      zarinpalMerchantId: encryptSecret('ignored-store-id', SECRET),
    });

    expect(resolved.mode).toBe('platform');
    expect(resolved.providerId).toBe('zarinpal');
    expect(resolved.merchantId).toBe('platform-merchant');
    expect(resolved.provider).toBe(zarinpal);
  });

  it('resolves MERCHANT with encrypted store credentials', () => {
    const mock = fakeProvider('mock');
    const zarinpal = fakeProvider('zarinpal');
    const resolver = new PaymentProviderResolver(
      mockConfig({
        JWT_SECRET: SECRET,
        SELOMA_ZARINPAL_MERCHANT_ID: 'platform-merchant',
      }) as never,
      mock as never,
      zarinpal as never,
    );
    const cipher = encryptSecret('merchant-own-id', SECRET);

    const resolved = resolver.resolve({
      tenantId: 't1',
      paymentMode: 'merchant',
      paymentProvider: 'zarinpal',
      zarinpalMerchantId: cipher,
    });

    expect(resolved.mode).toBe('merchant');
    expect(resolved.gateway).toBe('zarinpal');
    expect(resolved.providerId).toBe('zarinpal');
    expect(resolved.merchantId).toBe('merchant-own-id');
  });

  it('rejects MERCHANT without credentials', () => {
    const resolver = new PaymentProviderResolver(
      mockConfig({ JWT_SECRET: SECRET }) as never,
      fakeProvider('mock') as never,
      fakeProvider('zarinpal') as never,
    );

    expect(() =>
      resolver.resolve({
        tenantId: 't1',
        paymentMode: 'merchant',
        paymentProvider: 'zarinpal',
        zarinpalMerchantId: null,
      }),
    ).toThrow(BadRequestException);
  });

  it('supports legacy plaintext merchant ids', () => {
    const resolver = new PaymentProviderResolver(
      mockConfig({ JWT_SECRET: SECRET }) as never,
      fakeProvider('mock') as never,
      fakeProvider('zarinpal') as never,
    );

    const resolved = resolver.resolve({
      tenantId: 't1',
      paymentMode: 'merchant',
      zarinpalMerchantId: 'legacy-plain-merchant',
    });

    expect(resolved.merchantId).toBe('legacy-plain-merchant');
    expect(resolver.credentialPublicView('legacy-plain-merchant')).toEqual({
      hasMerchantCredentials: true,
      merchantCredentialHint: '************hant',
    });
  });

  it('never exposes full credentials in public view', () => {
    const resolver = new PaymentProviderResolver(
      mockConfig({ JWT_SECRET: SECRET }) as never,
      fakeProvider('mock') as never,
      fakeProvider('zarinpal') as never,
    );
    const cipher = encryptSecret('abcd-1234-wxyz', SECRET);
    const view = resolver.credentialPublicView(cipher);
    expect(view.hasMerchantCredentials).toBe(true);
    expect(view.merchantCredentialHint).toBe('************wxyz');
    expect(view.merchantCredentialHint).not.toContain('abcd');
  });
});
