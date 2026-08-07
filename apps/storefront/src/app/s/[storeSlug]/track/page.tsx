'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StoreShell } from '@/components/StoreShell';
import { api, formatIrr } from '@/lib/api';

type Order = {
  orderNumber: string;
  status: string;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{ title: string; quantity: number; lineTotal: number }>;
};

function TrackInner({
  storeSlug,
  settings,
}: {
  storeSlug: string;
  settings: {
    storeName: string;
    storeSlug: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string | null;
    supportPhone?: string | null;
  };
}) {
  const search = useSearchParams();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const on = search.get('orderNumber');
    const ph = search.get('phone');
    if (on) setOrderNumber(on);
    if (ph) setPhone(ph);
    if (on && ph) {
      api
        .storefrontTrackOrder(storeSlug, on, ph)
        .then((o) => setOrder(o as unknown as Order))
        .catch((e) => setError(String(e)));
    }
  }, [search, storeSlug]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const o = await api.storefrontTrackOrder(storeSlug, orderNumber, phone);
      setOrder(o as unknown as Order);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : 'پیدا نشد');
    }
  }

  return (
    <StoreShell settings={settings}>
      <section className="container pt-5 max-w-xl space-y-4">
        <h1 className="text-xl font-extrabold">پیگیری سفارش</h1>
        <form onSubmit={onSubmit} className="card p-5 space-y-3">
          <input
            className="input"
            placeholder="شماره سفارش"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="موبایل"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-brand w-full">
            پیگیری
          </button>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {order && (
          <div className="card p-5 space-y-2 fade-up">
            <p className="font-extrabold text-lg">{order.orderNumber}</p>
            <p>
              وضعیت: <strong>{order.status}</strong>
            </p>
            <p>مبلغ: {formatIrr(order.totalAmount)}</p>
            <p className="text-sm text-[var(--muted)]">
              {order.customerName} · {order.customerPhone}
            </p>
            <p className="text-sm text-[var(--muted)]">{order.customerAddress}</p>
            <ul className="text-sm pt-2 border-t border-[var(--line)]">
              {order.items.map((i, idx) => (
                <li key={idx}>
                  {i.title} × {i.quantity} — {formatIrr(i.lineTotal)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </StoreShell>
  );
}

export default function TrackPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const [storeSlug, setStoreSlug] = useState('');
  const [settings, setSettings] = useState<{
    storeName: string;
    storeSlug: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string | null;
    supportPhone?: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(async ({ storeSlug: slug }) => {
      setStoreSlug(slug);
      try {
        const home = await api.storefrontHome(slug);
        setSettings(home.settings as NonNullable<typeof settings>);
      } catch (e) {
        setError(String(e));
      }
    });
  }, [params]);

  if (!settings || !storeSlug) {
    return (
      <main className="container py-16 text-center text-[var(--muted)]">
        {error ?? 'در حال بارگذاری…'}
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="container py-16 text-center text-[var(--muted)]">
          در حال بارگذاری…
        </main>
      }
    >
      <TrackInner storeSlug={storeSlug} settings={settings} />
    </Suspense>
  );
}
