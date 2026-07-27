'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  orderStatusLabel,
  platformLabel,
  syncHealthLabel,
} from '@delorey/ui';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';

export default function StoreClient() {
  const search = useSearchParams();
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
  const [oauthReady, setOauthReady] = useState(false);
  const [webhooksReady, setWebhooksReady] = useState(false);
  const [shopDomain, setShopDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [s, p, o, st] = await Promise.all([
        api.getStore().catch(() => null),
        api.getProducts().catch(() => []),
        api.getOrders().catch(() => []),
        api.getShopifyStatus().catch(() => ({
          oauthReady: false,
          webhooksReady: false,
          scopes: '',
        })),
      ]);
      setStore(s);
      setProducts(p);
      setOrders(o);
      setOauthReady(Boolean(st.oauthReady));
      setWebhooksReady(Boolean(st.webhooksReady));
      if (s?.shopDomain) setShopDomain(String(s.shopDomain));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  useEffect(() => {
    load();
    if (search.get('shopify') === 'connected') {
      setMessage('Shopify متصل و همگام شد.');
    }
  }, [search]);

  async function onShopifyToken(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.connectShopify({
        shopDomain: shopDomain.trim(),
        accessToken: accessToken.trim(),
      });
      setAccessToken('');
      setMessage('Shopify متصل شد و کاتالوگ همگام گردید.');
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'اتصال Shopify برقرار نشد. دامنه و توکن را بررسی کنید.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function onShopifyOAuth(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { authorizeUrl } = await api.startShopifyOAuth({
        shopDomain: shopDomain.trim(),
      });
      window.location.href = authorizeUrl;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'شروع OAuth ممکن نیست. کلیدهای اپ Shopify را تنظیم کنید.',
      );
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1>فروشگاه</h1>
      <p className="muted">
        اتصال Shopify یا دمو — سلامت همگام‌سازی کاتالوگ و سفارش
      </p>
      {store && String(store.syncHealth) !== 'healthy' ? (
        <div className="banner">
          همگام‌سازی ناسالم
          {store.failureReason
            ? ` — ${String(store.failureReason)}`
            : ''}{' '}
          — قیمت/موجودی/سفارش قابل اتکا نیست.
        </div>
      ) : null}      {message && <p style={{ color: 'var(--success)' }}>{message}</p>}
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="card">
        {store ? (
          <>
            <p>
              پلتفرم: {platformLabel(String(store.platform))} · وضعیت:{' '}
              <strong>{syncHealthLabel(String(store.syncHealth))}</strong>
            </p>
            <p className="muted">
              فروشگاه: {String(store.shopDomain ?? '—')} · آخرین همگام‌سازی:{' '}
              {store.lastSyncAt
                ? new Date(String(store.lastSyncAt)).toLocaleString('fa-IR')
                : '—'}{' '}
              · محصولات: {String(store.productCount ?? products.length)}
            </p>
          </>
        ) : (
          <p className="muted">هنوز فروشگاهی متصل نیست.</p>
        )}

        {store?.platform === 'shopify' && Boolean(store.hasCredentials) ? (
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button
              className="btn"
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  await api.syncStore();
                  setMessage('همگام‌سازی مجدد انجام شد.');
                  await load();
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'همگام‌سازی ناموفق بود.',
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              همگام‌سازی مجدد
            </button>
            <button
              className="btn secondary"
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  const res = await api.registerShopifyWebhooks();
                  setMessage(
                    res?.webhookUrl
                      ? `Webhook ثبت شد: ${res.webhookUrl}`
                      : 'ثبت webhook انجام شد.',
                  );
                  await load();
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'ثبت webhook ناموفق بود.',
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              ثبت مجدد Webhookها
            </button>
          </div>
        ) : null}
        {store?.platform === 'shopify' && store.webhookUrl ? (
          <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
            آدرس webhook:{' '}
            <code dir="ltr">{String(store.webhookUrl)}</code>
            {!webhooksReady
              ? ' — برای تأیید HMAC مقدار SHOPIFY_API_SECRET را ست کنید.'
              : ''}
          </p>
        ) : null}      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>اتصال Shopify</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          مسیر اصلی MVP: دامنه فروشگاه + توکن Admin API (Custom app). اگر{' '}
          <code dir="ltr">SHOPIFY_API_KEY</code> تنظیم باشد، OAuth هم فعال است.
        </p>
        <form onSubmit={onShopifyToken}>
          <label>دامنه فروشگاه</label>
          <input
            className="input"
            dir="ltr"
            value={shopDomain}
            onChange={(e) => setShopDomain(e.target.value)}
            placeholder="mystore.myshopify.com"
            required
          />
          <label>توکن دسترسی Admin API</label>
          <input
            className="input"
            dir="ltr"
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="shpat_…"
            required
          />
          <div className="row">
            <button className="btn" type="submit" disabled={busy}>
              اتصال با توکن
            </button>
            {oauthReady && (
              <button
                className="btn secondary"
                type="button"
                disabled={busy || !shopDomain.trim()}
                onClick={onShopifyOAuth}
              >
                اتصال با OAuth
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>دمو (بدون Shopify)</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          کاتالوگ و سفارش آزمایشی برای تست Runtime — جایگزین اتصال واقعی نیست.
        </p>
        <button
          className="btn secondary"
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await api.mockConnectStore();
              setMessage('فروشگاه دمو همگام شد.');
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'خطا');
            } finally {
              setBusy(false);
            }
          }}
        >
          اتصال / همگام‌سازی دمو
        </button>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>کاتالوگ</h3>
        {products.length === 0 ? (
          <p className="muted">محصولی نیست.</p>
        ) : (
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
        )}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>سفارش‌های همگام‌شده</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          برای تست چت: شماره سفارش + چهار رقم آخر موبایل (فقط در فضای کاری دیده
          می‌شود).
        </p>
        {orders.length === 0 ? (
          <p className="muted">سفارشی نیست.</p>
        ) : (
          <ul>
            {orders.map((o) => (
              <li key={o.orderNumber}>
                <strong>{o.orderNumber}</strong> · {orderStatusLabel(o.status)}
                {o.trackingCode ? ` · ${o.trackingCode}` : ''} · چهار رقم آخر:{' '}
                <code dir="ltr">{o.verifyHintPhoneLast4}</code>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
