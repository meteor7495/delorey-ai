const API_VERSION = process.env.SHOPIFY_API_VERSION ?? '2024-10';

export type ShopifyShop = {
  id: number;
  name: string;
  currency: string;
  domain: string;
  myshopify_domain: string;
};

export type ShopifyProduct = {
  id: number;
  title: string;
  body_html: string | null;
  variants: Array<{
    id: number;
    sku: string | null;
    price: string;
    inventory_quantity: number | null;
    inventory_management: string | null;
  }>;
};

export type ShopifyOrder = {
  id: number;
  name: string;
  financial_status: string | null;
  fulfillment_status: string | null;
  cancelled_at?: string | null;
  total_price: string;
  currency: string;
  email: string | null;
  phone: string | null;
  shipping_address?: { phone?: string | null } | null;
  billing_address?: { phone?: string | null } | null;
  fulfillments?: Array<{ tracking_number?: string | null }>;
};

function normalizeShopDomain(shop: string): string {
  let s = shop.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, '');
  s = s.split('/')[0] ?? s;
  if (!s.includes('.')) s = `${s}.myshopify.com`;
  return s;
}

export function normalizeShopifyShopInput(shop: string): string {
  return normalizeShopDomain(shop);
}

export async function fetchShopifyShop(
  shopDomain: string,
  accessToken: string,
): Promise<ShopifyShop> {
  const domain = normalizeShopDomain(shopDomain);
  const url = `https://${domain}/admin/api/${API_VERSION}/shop.json`;
  const res = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Shopify API ${res.status}: ${body.slice(0, 200) || res.statusText}`,
    );
  }
  const data = (await res.json()) as { shop: ShopifyShop };
  return data.shop;
}

async function fetchPaginated<T>(
  shopDomain: string,
  accessToken: string,
  basePath: string,
  key: string,
): Promise<T[]> {
  const items: T[] = [];
  let pageInfo: string | null = null;
  for (let page = 0; page < 20; page++) {
    const path = pageInfo
      ? `${basePath}${basePath.includes('?') ? '&' : '?'}page_info=${encodeURIComponent(pageInfo)}`
      : basePath;
    const domain = normalizeShopDomain(shopDomain);
    const url = `https://${domain}/admin/api/${API_VERSION}${path}`;
    const res = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(
        `Shopify ${key} ${res.status}: ${body.slice(0, 200) || res.statusText}`,
      );
    }
    const data = (await res.json()) as Record<string, T[]>;
    items.push(...(data[key] ?? []));
    const link = res.headers.get('link') ?? '';
    const next = link.match(/<([^>]+)>;\s*rel="next"/);
    if (!next) break;
    const nextUrl = new URL(next[1]!);
    pageInfo = nextUrl.searchParams.get('page_info');
    if (!pageInfo) break;
  }
  return items;
}

export function fetchShopifyProducts(shopDomain: string, accessToken: string) {
  return fetchPaginated<ShopifyProduct>(
    shopDomain,
    accessToken,
    '/products.json?limit=50',
    'products',
  );
}

export function fetchShopifyOrders(shopDomain: string, accessToken: string) {
  return fetchPaginated<ShopifyOrder>(
    shopDomain,
    accessToken,
    '/orders.json?limit=50&status=any',
    'orders',
  );
}

export async function exchangeShopifyOAuthCode(input: {
  shopDomain: string;
  code: string;
  clientId: string;
  clientSecret: string;
}): Promise<{ access_token: string; scope: string }> {
  const domain = normalizeShopDomain(input.shopDomain);
  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: input.clientId,
      client_secret: input.clientSecret,
      code: input.code,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Shopify OAuth token ${res.status}: ${body.slice(0, 200) || res.statusText}`,
    );
  }
  return (await res.json()) as { access_token: string; scope: string };
}

export function mapShopifyOrderStatus(order: ShopifyOrder): string {
  if (order.financial_status === 'refunded') return 'refunded';
  if (order.cancelled_at) return 'cancelled';
  if (order.fulfillment_status === 'fulfilled') return 'delivered';
  if (order.fulfillment_status === 'partial') return 'shipped';
  if (order.fulfillment_status === 'restocked') return 'cancelled';
  return 'processing';
}

export function phoneLast4FromShopify(order: ShopifyOrder): string {
  const raw =
    order.shipping_address?.phone ||
    order.billing_address?.phone ||
    order.phone ||
    '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length >= 4) return digits.slice(-4);
  return '0000';
}

export function normalizeOrderNumber(name: string): string {
  return name.replace(/^#/, '').trim().toUpperCase();
}

export function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text || null;
}
