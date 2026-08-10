const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export async function submitAccessRequest(body: {
  fullName: string;
  email: string;
  phone: string;
  shopName: string;
  plan: string;
  password: string;
}) {
  const res = await fetch(`${API_BASE}/v1/public/access-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `خطا ${res.status}`);
  return JSON.parse(text) as {
    requestId: string;
    plan: string;
    token: string;
    workspaceAccessUrl: string;
    paymentHint: string;
  };
}

export async function confirmPayment(requestId: string) {
  const res = await fetch(
    `${API_BASE}/v1/public/access-requests/${encodeURIComponent(requestId)}/confirm-payment`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
  );
  const text = await res.text();
  if (!res.ok) throw new Error(text || `خطا ${res.status}`);
  return JSON.parse(text) as {
    status: string;
    workspaceLoginUrl: string;
    plan: string;
  };
}

export async function getAccessRequest(requestId: string) {
  const res = await fetch(
    `${API_BASE}/v1/public/access-requests/${encodeURIComponent(requestId)}`,
  );
  const text = await res.text();
  if (!res.ok) throw new Error(text || `خطا ${res.status}`);
  return JSON.parse(text) as {
    id: string;
    plan: string;
    email: string;
    shopName: string;
    status: string;
    billingStatus: string | null;
  };
}

export type Plan = {
  id: string;
  name: string;
  price: string;
  unit: string;
  blurb: string;
  features: readonly string[];
  featured: boolean;
  category: 'site' | 'ai';
  /** When true, price is negotiated — no fixed checkout amount */
  consultative: boolean;
  cta: string;
};

/** سالیانه — سایت‌ساز / ویترین فروشگاهی */
export const SITE_BUILDER_PLANS: readonly Plan[] = [
  {
    id: 'site-starter',
    name: 'پایه',
    price: '۲٫۹',
    unit: 'میلیون تومان / سال',
    blurb: 'برای شروع فروش آنلاین با هزینهٔ منطقی',
    features: [
      'ویترین فروشگاهی بومی',
      'مدیریت محصول، تنوع و موجودی',
      'سبد خرید، COD و کد تخفیف',
      'پیگیری سفارش مشتری',
      'پشتیبانی ایمیلی',
    ],
    featured: false,
    category: 'site',
    consultative: false,
    cta: 'انتخاب پلن پایه',
  },
  {
    id: 'site-growth',
    name: 'فروشگاهی',
    price: '۵٫۹',
    unit: 'میلیون تومان / سال',
    blurb: 'انتخاب پیشنهادی اکثر فروشگاه‌های فعال',
    features: [
      'همه امکانات پلن پایه',
      'CMS و مدیریت محتوا',
      'کد تخفیف و دسته‌بندی',
      'پیگیری سفارش برای مشتری',
      'آماده برای پرداخت آنلاین (stub)',
    ],
    featured: true,
    category: 'site',
    consultative: false,
    cta: 'انتخاب پلن فروشگاهی',
  },
  {
    id: 'site-pro',
    name: 'پیشرفته',
    price: '۹٫۹',
    unit: 'میلیون تومان / سال',
    blurb: 'برای فروشگاه‌هایی که رشد سریع‌تری می‌خواهند',
    features: [
      'همه امکانات پلن فروشگاهی',
      'اولویت پشتیبانی',
      'آنبوردینگ اختصاصی',
      'پرداخت آنلاین (مسیر pending تا اتصال درگاه)',
      'آماده برای افزودن کارمند AI',
    ],
    featured: false,
    category: 'site',
    consultative: false,
    cta: 'انتخاب پلن پیشرفته',
  },
] as const;

/** کارمند فروش هوش مصنوعی — قیمت با هماهنگی */
export const AI_EMPLOYEE_PLANS: readonly Plan[] = [
  {
    id: 'ai-sales',
    name: 'کارمند فروش AI',
    price: 'هماهنگی',
    unit: 'قیمت بعد از گفتگو',
    blurb: 'پاسخ grounded روی کاتالوگ، وب و پیام‌رسان‌ها',
    features: [
      'پاسخ روی موجودی و قیمت واقعی',
      'کانال‌های وب، تلگرام و بله',
      'اینباکس یکپارچه و تحویل به انسان',
      'دانش، گاردریل و ممیزی',
      'انتساب فروش و آنالیتیکس',
    ],
    featured: true,
    category: 'ai',
    consultative: true,
    cta: 'درخواست هماهنگی قیمت',
  },
  {
    id: 'ai-business',
    name: 'AI بیزنس',
    price: 'هماهنگی',
    unit: 'حجم و چند اپراتور',
    blurb: 'برای فروشگاه‌های پرگفتگو و تیم‌های بزرگ‌تر',
    features: [
      'همه امکانات کارمند فروش AI',
      'سهمیه گفتگوی بالاتر',
      'چند اپراتور فضای کاری',
      'اولویت پشتیبانی و آنبوردینگ',
      'بسته متناسب با نیاز شما',
    ],
    featured: false,
    category: 'ai',
    consultative: true,
    cta: 'درخواست هماهنگی قیمت',
  },
] as const;

/** @deprecated prefer SITE_BUILDER_PLANS / AI_EMPLOYEE_PLANS — kept for lookups */
export const PLANS: readonly Plan[] = [
  ...SITE_BUILDER_PLANS,
  ...AI_EMPLOYEE_PLANS,
];

export function findPlan(id: string): Plan {
  return PLANS.find((p) => p.id === id) ?? SITE_BUILDER_PLANS[1]!;
}

export const DEFAULT_PLAN_ID = 'site-growth';

export const WORKSPACE_URL =
  process.env.NEXT_PUBLIC_WORKSPACE_URL ?? 'http://localhost:3010';
