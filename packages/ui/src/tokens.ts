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
