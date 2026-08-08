'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StoreShell } from '@/components/StoreShell';
import { api, getCartSessionId } from '@/lib/api';

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const router = useRouter();
  const [storeSlug, setStoreSlug] = useState('');
  const [settings, setSettings] = useState<{
    storeName: string;
    storeSlug: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string | null;
    supportPhone?: string | null;
  } | null>(null);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const [total, setTotal] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    params.then(async ({ storeSlug: slug }) => {
      setStoreSlug(slug);
      try {
        const sessionId = getCartSessionId(slug);
        const [home, cart] = await Promise.all([
          api.storefrontHome(slug),
          api.storefrontGetCart(slug, sessionId),
        ]);
        setSettings(home.settings as NonNullable<typeof settings>);
        setCategories(
          (home.categories as Array<{ id: string; name: string; slug: string }>) ??
            [],
        );
        setTotal(Number((cart as { total?: number }).total ?? 0));
      } catch (e) {
        setError(String(e));
      }
    });
  }, [params]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const order = (await api.storefrontCheckout(storeSlug, {
        sessionId: getCartSessionId(storeSlug),
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        customerNote: note || undefined,
      })) as { orderNumber: string };
      router.push(
        `/s/${storeSlug}/track?orderNumber=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(phone)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ثبت سفارش نشد');
      setBusy(false);
    }
  }

  if (!settings) {
    return (
      <main className="dk-container py-20 text-center text-zh-600">
        {error ?? 'در حال بارگذاری…'}
      </main>
    );
  }

  return (
    <StoreShell settings={settings} categories={categories}>
      <div className="dk-container py-6 lg:py-8 max-w-2xl">
        <h1 className="text-[20px] text-zh-900 mb-1">اطلاعات ارسال</h1>
        <p className="text-[14px] text-zh-600 mb-4">
          پرداخت در محل (COD) · مبلغ قابل پرداخت:{' '}
          <strong className="text-zh-900 tnum">
            {total.toLocaleString('fa-IR')} تومان
          </strong>
        </p>
        {error && <p className="text-zh-pink text-[14px] mb-3">{error}</p>}

        <form onSubmit={onSubmit} className="zh-card p-6 space-y-4">
          {[
            {
              label: 'نام گیرنده',
              value: name,
              set: setName,
              required: true,
            },
            {
              label: 'شماره موبایل',
              value: phone,
              set: setPhone,
              required: true,
            },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-[14px] text-zh-900">{f.label}</label>
              <input
                className="mt-1 w-full h-11 rounded-dk border border-zh-300 px-3 text-[14px] outline-none focus:border-zh-primary"
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                required={f.required}
                minLength={f.label.includes('موبایل') ? 8 : undefined}
              />
            </div>
          ))}
          <div>
            <label className="text-[14px] text-zh-900">آدرس</label>
            <textarea
              className="mt-1 w-full min-h-[110px] rounded-dk border border-zh-300 px-3 py-2 text-[14px] outline-none focus:border-zh-primary"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-[14px] text-zh-900">توضیحات (اختیاری)</label>
            <input
              className="mt-1 w-full h-11 rounded-dk border border-zh-300 px-3 text-[14px] outline-none focus:border-zh-primary"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <button type="submit" disabled={busy} className="zh-btn-primary w-full">
            {busy ? 'در حال ثبت…' : 'ثبت سفارش و پرداخت در محل'}
          </button>
          <Link
            href={`/s/${storeSlug}/cart`}
            className="flex h-10 items-center justify-center rounded-dk border border-zh-200 text-[14px]"
          >
            بازگشت به سبد
          </Link>
        </form>
      </div>
    </StoreShell>
  );
}
