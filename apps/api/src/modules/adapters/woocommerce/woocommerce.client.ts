const WC_API = process.env.WOOCOMMERCE_API_VERSION ?? 'wc/v3';

export type WooProduct = {
  id: number;
  name: string;
  sku: string;
  price: string;
  regular_price?: string;
  stock_status: string;
  stock_quantity: number | null;
  description: string;
  short_description?: string;
  type?: string;
  variations?: number[];
};

export type WooOrder = {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  billing?: { phone?: string; email?: string };
  shipping?: { phone?: string };
  meta_data?: Array<{ key: string; value: unknown }>;
};

export type WooSystemStatus = {
  environment?: { home_url?: string; site_url?: string };
  settings?: { currency?: string };
};

function normalizeBaseUrl(siteUrl: string): string {
  let s = siteUrl.trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  return s.replace(/\/$/, '');
}

export function normalizeWooSiteUrl(siteUrl: string): string {
  return normalizeBaseUrl(siteUrl);
}

function authHeader(consumerKey: string, consumerSecret: string): string {
  const token = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    'base64',
  );
  return `Basic ${token}`;
}

async function wooFetch<T>(
  siteUrl: string,
  consumerKey: string,
  consumerSecret: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const base = normalizeBaseUrl(siteUrl);
  const url = `${base}/wp-json/${WC_API}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: authHeader(consumerKey, consumerSecret),
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `WooCommerce API ${res.status}: ${body.slice(0, 200) || res.statusText}`,
    );
  }
  return (await res.json()) as T;
}

export async function fetchWooSystemStatus(
  siteUrl: string,
  consumerKey: string,
  consumerSecret: string,
): Promise<WooSystemStatus> {
  try {
    return await wooFetch<WooSystemStatus>(
      siteUrl,
      consumerKey,
      consumerSecret,
      '/system_status',
    );
  } catch {
    // Some stores restrict system_status — fall back to empty products probe
    await wooFetch(siteUrl, consumerKey, consumerSecret, '/products?per_page=1');
    return {};
  }
}

export async function fetchWooProducts(
  siteUrl: string,
  consumerKey: string,
  consumerSecret: string,
): Promise<WooProduct[]> {
  const products: WooProduct[] = [];
  for (let page = 1; page <= 20; page++) {
    const batch = await wooFetch<WooProduct[]>(
      siteUrl,
      consumerKey,
      consumerSecret,
      `/products?per_page=50&page=${page}&status=publish`,
    );
    products.push(...batch);
    if (batch.length < 50) break;
  }
  return products;
}

export async function fetchWooOrders(
  siteUrl: string,
  consumerKey: string,
  consumerSecret: string,
): Promise<WooOrder[]> {
  const orders: WooOrder[] = [];
  for (let page = 1; page <= 20; page++) {
    const batch = await wooFetch<WooOrder[]>(
      siteUrl,
      consumerKey,
      consumerSecret,
      `/orders?per_page=50&page=${page}`,
    );
    orders.push(...batch);
    if (batch.length < 50) break;
  }
  return orders;
}

export function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text || null;
}

export function normalizeWooProduct(
  p: WooProduct,
  currency: string,
): {
  externalId: string;
  sku: string;
  title: string;
  price: number;
  currency: string;
  inStock: boolean;
  description: string | null;
} {
  const sku = (p.sku && p.sku.trim()) || `WOO-${p.id}`;
  return {
    externalId: String(p.id),
    sku: sku.slice(0, 64),
    title: (p.name || sku).slice(0, 200),
    price: Number(p.price || p.regular_price || 0) || 0,
    currency,
    inStock: p.stock_status === 'instock' || p.stock_status === 'onbackorder',
    description: stripHtml(p.short_description || p.description),
  };
}

export function mapWooOrderStatus(status: string): string {
  const s = status.toLowerCase();
  if (s === 'refunded') return 'refunded';
  if (s === 'cancelled' || s === 'failed') return 'cancelled';
  if (s === 'completed') return 'delivered';
  if (s === 'shipped' || s === 'wc-shipped') return 'shipped';
  if (s === 'processing' || s === 'on-hold' || s === 'pending')
    return 'processing';
  return 'processing';
}

export function phoneLast4FromWoo(order: WooOrder): string {
  const raw = order.billing?.phone || order.shipping?.phone || '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length >= 4) return digits.slice(-4);
  return '0000';
}

export function normalizeWooOrderRecord(o: WooOrder, fallbackCurrency: string) {
  return {
    externalId: String(o.id),
    orderNumber: String(o.number || o.id).replace(/^#/, '').toUpperCase(),
    status: mapWooOrderStatus(o.status),
    trackingCode: null as string | null,
    totalAmount: Number(o.total) || 0,
    currency: o.currency || fallbackCurrency,
    customerPhoneLast4: phoneLast4FromWoo(o),
    customerEmail: o.billing?.email ?? null,
  };
}

const WEBHOOK_TOPICS: Array<{ name: string; topic: string }> = [
  { name: 'Seloma product created', topic: 'product.created' },
  { name: 'Seloma product updated', topic: 'product.updated' },
  { name: 'Seloma product deleted', topic: 'product.deleted' },
  { name: 'Seloma order created', topic: 'order.created' },
  { name: 'Seloma order updated', topic: 'order.updated' },
];

export async function registerWooWebhooks(
  siteUrl: string,
  consumerKey: string,
  consumerSecret: string,
  deliveryUrl: string,
  secret: string,
): Promise<{ topic: string; id: number | null; error?: string }[]> {
  const results: { topic: string; id: number | null; error?: string }[] = [];
  for (const wh of WEBHOOK_TOPICS) {
    try {
      const created = await wooFetch<{ id: number }>(
        siteUrl,
        consumerKey,
        consumerSecret,
        '/webhooks',
        {
          method: 'POST',
          body: JSON.stringify({
            name: wh.name,
            topic: wh.topic,
            delivery_url: deliveryUrl,
            secret,
            status: 'active',
          }),
        },
      );
      results.push({ topic: wh.topic, id: created.id });
    } catch (e) {
      results.push({
        topic: wh.topic,
        id: null,
        error: e instanceof Error ? e.message.slice(0, 120) : 'register failed',
      });
    }
  }
  return results;
}
