export const PAYMENT_PROVIDER_IDS = ['zarinpal', 'mock'] as const;
export type PaymentProviderId = (typeof PAYMENT_PROVIDER_IDS)[number];

/** Who owns the gateway credentials used at checkout. */
export const PAYMENT_MODES = ['platform', 'merchant'] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

/**
 * Configured gateway label on the store.
 * `seloma` = platform gateway (resolved to mock|zarinpal via env).
 * `zarinpal` = merchant's own ZarinPal account.
 */
export const PAYMENT_GATEWAY_IDS = ['seloma', 'zarinpal'] as const;
export type PaymentGatewayId = (typeof PAYMENT_GATEWAY_IDS)[number];

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

export function isPaymentMode(value: unknown): value is PaymentMode {
  return (
    typeof value === 'string' &&
    (PAYMENT_MODES as readonly string[]).includes(value)
  );
}

export function isPaymentGatewayId(value: unknown): value is PaymentGatewayId {
  return (
    typeof value === 'string' &&
    (PAYMENT_GATEWAY_IDS as readonly string[]).includes(value)
  );
}

export function normalizePaymentMode(
  value: string | null | undefined,
  hasMerchantCredentials: boolean,
): PaymentMode {
  if (isPaymentMode(value)) return value;
  // Legacy rows: a stored merchant id meant merchant-owned gateway.
  return hasMerchantCredentials ? 'merchant' : 'platform';
}

export function normalizePaymentGateway(
  mode: PaymentMode,
  value: string | null | undefined,
): PaymentGatewayId {
  if (mode === 'platform') return 'seloma';
  if (isPaymentGatewayId(value) && value !== 'seloma') return value;
  return 'zarinpal';
}

/** Safe UI hint — never the full secret. */
export function maskCredentialHint(plain: string | null | undefined): string | null {
  const trimmed = plain?.trim();
  if (!trimmed) return null;
  if (trimmed.length <= 4) return '************';
  return `************${trimmed.slice(-4)}`;
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
