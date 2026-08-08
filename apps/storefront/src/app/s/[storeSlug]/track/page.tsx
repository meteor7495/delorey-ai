'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StoreShell } from '@/components/StoreShell';
import { api } from '@/lib/api';

type Order = {
  orderNumber: string;
  status: string;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{ title: string; quantity: number; lineTotal: number }>;
};

const STATUS_FA: Record<string, string> = {
  pending: 'در انتظار تأیید',
  confirmed: 'تأیید شده',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
  cancelled: 'لغو شده',
};

function TrackInner({
  storeSlug,
  settings,
  categories,
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
  categories: Array<{ id: string; name: string; slug: string }>;
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
    <StoreShell settings={settings} categories={categories}>
      <div className="dk-container py-4 lg:py-6 max-w-xl">
        <h1 className="text-[18px] font-black text-dk-navy mb-4">
          پیگیری سفارش
        </h1>
        <form
          onSubmit={onSubmit}
          className="rounded-dk-xl bg-white border border-dk-line p-5 space-y-3"
        >
          <input
            className="w-full h-11 rounded-dk border border-dk-line px-3 text-[13px] outline-none focus:border-dk-red"
            placeholder="شماره سفارش"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
          />
          <input
            className="w-full h-11 rounded-dk border border-dk-line px-3 text-[13px] outline-none focus:border-dk-red"
            placeholder="شماره موبایل"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full h-11 rounded-dk bg-dk-red text-white text-[13px] font-extrabold hover:bg-dk-deep"
          >
            پیگیری
          </button>
        </form>
        {error && (
          <p className="mt-3 text-[12px] text-dk-red font-bold">{error}</p>
        )}
        {order && (
          <div className="mt-4 rounded-dk-xl bg-white border border-dk-line p-5 space-y-2 dk-fade">
            <p className="font-black text-dk-navy text-[16px] tnum">
              {order.orderNumber}
            </p>
            <p className="text-[12px]">
              وضعیت:{' '}
              <strong className="text-dk-red">
                {STATUS_FA[order.status] ?? order.status}
              </strong>
            </p>
            <p className="text-[12px] tnum">
              مبلغ: {order.totalAmount.toLocaleString('fa-IR')} تومان
            </p>
            <p className="text-[11px] text-dk-muted">
              {order.customerName} · {order.customerPhone}
            </p>
            <p className="text-[11px] text-dk-muted">{order.customerAddress}</p>
            <ul className="pt-3 mt-2 border-t border-dk-line text-[12px] space-y-1">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex justify-between gap-2">
                  <span>
                    {i.title} × {i.quantity}
                  </span>
                  <span className="tnum font-bold">
                    {i.lineTotal.toLocaleString('fa-IR')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
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
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(async ({ storeSlug: slug }) => {
      setStoreSlug(slug);
      try {
        const home = await api.storefrontHome(slug);
        setSettings(home.settings as NonNullable<typeof settings>);
        setCategories(
          (home.categories as Array<{ id: string; name: string; slug: string }>) ??
            [],
        );
      } catch (e) {
        setError(String(e));
      }
    });
  }, [params]);

  if (!settings || !storeSlug) {
    return (
      <main className="dk-container py-20 text-center text-dk-muted">
        {error ?? 'در حال بارگذاری…'}
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="dk-container py-20 text-center text-dk-muted">
          در حال بارگذاری…
        </main>
      }
    >
      <TrackInner
        storeSlug={storeSlug}
        settings={settings}
        categories={categories}
      />
    </Suspense>
  );
}
