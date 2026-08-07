'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StoreShell } from '@/components/StoreShell';
import { api, formatIrr, getCartSessionId } from '@/lib/api';

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
    codEnabled?: boolean;
  } | null>(null);
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
      <main className="container py-16 text-center text-[var(--muted)]">
        {error ?? 'در حال بارگذاری…'}
      </main>
    );
  }

  return (
    <StoreShell settings={settings}>
      <section className="container pt-5 max-w-xl space-y-4">
        <h1 className="text-xl font-extrabold">تسویه حساب</h1>
        <p className="text-sm text-[var(--muted)]">
          پرداخت در محل (COD) · جمع سبد: {formatIrr(total)}
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <form onSubmit={onSubmit} className="card p-5 space-y-3">
          <div>
            <label className="text-sm font-semibold">نام</label>
            <input
              className="input mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold">موبایل</label>
            <input
              className="input mt-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="text-sm font-semibold">آدرس</label>
            <textarea
              className="input mt-1 min-h-[100px]"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold">یادداشت</label>
            <input
              className="input mt-1"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-brand w-full" disabled={busy}>
            {busy ? 'در حال ثبت…' : 'ثبت سفارش COD'}
          </button>
          <Link href={`/s/${storeSlug}/cart`} className="btn btn-ghost w-full">
            بازگشت به سبد
          </Link>
        </form>
      </section>
    </StoreShell>
  );
}
