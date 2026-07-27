import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { DataStore } from '../../platform/data.store';
import { decryptSecret, encryptSecret } from '../../platform/crypto.util';
import {
  exchangeShopifyOAuthCode,
  fetchShopifyOrders,
  fetchShopifyProducts,
  fetchShopifyShop,
  mapShopifyOrderStatus,
  normalizeOrderNumber,
  normalizeShopifyShopInput,
  phoneLast4FromShopify,
  stripHtml,
} from './shopify.client';

type CredPayload = { accessToken: string };

@Injectable()
export class ShopifyAdapterService {
  constructor(private readonly store: DataStore) {}

  private credentialsKey(): string {
    return (
      process.env.SHOPIFY_CREDENTIALS_KEY ||
      process.env.JWT_SECRET ||
      'dev-only-change-me-in-production'
    );
  }

  private oauthConfigured(): boolean {
    return Boolean(
      process.env.SHOPIFY_API_KEY?.trim() &&
        process.env.SHOPIFY_API_SECRET?.trim(),
    );
  }

  oauthStatus() {
    return {
      oauthReady: this.oauthConfigured(),
      scopes:
        process.env.SHOPIFY_SCOPES ??
        'read_products,read_orders,read_inventory',
    };
  }

  /**
   * Custom app / Admin API token path (local + Partner without full OAuth).
   */
  async connectWithToken(tenantId: string, shopDomainRaw: string, accessToken: string) {
    const shopDomain = normalizeShopifyShopInput(shopDomainRaw);
    if (!accessToken.trim()) {
      throw new BadRequestException('توکن دسترسی Shopify لازم است.');
    }
    try {
      const shop = await fetchShopifyShop(shopDomain, accessToken.trim());
      const cipher = encryptSecret(
        JSON.stringify({ accessToken: accessToken.trim() } satisfies CredPayload),
        this.credentialsKey(),
      );
      await this.store.upsertShopifyConnection({
        tenantId,
        shopDomain: shop.myshopify_domain || shopDomain,
        externalShopId: String(shop.id),
        credentialsCipher: cipher,
        syncHealth: 'stale',
        failureReason: null,
        lastSyncAt: null,
      });
      return this.syncNow(tenantId);
    } catch (e) {
      const reason =
        e instanceof Error ? e.message : 'اتصال Shopify ناموفق بود';
      await this.store.upsertShopifyConnection({
        tenantId,
        shopDomain,
        externalShopId: null,
        credentialsCipher: encryptSecret(
          JSON.stringify({ accessToken: accessToken.trim() }),
          this.credentialsKey(),
        ),
        syncHealth: 'failed',
        failureReason: reason.slice(0, 280),
        lastSyncAt: null,
      });
      throw new BadRequestException(
        `اتصال Shopify برقرار نشد: ${reason.slice(0, 160)}`,
      );
    }
  }

  buildOAuthStartUrl(tenantId: string, shopDomainRaw: string): string {
    if (!this.oauthConfigured()) {
      throw new ServiceUnavailableException(
        'OAuth شاپیفای پیکربندی نشده — SHOPIFY_API_KEY و SHOPIFY_API_SECRET را تنظیم کنید، یا با توکن Admin API متصل شوید.',
      );
    }
    const shop = normalizeShopifyShopInput(shopDomainRaw);
    const apiBase =
      process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
    const redirectUri = `${apiBase.replace(/\/$/, '')}/v1/oauth/store/callback`;
    const scopes =
      process.env.SHOPIFY_SCOPES ??
      'read_products,read_orders,read_inventory';
    const state = this.signState({ tenantId, shop, ts: Date.now() });
    const params = new URLSearchParams({
      client_id: process.env.SHOPIFY_API_KEY!,
      scope: scopes,
      redirect_uri: redirectUri,
      state,
    });
    return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
  }

  async handleOAuthCallback(query: {
    code?: string;
    shop?: string;
    state?: string;
    hmac?: string;
  }) {
    if (!this.oauthConfigured()) {
      throw new ServiceUnavailableException('OAuth شاپیفای پیکربندی نشده.');
    }
    if (!query.code || !query.shop || !query.state) {
      throw new BadRequestException('پارامترهای OAuth ناقص است.');
    }
    if (query.hmac && !this.verifyOAuthHmac(query)) {
      throw new BadRequestException('امضای OAuth معتبر نیست.');
    }
    const payload = this.verifyState(query.state);
    const shopDomain = normalizeShopifyShopInput(query.shop);
    if (payload.shop !== shopDomain) {
      throw new BadRequestException('فروشگاه با state هم‌خوان نیست.');
    }
    const token = await exchangeShopifyOAuthCode({
      shopDomain,
      code: query.code,
      clientId: process.env.SHOPIFY_API_KEY!,
      clientSecret: process.env.SHOPIFY_API_SECRET!,
    });
    await this.connectWithToken(
      payload.tenantId,
      shopDomain,
      token.access_token,
    );
    const workspace =
      process.env.WORKSPACE_APP_URL ?? 'http://localhost:3010';
    return `${workspace.replace(/\/$/, '')}/store?shopify=connected`;
  }

  async syncNow(tenantId: string) {
    const connection = await this.store.getStore(tenantId);
    if (!connection || connection.platform !== 'shopify') {
      throw new BadRequestException('فروشگاه Shopify متصل نیست.');
    }
    const cipher = await this.store.getStoreCredentialsCipher(tenantId);
    if (!cipher) {
      throw new BadRequestException('اعتبارنامه Shopify موجود نیست.');
    }
    let accessToken: string;
    try {
      const parsed = JSON.parse(decryptSecret(cipher, this.credentialsKey())) as CredPayload;
      accessToken = parsed.accessToken;
    } catch {
      await this.store.markStoreSyncResult(tenantId, {
        syncHealth: 'failed',
        failureReason: 'رمزگشایی اعتبارنامه ناموفق',
      });
      throw new BadRequestException('رمزگشایی اعتبارنامه ناموفق بود.');
    }

    const shopDomain = connection.shopDomain!;
    try {
      const [shop, productsRaw, ordersRaw] = await Promise.all([
        fetchShopifyShop(shopDomain, accessToken),
        fetchShopifyProducts(shopDomain, accessToken),
        fetchShopifyOrders(shopDomain, accessToken),
      ]);

      const currency = shop.currency || 'IRR';
      const products = productsRaw.flatMap((p) => {
        const variants = p.variants?.length
          ? p.variants
          : [
              {
                id: p.id,
                sku: null,
                price: '0',
                inventory_quantity: 0,
                inventory_management: null,
              },
            ];
        return variants.map((v) => {
          const sku =
            (v.sku && v.sku.trim()) ||
            `SHP-${p.id}-${v.id}`;
          const managed = Boolean(v.inventory_management);
          const inStock = managed
            ? (v.inventory_quantity ?? 0) > 0
            : true;
          return {
            externalId: String(v.id),
            sku: sku.slice(0, 64),
            title:
              variants.length > 1
                ? `${p.title}`.slice(0, 200)
                : p.title.slice(0, 200),
            price: Number(v.price) || 0,
            currency,
            inStock,
            description: stripHtml(p.body_html),
          };
        });
      });

      // Dedupe SKUs (Shopify can have empty/dupe SKUs)
      const seen = new Set<string>();
      const uniqueProducts = products.filter((p) => {
        let sku = p.sku;
        if (seen.has(sku)) {
          sku = `${p.sku}-${p.externalId}`;
          p.sku = sku.slice(0, 64);
        }
        if (seen.has(p.sku)) return false;
        seen.add(p.sku);
        return true;
      });

      const orders = ordersRaw.map((o) => ({
        externalId: String(o.id),
        orderNumber: normalizeOrderNumber(o.name),
        status: mapShopifyOrderStatus(o),
        trackingCode:
          o.fulfillments?.find((f) => f.tracking_number)?.tracking_number ??
          null,
        totalAmount: Number(o.total_price) || 0,
        currency: o.currency || currency,
        customerPhoneLast4: phoneLast4FromShopify(o),
        customerEmail: o.email,
      }));

      // Dedupe order numbers
      const orderSeen = new Set<string>();
      const uniqueOrders = orders.filter((o) => {
        if (orderSeen.has(o.orderNumber)) return false;
        orderSeen.add(o.orderNumber);
        return true;
      });

      const productCount = await this.store.replaceCatalog(
        tenantId,
        uniqueProducts,
      );
      const orderCount = await this.store.replaceOrders(tenantId, uniqueOrders);

      const syncHealth = productCount === 0 ? 'failed' : 'healthy';
      const failureReason =
        productCount === 0
          ? 'کاتالوگ خالی پس از همگام‌سازی — go-live قابل اتکا نیست'
          : null;

      await this.store.upsertShopifyConnection({
        tenantId,
        shopDomain: shop.myshopify_domain || shopDomain,
        externalShopId: String(shop.id),
        credentialsCipher: cipher,
        syncHealth,
        failureReason,
        lastSyncAt: new Date(),
      });

      const store = await this.store.getStore(tenantId);
      return {
        ...store!,
        productCount,
        orderCount,
      };
    } catch (e) {
      const reason = e instanceof Error ? e.message : 'همگام‌سازی ناموفق';
      await this.store.markStoreSyncResult(tenantId, {
        syncHealth: 'failed',
        failureReason: reason.slice(0, 280),
      });
      throw new BadRequestException(
        `همگام‌سازی Shopify ناموفق: ${reason.slice(0, 160)}`,
      );
    }
  }

  private signState(payload: { tenantId: string; shop: string; ts: number }) {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', this.credentialsKey())
      .update(body)
      .digest('base64url');
    return `${body}.${sig}`;
  }

  private verifyState(state: string): {
    tenantId: string;
    shop: string;
    ts: number;
  } {
    const [body, sig] = state.split('.');
    if (!body || !sig) throw new BadRequestException('state نامعتبر');
    const expected = createHmac('sha256', this.credentialsKey())
      .update(body)
      .digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException('state نامعتبر');
    }
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as { tenantId: string; shop: string; ts: number };
    if (Date.now() - payload.ts > 15 * 60 * 1000) {
      throw new BadRequestException('state منقضی شده');
    }
    return payload;
  }

  private verifyOAuthHmac(query: Record<string, string | undefined>): boolean {
    const secret = process.env.SHOPIFY_API_SECRET!;
    const entries = Object.entries(query)
      .filter(([k, v]) => k !== 'hmac' && k !== 'signature' && v != null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const digest = createHmac('sha256', secret).update(entries).digest('hex');
    try {
      const a = Buffer.from(digest, 'utf8');
      const b = Buffer.from(query.hmac!, 'utf8');
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }
}
