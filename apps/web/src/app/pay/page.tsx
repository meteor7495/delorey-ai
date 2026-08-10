'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DEFAULT_PLAN_ID,
  WORKSPACE_URL,
  confirmPayment,
  findPlan,
  getAccessRequest,
} from '@/lib/api';

function PayInner() {
  const search = useSearchParams();
  const requestId = search.get('requestId') ?? '';
  const [planId, setPlanId] = useState(search.get('plan') ?? DEFAULT_PLAN_ID);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const plan = findPlan(planId);

  useEffect(() => {
    if (!requestId) return;
    getAccessRequest(requestId)
      .then((r) => {
        setPlanId(r.plan);
        setEmail(r.email);
        if (r.status === 'paid' || r.billingStatus === 'active') setDone(true);
      })
      .catch((e) => setError(String(e)));
  }, [requestId]);

  async function onPay() {
    if (!requestId) return;
    setLoading(true);
    setError(null);
    try {
      await confirmPayment(requestId);
      setDone(true);
      const token =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('delorey_pending_token')
          : null;
      const target = token
        ? `${WORKSPACE_URL}/access?token=${encodeURIComponent(token)}`
        : `${WORKSPACE_URL}/login`;
      window.location.href = target;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'پرداخت ثبت نشد');
      setLoading(false);
    }
  }

  if (!requestId) {
    return (
      <main className="min-h-[100dvh] grid place-items-center p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">شناسه درخواست موجود نیست</p>
          <Link href="/request" className="btn btn-primary">
            بازگشت به فرم
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f4f8f9]">
      <div
        className="border-b border-ink/8 text-white"
        style={{ background: 'linear-gradient(160deg, #071018, #0f6e6e 140%)' }}
      >
        <div className="container py-10">
          <h1 className="text-3xl font-black">
            {plan.consultative ? 'هماهنگی و فعال‌سازی' : 'پرداخت و فعال‌سازی'}
          </h1>
          <p className="mt-2 text-white/65">
            حساب ساخته شد{email ? ` برای ${email}` : ''}.
            {plan.consultative
              ? ' قیمت کارمند AI بعداً هماهنگ می‌شود.'
              : ' درگاه واقعی به‌زودی؛ فعلاً فعال‌سازی آزمایشی.'}
          </p>
        </div>
      </div>

      <div className="container py-10 max-w-lg">
        <div className="rounded-3xl border border-ink/8 bg-white p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-sm text-ink/50">
                {plan.category === 'ai' ? 'بسته AI' : 'پلن سایت‌ساز'}
              </p>
              <p className="text-xl font-extrabold">{plan.name}</p>
            </div>
            <div className="text-end">
              <p className="text-2xl font-black">{plan.price}</p>
              <p className="text-xs text-ink/45">{plan.unit}</p>
            </div>
          </div>
          <p className="text-sm leading-7 text-ink/60 rounded-2xl bg-sand p-4">
            {plan.consultative
              ? 'درخواست شما ثبت شد. تیم DeloRey برای تعیین قیمت و بستهٔ مناسب با شما هماهنگ می‌کند. فعلاً می‌توانید وارد Workspace شوید و فروشگاه را آماده کنید.'
              : 'پس از اتصال درگاه (زرین‌پال / مشابه)، همین صفحه به پرداخت واقعی هدایت می‌شود. تا آن موقع با دکمهٔ زیر اشتراک سالیانه را فعال و وارد Workspace شوید.'}
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {done ? (
            <a href={`${WORKSPACE_URL}/login`} className="btn btn-primary w-full">
              ورود به Workspace
            </a>
          ) : (
            <button
              type="button"
              className="btn btn-primary w-full"
              disabled={loading}
              onClick={onPay}
            >
              {loading
                ? 'در حال فعال‌سازی…'
                : plan.consultative
                  ? 'ثبت درخواست و ورود به Workspace'
                  : 'فعال‌سازی آزمایشی و ورود'}
            </button>
          )}
          <Link href="/" className="btn btn-ghost w-full">
            بازگشت به صفحهٔ اصلی
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] grid place-items-center text-ink/50">
          در حال بارگذاری…
        </main>
      }
    >
      <PayInner />
    </Suspense>
  );
}
