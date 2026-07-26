export const tokens = {
  color: {
    bg: '#f4f6f8',
    surface: '#ffffff',
    text: '#14212b',
    muted: '#5b6b76',
    accent: '#0f6e6e',
    success: '#1f7a4c',
    warning: '#b54708',
    danger: '#b42318',
    info: '#175cd3',
    border: '#d7dee5',
  },
  font: {
    sans: '"Vazirmatn", "Segoe UI", Tahoma, sans-serif',
  },
  radius: {
    sm: '6px',
    md: '10px',
  },
} as const;

export type AiState =
  | 'inactive'
  | 'active'
  | 'paused'
  | 'syncing'
  | 'degraded'
  | 'awaiting_human';

export const aiLabels: Record<AiState, string> = {
  inactive: 'غیرفعال',
  active: 'فعال',
  paused: 'متوقف',
  syncing: 'در حال همگام‌سازی',
  degraded: 'مختل',
  awaiting_human: 'در انتظار انسان',
};

export const aiColors: Record<AiState, string> = {
  inactive: tokens.color.muted,
  active: tokens.color.success,
  paused: '#b54708',
  syncing: tokens.color.info,
  degraded: tokens.color.danger,
  awaiting_human: tokens.color.danger,
};

export function aiStateLabel(state: string): string {
  return aiLabels[state as AiState] ?? state;
}

/** Canonical merchant FA labels — Copy & Tone / UX Foundation */
export const escalationLabels: Record<string, string> = {
  customer_request: 'درخواست مشتری برای انسان',
  blocked_topic: 'موضوع محدودشده',
  low_confidence: 'اطمینان پایین',
  discount_cap: 'بیش از سقف تخفیف',
  sync_unhealthy: 'ریسک داده همگام‌سازی',
  skill_escalate: 'ارجاع توسط مهارت',
  operator_manual: 'ارجاع دستی اپراتور',
};

export const channelLabels: Record<string, string> = {
  website: 'وبسایت',
  telegram: 'تلگرام',
  bale: 'بله',
};

export const messageRoleLabels: Record<string, string> = {
  shopper: 'مشتری',
  assistant: 'کارمند فروش',
  ai: 'کارمند فروش',
  employee: 'کارمند فروش',
  operator: 'اپراتور',
  system: 'سیستم',
};

export const ownershipLabels: Record<string, string> = {
  ai_owned: 'پاسخ‌گوی AI',
  human_owned: 'در اختیار اپراتور',
};

export function escalationLabel(code: string | null | undefined): string {
  if (!code) return '';
  return escalationLabels[code] ?? code;
}

export function channelLabel(channel: string): string {
  return channelLabels[channel] ?? channel;
}

export function messageRoleLabel(role: string): string {
  return messageRoleLabels[role] ?? role;
}

export function ownershipLabel(ownership: string): string {
  return ownershipLabels[ownership] ?? ownership;
}

export const syncHealthLabels: Record<string, string> = {
  healthy: 'سالم',
  stale: 'عقب‌افتاده',
  failed: 'ناموفق',
  never: 'هرگز',
};

export const orderStatusLabels: Record<string, string> = {
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال‌شده',
  delivered: 'تحویل‌شده',
  cancelled: 'لغو‌شده',
  refunded: 'مسترد‌شده',
  pending: 'در انتظار',
};

export const platformLabels: Record<string, string> = {
  mock: 'دمو',
  shopify: 'شاپیفای',
  woocommerce: 'ووکامرس',
};

export const channelStatusLabels: Record<string, string> = {
  connected: 'متصل',
  disconnected: 'قطع',
  degraded: 'مختل',
};

export function syncHealthLabel(health: string): string {
  return syncHealthLabels[health] ?? health;
}

export function orderStatusLabel(status: string): string {
  return orderStatusLabels[status] ?? status;
}

export function platformLabel(platform: string): string {
  return platformLabels[platform] ?? platform;
}

export function channelStatusLabel(status: string): string {
  return channelStatusLabels[status] ?? status;
}

/** Runtime / audit decision codes → merchant FA */
export const decisionLabels: Record<string, string> = {
  answer_grounded: 'پاسخ از کاتالوگ',
  answer_knowledge: 'پاسخ از دانش',
  answer_empty_catalog: 'کاتالوگ خالی / بدون تطبیق',
  recommend: 'پیشنهاد محصول',
  recommend_empty: 'پیشنهاد بدون نتیجه',
  recommend_skill_disabled: 'مهارت پیشنهاد غیرفعال',
  order_lookup: 'پیگیری سفارش',
  order_lookup_need_id: 'پیگیری — نیاز به شماره سفارش',
  order_lookup_need_verify: 'پیگیری — نیاز به تأیید هویت',
  order_lookup_not_found: 'پیگیری — سفارش یافت نشد',
  order_lookup_skill_disabled: 'مهارت پیگیری سفارش غیرفعال',
  paused_human_owned: 'متوقف — در اختیار اپراتور',
  refuse_paused: 'رد پاسخ — کارمند متوقف',
  released_to_ai: 'بازگشت به کارمند فروش',
  'escalated:*': 'ارجاع به انسان (همه)',
  'guardrail_block:*': 'مسدود توسط محدودیت (همه)',
  'guardrail_block:refund': 'مسدود — درخواست استرداد',
  'guardrail_block:cancel': 'مسدود — درخواست لغو',
  'guardrail_block:discount_cap': 'مسدود — سقف تخفیف',
  'guardrail_block:discount_cap_reply': 'مسدود — سقف تخفیف در پاسخ',
  'guardrail_block:topic': 'مسدود — موضوع ممنوع',
};

export const adminActionLabels: Record<string, string> = {
  'employee.update': 'به‌روزرسانی کارمند',
  'employee.guardrails': 'به‌روزرسانی محدودیت‌ها',
  'employee.*': 'کارمند (همه)',
  'knowledge.create': 'ایجاد دانش',
  'knowledge.update': 'ویرایش دانش',
  'knowledge.delete': 'حذف دانش',
  'knowledge.reindex': 'بازشاخص دانش',
  'knowledge.*': 'دانش (همه)',
  'store.mock_connect': 'اتصال دموی فروشگاه',
  'store.*': 'فروشگاه (همه)',
  'channel.telegram.connect': 'اتصال تلگرام',
  'channel.bale.connect': 'اتصال بله',
  'channel.*': 'کانال (همه)',
};

export const skillLabels: Record<string, string> = {
  recommend: 'پیشنهاد محصول',
  order_lookup: 'پیگیری سفارش',
};

export function decisionLabel(decision: string): string {
  if (!decision) return '';
  if (decisionLabels[decision]) return decisionLabels[decision];
  if (decision.startsWith('escalated:')) {
    const reason = decision.slice('escalated:'.length);
    const reasonFa = escalationLabels[reason];
    return reasonFa ? `ارجاع: ${reasonFa}` : `ارجاع: ${reason}`;
  }
  if (decision.startsWith('guardrail_block:')) {
    return decisionLabels[decision] ?? `مسدود توسط محدودیت: ${decision.slice('guardrail_block:'.length)}`;
  }
  return decision;
}

export function adminActionLabel(action: string): string {
  if (!action) return '';
  return adminActionLabels[action] ?? action;
}

export function skillLabel(skill: string): string {
  return skillLabels[skill] ?? skill;
}

export const knowledgeDocTypeLabels: Record<string, string> = {
  faq: 'پرسش متداول',
  policy_override: 'سیاست / بازنویسی',
  upload: 'بارگذاری',
};

export const knowledgeStatusLabels: Record<string, string> = {
  active: 'فعال',
  indexing: 'در حال ایندکس',
  failed: 'ناموفق',
};

export function knowledgeDocTypeLabel(type: string): string {
  return knowledgeDocTypeLabels[type] ?? type;
}

export function knowledgeStatusLabel(status: string): string {
  return knowledgeStatusLabels[status] ?? status;
}
