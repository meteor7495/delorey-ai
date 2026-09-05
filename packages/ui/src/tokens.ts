import { seloma } from './colors';

export { seloma, chartPalette } from './colors';

export const tokens = {
  color: {
    bg: seloma.neutral[50],
    surface: seloma.neutral[0],
    text: seloma.neutral[900],
    muted: seloma.neutral[600],
    accent: seloma.primary[500],
    primary: seloma.primary[500],
    secondary: seloma.secondary[500],
    brandAccent: seloma.accent[500],
    success: seloma.semantic.success.fg,
    warning: seloma.semantic.warning.fg,
    danger: seloma.semantic.error.fg,
    info: seloma.semantic.info.fg,
    border: seloma.neutral[200],
    chart: seloma.chart,
  },
  font: {
    sans: '"Vazirmatn", "Segoe UI", Tahoma, sans-serif',
  },
  radius: {
    sm: '9px',
    md: '12px',
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
  paused: seloma.semantic.warning.fg,
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
  assistant: 'دستیار هوشمند',
  ai: 'دستیار هوشمند',
  employee: 'دستیار هوشمند',
  operator: 'همکار فروشگاه',
  system: 'سیستم',
};

export const ownershipLabels: Record<string, string> = {
  ai_owned: 'پاسخ‌گوی دستیار',
  human_owned: 'در اختیار همکار',
};

/** Employee lifecycle — map API enums to merchant FA */
export const employeeStatusLabels: Record<string, string> = {
  active: 'فعال',
  paused: 'متوقف',
  inactive: 'غیرفعال',
};

export const operatingModeLabels: Record<string, string> = {
  copilot: 'همراه (پیشنهاد می‌دهد)',
  assistant: 'دستیار (پاسخ می‌دهد)',
  autopilot: 'خودکار (بدون تأیید)',
};

export const employeeRoleLabels: Record<string, string> = {
  sales: 'فروش',
  support: 'پشتیبانی',
  marketing: 'بازاریابی',
  analyst: 'تحلیل',
  operations: 'عملیات',
  product: 'محصول',
  commerce: 'تجارت',
};

export const integrationStatusLabels: Record<string, string> = {
  connected: 'متصل',
  disconnected: 'قطع',
  pending: 'در انتظار',
  error: 'خطا',
};

export const toolOverrideStateLabels: Record<string, string> = {
  enabled: 'فعال',
  disabled: 'غیرفعال',
  default: 'پیش‌فرض',
  override: 'سفارشی',
};

export const approvalPolicyLabels: Record<string, string> = {
  default: 'پیش‌فرض',
  always: 'همیشه نیاز به تأیید',
  never: 'بدون تأیید',
};

export function employeeStatusLabel(status: string): string {
  return employeeStatusLabels[status] ?? status;
}

export function operatingModeLabel(mode: string): string {
  return operatingModeLabels[mode] ?? mode;
}

export function employeeRoleLabel(role: string): string {
  return employeeRoleLabels[role] ?? role;
}

export function integrationStatusLabel(status: string): string {
  return integrationStatusLabels[status] ?? status;
}

export function toolOverrideStateLabel(state: string | boolean): string {
  if (typeof state === 'boolean') {
    return state ? 'فعال' : 'غیرفعال';
  }
  return toolOverrideStateLabels[state] ?? state;
}

export function approvalPolicyLabel(policy: string): string {
  return approvalPolicyLabels[policy] ?? policy;
}

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
  refuse_no_entitlement: 'رد پاسخ — دستیار فعال نیست',
  released_to_ai: 'بازگشت به دستیار هوشمند',
  'escalated:*': 'ارجاع به انسان (همه)',
  'guardrail_block:*': 'مسدود توسط محدودیت (همه)',
  'guardrail_block:refund': 'مسدود — درخواست استرداد',
  'guardrail_block:cancel': 'مسدود — درخواست لغو',
  'guardrail_block:discount_cap': 'مسدود — سقف تخفیف',
  'guardrail_block:discount_cap_reply': 'مسدود — سقف تخفیف در پاسخ',
  'guardrail_block:topic': 'مسدود — موضوع ممنوع',
};

export const adminActionLabels: Record<string, string> = {
  'employee.update': 'به‌روزرسانی دستیار',
  'employee.guardrails': 'به‌روزرسانی محدودیت‌ها',
  'employee.*': 'دستیار (همه)',
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
