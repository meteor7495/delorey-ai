export const PAYMENT_PROVIDER_IDS = ['zarinpal', 'mock'] as const;
export type PaymentProviderId = (typeof PAYMENT_PROVIDER_IDS)[number];

export const PAYMENT_RECORD_STATUSES = [
  'pending',
  'paid',
  'failed',
  'refunded',
] as const;
export type PaymentRecordStatus = (typeof PAYMENT_RECORD_STATUSES)[number];

export const PAYMENT_TRANSACTION_KINDS = [
  'request',
  'verify',
  'callback',
  'refund',
] as const;
export type PaymentTransactionKind = (typeof PAYMENT_TRANSACTION_KINDS)[number];

export function resolvePaymentProviderId(
  merchantId?: string | null,
): PaymentProviderId {
  return merchantId?.trim() ? 'zarinpal' : 'mock';
}

export function paymentLockKey(tenantId: string, orderId: string): string {
  return `t:${tenantId}:lock:order:${orderId}`;
}

export function zarinpalEndpoints(sandbox: boolean) {
  if (sandbox) {
    return {
      request: 'https://sandbox.zarinpal.com/pg/v4/payment/request.json',
      verify: 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json',
      start: 'https://sandbox.zarinpal.com/pg/StartPay',
    };
  }
  return {
    request: 'https://api.zarinpal.com/pg/v4/payment/request.json',
    verify: 'https://api.zarinpal.com/pg/v4/payment/verify.json',
    start: 'https://www.zarinpal.com/pg/StartPay',
  };
}

export function zarinpalPayUrl(startBase: string, authority: string): string {
  return `${startBase}/${authority}`;
}

export function mockPayUrl(publicBase: string, orderId: string): string {
  return `${publicBase.replace(/\/$/, '')}/v1/payments/mock/${orderId}`;
}

export function parseZarinpalRequestBody(
  json: unknown,
): { ok: true; authority: string } | { ok: false } {
  const data = (json as { data?: { code?: number; authority?: string } })?.data;
  const authority = data?.authority?.trim();
  if (!authority || data?.code !== 100) return { ok: false };
  return { ok: true, authority };
}

export function parseZarinpalVerifyBody(
  json: unknown,
): { ok: true; alreadyVerified: boolean; refId: string } | { ok: false } {
  const data = (json as { data?: { code?: number; ref_id?: number } })?.data;
  if (data?.code !== 100 && data?.code !== 101) return { ok: false };
  return {
    ok: true,
    alreadyVerified: data.code === 101,
    refId: String(data.ref_id ?? ''),
  };
}
