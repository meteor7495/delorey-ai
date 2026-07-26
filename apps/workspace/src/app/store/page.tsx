'use client';

import { useEffect, useState } from 'react';
import {
  orderStatusLabel,
  platformLabel,
  syncHealthLabel,
} from '@delorey/ui';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';

export default function StorePage() {
  const [store, setStore] = useState<Record<string, unknown> | null>(null);
  const [products, setProducts] = useState<unknown[]>([]);
  const [orders, setOrders] = useState<
    Array<{
      orderNumber: string;
      status: string;
      trackingCode: string | null;
      verifyHintPhoneLast4: string;
    }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [s, p, o] = await Promise.all([
        api.getStore(),
        api.getProducts(),
        api.getOrders(),
      ]);
      setStore(s);
      setProducts(p);
      setOrders(o);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell>
      <h1>فروشگاه</h1>
      <p className="muted">اتصال و سلامت همگام‌سازی (کاتالوگ و سفارش دمو)</p>
      {store?.syncHealth !== 'healthy' && (
        <div className="banner">
          همگام‌سازی ناسالم — قیمت/موجودی/سفارش قابل اتکا نیست.
        </div>
      )}
      <div className="card">
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        {store && (
          <>
            <p>
              پلتفرم: {platformLabel(String(store.platform))} · وضعیت:{' '}
              <strong>{syncHealthLabel(String(store.syncHealth))}</strong>
            </p>
            <p className="muted">
              آخرین همگام‌سازی: {String(store.lastSyncAt ?? '—')} · تعداد محصول:{' '}
              {String(store.productCount)}
            </p>
          </>
        )}
        <button
          className="btn"
          type="button"
          onClick={async () => {
            await api.mockConnectStore();
            await load();
          }}
        >
          اتصال / همگام‌سازی دمو
        </button>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>کاتالوگ</h3>
        <ul>
          {(
            products as Array<{
              sku: string;
              title: string;
              price: number;
              inStock: boolean;
            }>
          ).map((p) => (
            <li key={p.sku}>
              {p.title} ({p.sku}) — {p.price.toLocaleString('fa-IR')} —{' '}
              {p.inStock ? 'موجود' : 'ناموجود'}
            </li>
          ))}
        </ul>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>سفارش‌های همگام‌شده (دمو)</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          برای تست چت: شماره سفارش + چهار رقم آخر موبایل (فقط در Workspace دیده
          می‌شود).
        </p>
        <ul>
          {orders.map((o) => (
            <li key={o.orderNumber}>
              <strong>{o.orderNumber}</strong> · {orderStatusLabel(o.status)}
              {o.trackingCode ? ` · ${o.trackingCode}` : ''} · چهار رقم آخر:{' '}
              <code dir="ltr">{o.verifyHintPhoneLast4}</code>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
