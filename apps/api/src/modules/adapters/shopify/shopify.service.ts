import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { DataStore } from '../../platform/data.store';
import { decryptSecret, encryptSecret } from '../../platform/crypto.util';
import { BatchSyncQueue } from '../../jobs/batch-sync.queue';
import {
  exchangeShopifyOAuthCode,
  fetchShopifyOrders,
  fetchShopifyProducts,
  fetchShopifyShop,
  normalizeShopifyOrderRecord,
  normalizeShopifyProduct,
  normalizeShopifyShopInput,
  registerShopifyWebhooks,
  type ShopifyOrder,
  type ShopifyProduct,
} from './shopify.client';

type CredPayload = { accessToken: string };

/** In-process webhook idempotency (also jobId on queue). */
const seenWebhookIds = new Map<string, number>();
const WEBHOOK_ID_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class ShopifyAdapterService {
  private readonly log = new Logger(ShopifyAdapterService.name);

  constructor(
    private readonly store: DataStore,
    private readonly batchSync: BatchSyncQueue,
  ) {}

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

  private webhookSecret(): string | null {
    return process.env.SHOPIFY_API_SECRET?.trim() || null;
  }

  private publicApiBase(): string {
    return (
      process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3001'
    ).replace(/\/$/, '');
  }

  oauthStatus() {
    return {
      oauthReady: this.oauthConfigured(),
      webhooksReady: Boolean(this.webhookSecret()),
      queue: 'batch.sync',
      scopes:
        process.env.SHOPIFY_SCOPES ??
        'read_products,read_orders,read_inventory',
    };
  }

  webhookUrlFor(connectionId: string): string {
    return `${this.publicApiBase()}/v1/webhooks/store/${connectionId}`;
  }

  async connectWithToken(
    tenantId: string,
    shopDomainRaw: string,
    accessToken: string,
  ) {
    const shopDomain = normalizeShopifyShopInput(shopDomainRaw);
    if (!accessToken.trim()) {
      throw new BadRequestException('توکن دسترسی Shopify لازم است.');
    }
    try {
      const shop = await fetchShopifyShop(shopDomain, accessToken.trim());
      const cipher = encryptSecret(
        JSON.stringify({
          accessToken: accessToken.trim(),
        } satisfies CredPayload),
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

      const queued = await this.enqueueFullSync(tenantId);
      if (!queued) {
        const result = await this.runFullSync(tenantId);
        await this.ensureWebhooks(tenantId);
        return { ...result, queued: false as const };
      }
      await this.batchSync.enqueue({
        tenantId,
        type: 'commerce.webhooks.register',
        idempotencyKey: `whreg:${tenantId}:${Date.now()}`,
      });
      const store = await this.store.getStore(tenantId);
      return {
        ...store!,
        productCount: 0,
        orderCount: 0,
        webhookUrl: this.webhookUrlFor(store!.id),
        queued: true as const,
        jobId: queued.jobId,
      };
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
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
    const redirectUri = `${this.publicApiBase()}/v1/oauth/store/callback`;
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

  /** Public API: enqueue full sync (or inline fallback). */
  async syncNow(tenantId: string) {
    const connection = await this.store.getStore(tenantId);
    if (!connection || connection.platform !== 'shopify') {
      throw new BadRequestException('فروشگاه Shopify متصل نیست.');
    }
    await this.store.markStoreSyncResult(tenantId, {
      syncHealth: 'stale',
      failureReason: 'همگام‌سازی در صف batch.sync',
    });
    const queued = await this.enqueueFullSync(tenantId);
    if (!queued) {
      const result = await this.runFullSync(tenantId);
      await this.ensureWebhooks(tenantId);
      return { ...result, queued: false as const };
    }
    await this.batchSync.enqueue({
      tenantId,
      type: 'commerce.webhooks.register',
      idempotencyKey: `whreg:${tenantId}:${queued.jobId}`,
    });
    return {
      ...connection,
      syncHealth: 'stale' as const,
      failureReason: 'همگام‌سازی در صف batch.sync',
      productCount: await this.store.countProducts(tenantId),
      webhookUrl: this.webhookUrlFor(connection.id),
      queued: true as const,
      jobId: queued.jobId,
    };
  }

  private enqueueFullSync(tenantId: string) {
    return this.batchSync.enqueue({
      tenantId,
      type: 'commerce.sync',
      idempotencyKey: `sync:${tenantId}:${Math.floor(Date.now() / 15_000)}`,
    });
  }

  /** Worker entry — full catalog/order pull. */
  async runFullSync(tenantId: string) {
    const connection = await this.store.getStore(tenantId);
    if (!connection || connection.platform !== 'shopify') {
      throw new BadRequestException('فروشگاه Shopify متصل نیست.');
    }
    const accessToken = await this.decryptAccessToken(tenantId);
    const shopDomain = connection.shopDomain!;
    const cipher = await this.store.getStoreCredentialsCipher(tenantId);
    try {
      const [shop, productsRaw, ordersRaw] = await Promise.all([
        fetchShopifyShop(shopDomain, accessToken),
        fetchShopifyProducts(shopDomain, accessToken),
        fetchShopifyOrders(shopDomain, accessToken),
      ]);

      const currency = shop.currency || 'IRR';
      const products = productsRaw.flatMap((p) =>
        normalizeShopifyProduct(p, currency),
      );

      const seen = new Set<string>();
      const uniqueProducts = products.filter((p) => {
        if (seen.has(p.sku)) {
          p.sku = `${p.sku}-${p.externalId}`.slice(0, 64);
        }
        if (seen.has(p.sku)) return false;
        seen.add(p.sku);
        return true;
      });

      const orders = ordersRaw.map((o) =>
        normalizeShopifyOrderRecord(o, currency),
      );
      const orderSeen = new Set<string>();
      const uniqueOrders = orders.filter((o) => {
        if (orderSeen.has(o.orderNumber)) return false;
        orderSeen.add(o.orderNumber);
        return true;
      });

      const productCount = await this.store.replaceCatalog(
        tenantId,
        uniqueProducts,
        'shopify',
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
        credentialsCipher: cipher!,
        syncHealth,
        failureReason,
        lastSyncAt: new Date(),
      });

      const store = await this.store.getStore(tenantId);
      return {
        ...store!,
        productCount,
        orderCount,
        webhookUrl: this.webhookUrlFor(store!.id),
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

  async ensureWebhooks(tenantId: string) {
    const connection = await this.store.getStore(tenantId);
    if (!connection?.id || connection.platform !== 'shopify') return null;
    const accessToken = await this.decryptAccessToken(tenantId);
    const address = this.webhookUrlFor(connection.id);
    const results = await registerShopifyWebhooks(
      connection.shopDomain!,
      accessToken,
      address,
    );
    return { webhookUrl: address, results };
  }

  /**
   * HTTP webhook path: verify HMAC fast, enqueue batch.sync, ack.
   */
  async handleWebhook(input: {
    connectionId: string;
    topic: string | undefined;
    hmac: string | undefined;
    webhookId: string | undefined;
    shopDomain: string | undefined;
    rawBody: Buffer;
  }) {
    this.assertWebhookHmac(input.rawBody, input.hmac);

    if (input.webhookId && this.isDuplicateWebhook(input.webhookId)) {
      return { ok: true, duplicate: true, queued: false };
    }

    const connection = await this.store.getStoreById(input.connectionId);
    if (!connection || connection.platform !== 'shopify') {
      throw new BadRequestException('اتصال فروشگاه یافت نشد.');
    }
    if (
      input.shopDomain &&
      connection.shopDomain &&
      normalizeShopifyShopInput(input.shopDomain) !==
        normalizeShopifyShopInput(connection.shopDomain)
    ) {
      throw new UnauthorizedException('دامنه فروشگاه با اتصال هم‌خوان نیست.');
    }

    const bodyJson = input.rawBody.toString('utf8');
    const idempotencyKey = input.webhookId
      ? `wh:${input.webhookId}`
      : `wh:${input.connectionId}:${input.topic}:${createHmac('sha256', bodyJson).digest('hex').slice(0, 16)}`;

    const queued = await this.batchSync.enqueue({
      tenantId: connection.tenantId,
      type: 'commerce.webhook',
      idempotencyKey,
      payload: {
        connectionId: input.connectionId,
        topic: input.topic,
        shopDomain: input.shopDomain,
        webhookId: input.webhookId,
        bodyJson,
      },
    });

    if (!queued) {
      const result = await this.processWebhookJob({
        connectionId: input.connectionId,
        topic: input.topic,
        shopDomain: input.shopDomain,
        webhookId: input.webhookId,
        bodyJson,
      });
      return { ...result, queued: false };
    }

    return { ok: true, queued: true, jobId: queued.jobId };
  }

  /** Worker entry — apply one Shopify webhook payload. */
  async processWebhookJob(input: {
    connectionId: string;
    topic: string | undefined;
    shopDomain: string | undefined;
    webhookId: string | undefined;
    bodyJson: string;
  }) {
    const connection = await this.store.getStoreById(input.connectionId);
    if (!connection || connection.platform !== 'shopify') {
      throw new BadRequestException('اتصال فروشگاه یافت نشد.');
    }

    const topic = (input.topic ?? '').toLowerCase();
    let payload: unknown = {};
    try {
      payload = JSON.parse(input.bodyJson);
    } catch {
      throw new BadRequestException('بدنه webhook نامعتبر است.');
    }

    if (topic === 'app/uninstalled') {
      await this.store.markStoreSyncResult(connection.tenantId, {
        syncHealth: 'failed',
        failureReason: 'اپ Shopify حذف نصب شد — اتصال نامعتبر',
      });
      return { ok: true, topic, action: 'uninstalled' };
    }

    if (topic === 'products/delete') {
      const productId = String((payload as { id?: number }).id ?? '');
      if (productId) {
        await this.store.deleteProductsByProductExternalPrefix(
          connection.tenantId,
          productId,
        );
      }
      await this.touchHealthy(connection.tenantId);
      return { ok: true, topic, action: 'product_deleted' };
    }

    if (topic === 'products/create' || topic === 'products/update') {
      const product = payload as ShopifyProduct;
      const currency =
        (await this.guessCurrency(connection.tenantId)) || 'IRR';
      const rows = normalizeShopifyProduct(product, currency);
      for (const row of rows) {
        await this.store.upsertSyncedProduct(
          connection.tenantId,
          row,
          'shopify',
        );
      }
      await this.touchHealthy(connection.tenantId);
      return {
        ok: true,
        topic,
        action: 'product_upserted',
        variants: rows.length,
      };
    }

    if (topic === 'orders/create' || topic === 'orders/updated') {
      const order = payload as ShopifyOrder;
      const currency =
        order.currency ||
        (await this.guessCurrency(connection.tenantId)) ||
        'IRR';
      await this.store.upsertSyncedOrder(
        connection.tenantId,
        normalizeShopifyOrderRecord(order, currency),
      );
      await this.touchHealthy(connection.tenantId);
      return { ok: true, topic, action: 'order_upserted' };
    }

    this.log.debug(`Ignored webhook topic ${topic}`);
    return { ok: true, topic, action: 'ignored' };
  }

  private async touchHealthy(tenantId: string) {
    const count = await this.store.countProducts(tenantId);
    await this.store.markStoreSyncResult(tenantId, {
      syncHealth: count === 0 ? 'failed' : 'healthy',
      failureReason:
        count === 0 ? 'کاتالوگ خالی پس از به‌روزرسانی webhook' : null,
      lastSyncAt: new Date(),
    });
  }

  private async guessCurrency(tenantId: string): Promise<string | null> {
    const products = await this.store.productsForTenant(tenantId);
    return products[0]?.currency ?? null;
  }

  private async decryptAccessToken(tenantId: string): Promise<string> {
    const cipher = await this.store.getStoreCredentialsCipher(tenantId);
    if (!cipher) {
      throw new BadRequestException('اعتبارنامه Shopify موجود نیست.');
    }
    try {
      const parsed = JSON.parse(
        decryptSecret(cipher, this.credentialsKey()),
      ) as CredPayload;
      return parsed.accessToken;
    } catch {
      await this.store.markStoreSyncResult(tenantId, {
        syncHealth: 'failed',
        failureReason: 'رمزگشایی اعتبارنامه ناموفق',
      });
      throw new BadRequestException('رمزگشایی اعتبارنامه ناموفق بود.');
    }
  }

  private assertWebhookHmac(rawBody: Buffer, hmacHeader: string | undefined) {
    const secret = this.webhookSecret();
    const relaxed = process.env.SHOPIFY_WEBHOOK_RELAXED === '1';
    if (!secret) {
      if (relaxed) return;
      throw new ServiceUnavailableException(
        'تأیید webhook نیاز به SHOPIFY_API_SECRET دارد (یا SHOPIFY_WEBHOOK_RELAXED=1 برای توسعه محلی).',
      );
    }
    if (!hmacHeader) {
      throw new UnauthorizedException('HMAC webhook موجود نیست.');
    }
    const digest = createHmac('sha256', secret).update(rawBody).digest('base64');
    const a = Buffer.from(digest);
    const b = Buffer.from(hmacHeader);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('HMAC webhook نامعتبر است.');
    }
  }

  private isDuplicateWebhook(webhookId: string): boolean {
    const now = Date.now();
    for (const [id, ts] of seenWebhookIds) {
      if (now - ts > WEBHOOK_ID_TTL_MS) seenWebhookIds.delete(id);
    }
    if (seenWebhookIds.has(webhookId)) return true;
    seenWebhookIds.set(webhookId, now);
    return false;
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
