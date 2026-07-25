'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';

export default function StorePage() {
  const [store, setStore] = useState<Record<string, unknown> | null>(null);
  const [products, setProducts] = useState<unknown[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [s, p] = await Promise.all([api.getStore(), api.getProducts()]);
      setStore(s);
      setProducts(p);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell>
      <h1>فروشگاه</h1>
      <p className="muted">اتصال و سلامت همگام‌سازی (Slice 01: mock)</p>
      {store?.syncHealth !== 'healthy' && (
        <div className="banner">همگام‌سازی ناسالم — قیمت/موجودی قابل اتکا نیست.</div>
      )}
      <div className="card">
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        {store && (
          <>
            <p>
              پلتفرم: {String(store.platform)} · وضعیت:{' '}
              <strong>{String(store.syncHealth)}</strong>
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
          اتصال / همگام‌سازی mock
        </button>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>کاتالوگ</h3>
        <ul>
          {(products as Array<{ sku: string; title: string; price: number; inStock: boolean }>).map(
            (p) => (
              <li key={p.sku}>
                {p.title} ({p.sku}) — {p.price.toLocaleString('fa-IR')} —{' '}
                {p.inStock ? 'موجود' : 'ناموجود'}
              </li>
            ),
          )}
        </ul>
      </div>
    </AppShell>
  );
}
