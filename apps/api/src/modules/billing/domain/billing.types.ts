export const BILLING_CURRENCY = 'IRT';
export const BILLING_CURRENCY_LABEL = 'تومان';

export const WALLET_TX_TYPES = [
  'CREDIT_PURCHASE',
  'SUBSCRIPTION_CREDIT',
  'USAGE',
  'REFUND',
  'MANUAL_ADJUSTMENT',
  'AUTO_RECHARGE',
  'BONUS',
  'EXPIRATION',
  'RESERVATION',
  'RESERVATION_CAPTURE',
  'RESERVATION_RELEASE',
] as const;
export type WalletTxType = (typeof WALLET_TX_TYPES)[number];

export const BILLING_SERVICES = [
  'AI_CHAT',
  'IMAGE_GENERATION',
  'VOICE',
  'OCR',
  'CONTENT_GENERATION',
  'EMBEDDING',
  'SEARCH',
  'EXTERNAL_API',
] as const;
export type BillingServiceCode = (typeof BILLING_SERVICES)[number];

export const SERVICE_LABELS_FA: Record<BillingServiceCode, string> = {
  AI_CHAT: 'گفتگوی هوش مصنوعی',
  IMAGE_GENERATION: 'تولید تصویر',
  VOICE: 'صدا',
  OCR: 'OCR',
  CONTENT_GENERATION: 'تولید محتوا',
  EMBEDDING: 'جستجوی دانش',
  SEARCH: 'جستجو',
  EXTERNAL_API: 'سرویس خارجی',
};

export const UNIT_TYPES = [
  'input_token',
  'output_token',
  'image',
  'minute',
  'page',
  'request',
] as const;
export type PricingUnitType = (typeof UNIT_TYPES)[number];

export const RESERVATION_STATUSES = [
  'PENDING',
  'CAPTURED',
  'RELEASED',
  'EXPIRED',
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const INSUFFICIENT_CREDIT_MESSAGE =
  'اعتبار شما کافی نیست. لطفاً کیف پول را شارژ کنید.';

export const SPENDING_LIMIT_MESSAGE =
  'سقف هزینه ماهانه شما پر شده است. برای ادامه، سقف را افزایش دهید یا ماه بعد تلاش کنید.';

export const BILLING_UNAVAILABLE_MESSAGE =
  'در حال حاضر امکان بررسی اعتبار وجود ندارد. لطفاً کمی بعد دوباره تلاش کنید.';

export type PricedUsage = {
  service: BillingServiceCode;
  provider: string;
  model: string;
  inputUnits: number;
  outputUnits: number;
  providerCost: number;
  customerCharge: number;
  markup: number;
  currency: string;
};
