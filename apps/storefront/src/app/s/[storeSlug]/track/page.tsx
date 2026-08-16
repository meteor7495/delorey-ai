'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StoreShell } from '@/components/StoreShell';
import { api } from '@/lib/api';
import { useStoreSlug, useStorefrontChrome } from '@/lib/use-storefront';
import { pageTitleClass, useStoreTheme } from '@/themes/theme-context';

type Order = {
  orderNumber: string;
  status: string;
  paymentMethod?: string;
  paymentRef?: string | null;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{ title: string; quantity: number; lineTotal: number }>;
};

const STATUS_FA: Record<string, string> = {
  pending: 'در انتظار تأیید',
  pending_payment: 'در انتظار پرداخت',
  confirmed: 'تأیید شده / پرداخت‌شده',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
  cancelled: 'لغو شده',
};

function TrackInner({ storeSlug }: { storeSlug: string }) {
  const search = useSearchParams();
  const theme = useStoreTheme();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pay = search.get('pay');
  const hint = search.get('hint');

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

  const radius = { borderRadius: 'var(--zh-radius)' };

  return (
    <div className="dk-container py-6 lg:py-10 max-w-xl">
      <h1 className={`${pageTitleClass(theme)} mb-4`}>پیگیری سفارش</h1>

      {pay === 'ok' && (
        <p className="mb-4 zh-card p-4 text-[14px] text-dk-green">
          پرداخت تأیید شد. سفارش شما ثبت شد.
        </p>
      )}
      {pay === 'fail' && (
        <p className="mb-4 zh-card p-4 text-[14px] text-zh-pink">
          پرداخت انجام نشد یا لغو شد. موجودی کالا برگردانده شد.
        </p>
      )}
      {hint && !pay && (
        <p className="mb-4 text-[13px] text-zh-600">{hint}</p>
      )}

      <form onSubmit={onSubmit} className="zh-card p-5 space-y-3">
        <input
          className="w-full h-11 border border-zh-300 px-3 text-[14px] bg-zh-surface outline-none focus:border-zh-primary"
          style={radius}
          placeholder="شماره سفارش"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          required
        />
        <input
          className="w-full h-11 border border-zh-300 px-3 text-[14px] bg-zh-surface outline-none focus:border-zh-primary"
          style={radius}
          placeholder="شماره موبایل"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <button type="submit" className="zh-btn-primary w-full">
          پیگیری
        </button>
      </form>
      {error && (
        <p className="mt-3 text-[13px] text-zh-pink font-medium">{error}</p>
      )}
      {order && (
        <div className="mt-4 zh-card p-5 space-y-2 dk-fade">
          <p className="font-bold text-zh-ink text-[16px] tnum">{order.orderNumber}</p>
          <p className="text-[13px]">
            وضعیت:{' '}
            <strong className="text-zh-primary">
              {STATUS_FA[order.status] ?? order.status}
            </strong>
          </p>
          {order.paymentMethod ? (
            <p className="text-[13px] text-zh-600">
              پرداخت:{' '}
              {order.paymentMethod === 'online' ? 'آنلاین' : 'در محل'}
              {order.paymentRef ? ` · رسید ${order.paymentRef}` : ''}
            </p>
          ) : null}
          <p className="text-[13px] tnum">
            مبلغ: {order.totalAmount.toLocaleString('fa-IR')} تومان
          </p>
          <p className="text-[12px] text-zh-600">
            {order.customerName} · {order.customerPhone}
          </p>
          <p className="text-[12px] text-zh-600">{order.customerAddress}</p>
          <ul className="pt-3 mt-2 border-t border-zh-100 text-[13px] space-y-1">
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
  );
}

export default function TrackPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const storeSlug = useStoreSlug(params);
  const { settings, categories, error } = useStorefrontChrome(storeSlug);

  if (!settings || !storeSlug) {
    return (
      <main className="dk-container py-20 text-center text-zh-600">
        {error ?? 'در حال بارگذاری…'}
      </main>
    );
  }

  return (
    <StoreShell settings={settings} categories={categories}>
      <Suspense
        fallback={
          <main className="dk-container py-20 text-center text-zh-600">
            در حال بارگذاری…
          </main>
        }
      >
        <TrackInner storeSlug={storeSlug} />
      </Suspense>
    </StoreShell>
  );
}
