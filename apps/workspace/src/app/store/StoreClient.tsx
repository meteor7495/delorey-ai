'use client';

import { toastSuccess, toastFromError } from '@/lib/notify';
import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  orderStatusLabel,
  platformLabel,
  syncHealthLabel,
} from '@delorey/ui';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

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
  const [wooSiteUrl, setWooSiteUrl] = useState('');
  const [wooKey, setWooKey] = useState('');
  const [wooSecret, setWooSecret] = useState('');
  const [busy, setBusy] = useState(false);

  const isLivePlatform =
    store?.platform === 'shopify' || store?.platform === 'woocommerce';

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
      if (s?.platform === 'shopify' && s.shopDomain) {
        setShopDomain(String(s.shopDomain));
      }
      if (s?.platform === 'woocommerce' && s.shopDomain) {
        setWooSiteUrl(String(s.shopDomain));
      }
    } catch (e) {
      toastFromError(e, 'خطا');
    }
  }

  useEffect(() => {
    load();
    if (search.get('shopify') === 'connected') {
      toastSuccess('Shopify متصل شد — همگام‌سازی را تازه کنید.');
    }
  }, [search]);

  async function onShopifyToken(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.connectShopify({
        shopDomain: shopDomain.trim(),
        accessToken: accessToken.trim(),
      });
      setAccessToken('');
      toastSuccess(
        'Shopify متصل شد — همگام‌سازی در صف است؛ چند ثانیه بعد تازه کنید.',
      );
      await load();
    } catch (err) {
      toastFromError(err, 'اتصال Shopify برقرار نشد. دامنه و توکن را بررسی کنید.');
    } finally {
      setBusy(false);
    }
  }

  async function onShopifyOAuth(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { authorizeUrl } = await api.startShopifyOAuth({
        shopDomain: shopDomain.trim(),
      });
      window.location.href = authorizeUrl;
    } catch (err) {
      toastFromError(err, 'شروع OAuth ممکن نیست. کلیدهای اپ Shopify را تنظیم کنید.');
      setBusy(false);
    }
  }

  async function onWooConnect(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.connectWooCommerce({
        siteUrl: wooSiteUrl.trim(),
        consumerKey: wooKey.trim(),
        consumerSecret: wooSecret.trim(),
      });
      setWooKey('');
      setWooSecret('');
      toastSuccess(
        'WooCommerce متصل شد — همگام‌سازی در صف است؛ چند ثانیه بعد تازه کنید.',
      );
      await load();
    } catch (err) {
      toastFromError(err, 'اتصال WooCommerce برقرار نشد. آدرس و کلیدها را بررسی کنید.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="فروشگاه"
          description="اتصال Shopify یا WooCommerce یا دمو — سلامت همگام‌سازی کاتالوگ و سفارش"
        />

        {store && String(store.syncHealth) !== 'healthy' ? (
          <Card className="border-[var(--warning)]/30 bg-[var(--warning-bg)]">
            <CardContent className="p-4 text-sm text-[var(--text-1)]">
              همگام‌سازی ناسالم
              {store.failureReason ? ` — ${String(store.failureReason)}` : ''} —
              قیمت/موجودی/سفارش قابل اتکا نیست.
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>وضعیت فروشگاه</CardTitle>
              {store && (
                <Badge
                  variant={
                    String(store.syncHealth) === 'healthy' ? 'success' : 'warning'
                  }
                >
                  {syncHealthLabel(String(store.syncHealth))}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {store ? (
              <>
                <p className="text-sm text-[var(--text-2)]">
                  پلتفرم: {platformLabel(String(store.platform))}
                </p>
                <p className="text-xs text-[var(--text-3)]">
                  فروشگاه: {String(store.shopDomain ?? '—')} · آخرین همگام‌سازی:{' '}
                  {store.lastSyncAt
                    ? new Date(String(store.lastSyncAt)).toLocaleString('fa-IR')
                    : '—'}{' '}
                  · محصولات: {String(store.productCount ?? products.length)}
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--text-3)]">هنوز فروشگاهی متصل نیست.</p>
            )}

            {isLivePlatform && Boolean(store?.hasCredentials) ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const res = await api.syncStore();
                      toastSuccess(
                        res && (res as { queued?: boolean }).queued
                          ? 'همگام‌سازی در صف قرار گرفت — چند ثانیه بعد تازه کنید.'
                          : 'همگام‌سازی انجام شد.',
                      );
                      await load();
                    } catch (err) {
                      toastFromError(err, 'همگام‌سازی ناموفق بود.');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  همگام‌سازی مجدد
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const res = await api.registerStoreWebhooks();
                      toastSuccess(
                        res?.webhookUrl
                          ? `Webhook ثبت شد: ${res.webhookUrl}`
                          : 'ثبت webhook انجام شد.',
                      );
                      await load();
                    } catch (err) {
                      toastFromError(err, 'ثبت webhook ناموفق بود.');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  ثبت مجدد Webhookها
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => load()}
                >
                  تازه‌سازی
                </Button>
              </div>
            ) : null}
            {isLivePlatform && store?.webhookUrl ? (
              <p className="text-xs text-[var(--text-3)]">
                آدرس webhook:{' '}
                <code dir="ltr">{String(store.webhookUrl)}</code>
                {store.platform === 'shopify' && !webhooksReady
                  ? ' — برای تأیید HMAC مقدار SHOPIFY_API_SECRET را ست کنید.'
                  : ''}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>اتصال Shopify</CardTitle>
            <CardDescription>
              مسیر اصلی: دامنه + توکن Admin API. اگر SHOPIFY_API_KEY تنظیم باشد،
              OAuth هم فعال است.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onShopifyToken} className="space-y-3">
              <div className="space-y-1.5">
                <Label>دامنه فروشگاه</Label>
                <Input
                  dir="ltr"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  placeholder="mystore.myshopify.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>توکن دسترسی Admin API</Label>
                <Input
                  dir="ltr"
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="shpat_…"
                  required
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy}>
                  اتصال Shopify
                </Button>
                {oauthReady && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || !shopDomain.trim()}
                    onClick={onShopifyOAuth}
                  >
                    اتصال با OAuth
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>اتصال WooCommerce</CardTitle>
            <CardDescription>
              مسیر معادل MVP: آدرس سایت + Consumer Key/Secret از WooCommerce →
              REST API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onWooConnect} className="space-y-3">
              <div className="space-y-1.5">
                <Label>آدرس سایت</Label>
                <Input
                  dir="ltr"
                  value={wooSiteUrl}
                  onChange={(e) => setWooSiteUrl(e.target.value)}
                  placeholder="https://mystore.example"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Consumer Key</Label>
                <Input
                  dir="ltr"
                  value={wooKey}
                  onChange={(e) => setWooKey(e.target.value)}
                  placeholder="ck_…"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Consumer Secret</Label>
                <Input
                  dir="ltr"
                  type="password"
                  value={wooSecret}
                  onChange={(e) => setWooSecret(e.target.value)}
                  placeholder="cs_…"
                  required
                />
              </div>
              <Button type="submit" disabled={busy}>
                اتصال WooCommerce
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>دمو (بدون فروشگاه واقعی)</CardTitle>
            <CardDescription>
              کاتالوگ و سفارش آزمایشی برای تست Runtime — جایگزین اتصال واقعی نیست.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api.mockConnectStore();
                  toastSuccess('فروشگاه دمو همگام شد.');
                  await load();
                } catch (err) {
                  toastFromError(err, 'خطا');
                } finally {
                  setBusy(false);
                }
              }}
            >
              اتصال / همگام‌سازی دمو
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>کاتالوگ</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="text-sm text-[var(--text-3)]">محصولی نیست.</p>
            ) : (
              <ul className="space-y-2 text-sm text-[var(--text-2)]">
                {(
                  products as Array<{
                    sku: string;
                    title: string;
                    price: number;
                    inStock: boolean;
                  }>
                ).map((p) => (
                  <li
                    key={p.sku}
                    className="rounded-lg border border-[var(--border-color)] bg-[var(--surface-2)] px-3 py-2"
                  >
                    {p.title} ({p.sku}) — {p.price.toLocaleString('fa-IR')} —{' '}
                    {p.inStock ? 'موجود' : 'ناموجود'}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سفارش‌های همگام‌شده</CardTitle>
            <CardDescription>
              برای تست چت: شماره سفارش + چهار رقم آخر موبایل (فقط در فضای کاری دیده
              می‌شود).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-[var(--text-3)]">سفارشی نیست.</p>
            ) : (
              <ul className="space-y-2 text-sm text-[var(--text-2)]">
                {orders.map((o) => (
                  <li
                    key={o.orderNumber}
                    className="rounded-lg border border-[var(--border-color)] bg-[var(--surface-2)] px-3 py-2"
                  >
                    <strong>{o.orderNumber}</strong> · {orderStatusLabel(o.status)}
                    {o.trackingCode ? ` · ${o.trackingCode}` : ''} · چهار رقم آخر:{' '}
                    <code dir="ltr">{o.verifyHintPhoneLast4}</code>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
