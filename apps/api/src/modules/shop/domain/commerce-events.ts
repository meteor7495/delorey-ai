export const ANALYTICS_EVENTS = [
  'checkout_started',
  'payment_started',
  'payment_completed',
  'payment_failed',
  'order_created',
  'order_approved',
  'order_rejected',
  'order_shipped',
  'order_delivered',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export function analyticsEventForOrderStatus(
  status: string,
): AnalyticsEventName | null {
  switch (status) {
    case 'approved':
      return 'order_approved';
    case 'rejected':
      return 'order_rejected';
    case 'shipped':
      return 'order_shipped';
    case 'delivered':
      return 'order_delivered';
    case 'payment_failed':
      return 'payment_failed';
    default:
      return null;
  }
}

export function orderStatusNotifyBody(
  orderNumber: string,
  event: AnalyticsEventName,
  extra?: string,
): string | null {
  const map: Partial<Record<AnalyticsEventName, string>> = {
    order_approved: `سفارش ${orderNumber} تأیید شد و آماده آماده‌سازی است.`,
    order_rejected: `سفارش ${orderNumber} رد شد.${extra ? ` دلیل: ${extra}` : ''}`,
    order_shipped: `سفارش ${orderNumber} ارسال شد.`,
    order_delivered: `سفارش ${orderNumber} تحویل شد.`,
    payment_failed: `پرداخت سفارش ${orderNumber} ناموفق بود. می‌توانید دوباره تلاش کنید.`,
    payment_completed: `پرداخت سفارش ${orderNumber} تأیید شد و منتظر تأیید فروشگاه است.`,
  };
  return map[event] ?? null;
}
