/**
 * Deterministic commerce intents — evaluated before any LLM turn.
 * Checkout step machine stays in ChannelCheckoutService; this module only
 * classifies text and maps checkout steps onto conversation shopping state.
 */

export const HUMAN_REQUEST_RE =
  /(انسان|اپراتور|پشتیبان|همکار|آدم|human|agent|operator|support)/i;

export const ORDER_INTENT_RE =
  /(سفارش|وضعیت سفارش|پیگیری|کجا.*(سفارش|مرسول)|رسید|tracking|order\s*(status|number)?|where.?is.?my.?order)/i;

export const PLACE_ORDER_RE =
  /(سفارش\s*بده|ثبت\s*سفارش|میخوام بخرم|می‌خوام بخرم|بخرمش|بخرم|سبد|checkout)/i;

export const RECOMMEND_INTENT_RE =
  /(پیشنهاد|توصیه|چی بخر|هدیه|recommend|suggest|gift|کدام.*(بهتر|بخر)|چی.*مناسب)/i;

export const CATEGORY_ASK_RE =
  /(پیراهن|کیف|کفش|لینن|لنین|اسپرت).*(می‌خوام|میخوام|دارید|بده|پیدا|موجود)/i;

export const CATEGORY_ONLY_RE = /^(پیراهن|کیف|کفش)$/i;

export const REFUND_RE =
  /(استرداد|بازگشت\s*وجه|پس\s*بگیر|refund|money\s*back)/i;

export const CANCEL_ORDER_RE =
  /(لغو\s*سفارش|کنسل\s*سفارش|cancel\s*(my\s*)?order|order\s*cancel)/i;

export const ORDER_NUMBER_RE = /\b((?:DR-?\d{3,})|(?:SF-[A-Z0-9]+))\b/i;

export const CHECKOUT_YES_RE = /^(بله|آره|آری|همین|ثبت[\s‌]?شده|ok|yes)$/i;

export const CHECKOUT_NEW_ADDR_RE = /(جدید|دیگر|دیگه|عوض)/i;

export const PRODUCT_SKU_RE = /\b([A-Z]{2,10}-\d{2,6})\b/i;

/** Bale markdown and copy-paste leave stray `\` `/` around titles and SKUs. */
export function normalizeShopperText(text: string): string {
  let t = text.trim();
  if (/^\/start(?:@\w+)?$/i.test(t)) return t;
  t = t.replace(/\\([_*\[\]()])/g, '$1');
  t = t.replace(/\\+$/g, '').replace(/^\\+/g, '');
  if (/^\/(?!start(?:@\w+)?$)/i.test(t)) {
    t = t.replace(/^\//, '');
  }
  return t.trim();
}

export function extractProductSku(text: string): string | null {
  const cleaned = normalizeShopperText(text).replace(/\\/g, '');
  const match = cleaned.match(PRODUCT_SKU_RE);
  return match?.[1]?.toUpperCase() ?? null;
}

export type CommerceIntent =
  | 'human_request'
  | 'refund'
  | 'cancel_order'
  | 'place_order'
  | 'order_lookup'
  | 'recommend'
  | 'none';

export type ShoppingState =
  | 'browsing'
  | 'collecting_cart'
  | 'checking_out'
  | 'awaiting_payment';

export type CheckoutStep =
  | 'idle'
  | 'awaiting_product'
  | 'awaiting_address_confirm'
  | 'awaiting_new_address'
  | 'awaiting_name'
  | 'awaiting_phone'
  | 'awaiting_address'
  | 'awaiting_payment';

export function isPlaceOrderIntent(text: string): boolean {
  return PLACE_ORDER_RE.test(text);
}

export function isOrderLookupIntent(text: string): boolean {
  return ORDER_INTENT_RE.test(text) || ORDER_NUMBER_RE.test(text);
}

export function isRecommendIntent(text: string): boolean {
  return (
    RECOMMEND_INTENT_RE.test(text) ||
    CATEGORY_ASK_RE.test(text) ||
    CATEGORY_ONLY_RE.test(text.trim())
  );
}

export function isHumanRequest(text: string): boolean {
  return HUMAN_REQUEST_RE.test(text);
}

export function isRefundIntent(text: string): boolean {
  return REFUND_RE.test(text);
}

export function isCancelOrderIntent(text: string): boolean {
  return CANCEL_ORDER_RE.test(text);
}

export function extractOrderNumber(text: string): string | null {
  const m = text.match(ORDER_NUMBER_RE);
  return m?.[1] ?? null;
}

export function classifyCommerceIntent(text: string): CommerceIntent {
  if (isHumanRequest(text)) return 'human_request';
  if (isRefundIntent(text)) return 'refund';
  if (isCancelOrderIntent(text)) return 'cancel_order';
  if (isPlaceOrderIntent(text)) return 'place_order';
  if (isOrderLookupIntent(text)) return 'order_lookup';
  if (isRecommendIntent(text)) return 'recommend';
  return 'none';
}

export function shoppingStateFromCheckoutStep(step: string): ShoppingState {
  switch (step) {
    case 'awaiting_product':
      return 'collecting_cart';
    case 'awaiting_payment':
      return 'awaiting_payment';
    case 'awaiting_address_confirm':
    case 'awaiting_new_address':
    case 'awaiting_name':
    case 'awaiting_phone':
    case 'awaiting_address':
      return 'checking_out';
    default:
      return 'browsing';
  }
}
