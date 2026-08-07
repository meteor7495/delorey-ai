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

export const PLANS = [
  {
    id: 'starter',
    name: 'استارتر',
    price: '۴٫۹',
    unit: 'میلیون تومان / ماه',
    blurb: 'برای شروع روی یک کانال اصلی',
    features: [
      '۱ کانال (وب یا تلگرام یا بله)',
      'حدود ۵۰۰ گفتگوی AI در ماه',
      '۱ کارمند فروش AI',
      'فروشگاه بومی + همگام‌سازی فروشگاه',
      'پشتیبانی ایمیلی',
    ],
    featured: false,
  },
  {
    id: 'professional',
    name: 'حرفه‌ای',
    price: '۱۴٫۹',
    unit: 'میلیون تومان / ماه',
    blurb: 'انتخاب پیشنهادی فروشگاه‌های فعال',
    features: [
      'تا ۳ کانال: وب، تلگرام، بله',
      'حدود ۲۰۰۰ گفتگوی AI در ماه',
      'ویترین بومی + CMS',
      'اینباکس یکپارچه و ممیزی',
      'انتساب فروش و آنالیتیکس',
    ],
    featured: true,
  },
  {
    id: 'business',
    name: 'بیزنس',
    price: 'تماس',
    unit: 'قیمت‌گذاری اختصاصی',
    blurb: 'حجم بالا و چند اپراتور',
    features: [
      'کانال‌های بیشتر و سهمیه بالاتر',
      'چند اپراتور فضای کاری',
      'اولویت پشتیبانی و آنبوردینگ',
      'آمادهٔ دامنه اختصاصی فروشگاه',
      'مسیر Enterprise در آینده',
    ],
    featured: false,
  },
] as const;

export const WORKSPACE_URL =
  process.env.NEXT_PUBLIC_WORKSPACE_URL ?? 'http://localhost:3010';
