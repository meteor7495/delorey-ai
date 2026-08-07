'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PLANS, submitAccessRequest } from '@/lib/api';

function RequestForm() {
  const search = useSearchParams();
  const router = useRouter();
  const [plan, setPlan] = useState('professional');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const p = search.get('plan');
    if (p && PLANS.some((x) => x.id === p)) setPlan(p);
  }, [search]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await submitAccessRequest({
        fullName,
        email,
        phone,
        shopName,
        plan,
        password,
      });
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('delorey_pending_token', res.token);
      }
      router.push(`/pay?requestId=${encodeURIComponent(res.requestId)}&plan=${plan}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ثبت نشد');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#f4f8f9]">
      <div
        className="border-b border-ink/8 bg-ink text-white"
        style={{
          background:
            'linear-gradient(160deg, #071018, #0f6e6e 140%)',
        }}
      >
        <div className="container py-10">
          <Link href="/" className="text-sm font-bold text-white/70 hover:text-white">
            ← بازگشت
          </Link>
          <h1 className="mt-4 text-3xl font-black">ثبت درخواست دسترسی</h1>
          <p className="mt-2 text-white/65 max-w-xl leading-7">
            حساب Workspace به‌صورت خودکار ساخته می‌شود؛ سپس پرداخت (یا فعال‌سازی
            آزمایشی) و ورود.
          </p>
        </div>
      </div>

      <div className="container py-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <form
          onSubmit={onSubmit}
          className="rounded-3xl border border-ink/8 bg-white p-6 sm:p-8 space-y-4 shadow-sm"
        >
          <div>
            <label className="text-sm font-bold">پلن</label>
            <select
              className="input mt-1"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            >
              {PLANS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold">نام و نام خانوادگی</label>
            <input
              className="input mt-1"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold">ایمیل</label>
            <input
              type="email"
              className="input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold">موبایل</label>
            <input
              className="input mt-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="text-sm font-bold">نام فروشگاه / فضای کاری</label>
            <input
              className="input mt-1"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold">رمز عبور ورود</label>
            <input
              type="password"
              className="input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
          )}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'در حال ساخت حساب…' : 'ادامه به پرداخت'}
          </button>
        </form>

        <aside className="rounded-3xl border border-ink/8 bg-white p-6 h-fit">
          <h2 className="font-extrabold text-lg">مراحل</h2>
          <ol className="mt-4 space-y-3 text-sm text-ink/65 leading-7 list-decimal list-inside">
            <li>ثبت درخواست و ساخت خودکار حساب</li>
            <li>پرداخت اشتراک (فعلاً فعال‌سازی آزمایشی)</li>
            <li>ورود به Workspace و راه‌اندازی فروشگاه / AI</li>
          </ol>
        </aside>
      </div>
    </main>
  );
}

export default function RequestPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] grid place-items-center text-ink/50">
          در حال بارگذاری…
        </main>
      }
    >
      <RequestForm />
    </Suspense>
  );
}
