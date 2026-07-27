import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { DataStore } from '../../platform/data.store';
import { decryptSecret, encryptSecret } from '../../platform/crypto.util';
import { BatchSyncQueue } from '../../jobs/batch-sync.queue';
import {
  fetchWooOrders,
  fetchWooProducts,
  fetchWooSystemStatus,
  normalizeWooOrderRecord,
  normalizeWooProduct,
  normalizeWooSiteUrl,
  registerWooWebhooks,
  type WooOrder,
  type WooProduct,
} from './woocommerce.client';

type WooCredPayload = {
  consumerKey: string;
  consumerSecret: string;
  webhookSecret: string;
};

const seenWebhookIds = new Map<string, number>();
const WEBHOOK_ID_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class WooCommerceAdapterService {
  private readonly log = new Logger(WooCommerceAdapterService.name);

  constructor(
    private readonly store: DataStore,
    private readonly batchSync: BatchSyncQueue,
  ) {}

  private credentialsKey(): string {
    return (
      process.env.WOOCOMMERCE_CREDENTIALS_KEY ||
      process.env.SHOPIFY_CREDENTIALS_KEY ||
      process.env.JWT_SECRET ||
      'dev-only-change-me-in-production'
    );
  }

  private publicApiBase(): string {
    return (
      process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3001'
    ).replace(/\/$/, '');
  }

  webhookUrlFor(connectionId: string): string {
    return `${this.publicApiBase()}/v1/webhooks/store/${connectionId}`;
  }

  async connectWithKeys(
    tenantId: string,
    siteUrlRaw: string,
    consumerKey: string,
    consumerSecret: string,
  ) {
    const siteUrl = normalizeWooSiteUrl(siteUrlRaw);
    if (!consumerKey.trim() || !consumerSecret.trim()) {
      throw new BadRequestException('کلید و رمز WooCommerce لازم است.');
    }
    try {
      await fetchWooSystemStatus(
        siteUrl,
        consumerKey.trim(),
        consumerSecret.trim(),
      );
      const webhookSecret = randomBytes(24).toString('hex');
      const cipher = encryptSecret(
        JSON.stringify({
          consumerKey: consumerKey.trim(),
          consumerSecret: consumerSecret.trim(),
          webhookSecret,
        } satisfies WooCredPayload),
        this.credentialsKey(),
      );
      await this.store.upsertPlatformConnection({
        tenantId,
        platform: 'woocommerce',
        shopDomain: siteUrl,
        externalShopId: siteUrl,
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
        idempotencyKey: `whreg:woo:${tenantId}:${Date.now()}`,
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
        e instanceof Error ? e.message : 'اتصال WooCommerce ناموفق بود';
      throw new BadRequestException(
        `اتصال WooCommerce برقرار نشد: ${reason.slice(0, 160)}`,
      );
    }
  }

  async syncNow(tenantId: string) {
    const connection = await this.store.getStore(tenantId);
    if (!connection || connection.platform !== 'woocommerce') {
      throw new BadRequestException('فروشگاه WooCommerce متصل نیست.');
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
      idempotencyKey: `whreg:woo:${tenantId}:${queued.jobId}`,
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

  async runFullSync(tenantId: string) {
    const connection = await this.store.getStore(tenantId);
    if (!connection || connection.platform !== 'woocommerce') {
      throw new BadRequestException('فروشگاه WooCommerce متصل نیست.');
    }
    const creds = await this.decryptCreds(tenantId);
    const siteUrl = connection.shopDomain!;
    const cipher = await this.store.getStoreCredentialsCipher(tenantId);
    try {
      const status = await fetchWooSystemStatus(
        siteUrl,
        creds.consumerKey,
        creds.consumerSecret,
      );
      const currency = status.settings?.currency || 'IRR';
      const [productsRaw, ordersRaw] = await Promise.all([
        fetchWooProducts(siteUrl, creds.consumerKey, creds.consumerSecret),
        fetchWooOrders(siteUrl, creds.consumerKey, creds.consumerSecret),
      ]);

      const products = productsRaw.map((p) => normalizeWooProduct(p, currency));
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
        normalizeWooOrderRecord(o, currency),
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
      );
      const orderCount = await this.store.replaceOrders(tenantId, uniqueOrders);
      const syncHealth = productCount === 0 ? 'failed' : 'healthy';
      const failureReason =
        productCount === 0
          ? 'کاتالوگ خالی پس از همگام‌سازی — go-live قابل اتکا نیست'
          : null;

      await this.store.upsertPlatformConnection({
        tenantId,
        platform: 'woocommerce',
        shopDomain: siteUrl,
        externalShopId: siteUrl,
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
        `همگام‌سازی WooCommerce ناموفق: ${reason.slice(0, 160)}`,
      );
    }
  }

  async ensureWebhooks(tenantId: string) {
    const connection = await this.store.getStore(tenantId);
    if (!connection?.id || connection.platform !== 'woocommerce') return null;
    const creds = await this.decryptCreds(tenantId);
    const address = this.webhookUrlFor(connection.id);
    const results = await registerWooWebhooks(
      connection.shopDomain!,
      creds.consumerKey,
      creds.consumerSecret,
      address,
      creds.webhookSecret,
    );
    return { webhookUrl: address, results };
  }

  async handleWebhook(input: {
    connectionId: string;
    topic: string | undefined;
    signature: string | undefined;
    webhookId: string | undefined;
    rawBody: Buffer;
  }) {
    const connection = await this.store.getStoreById(input.connectionId);
    if (!connection || connection.platform !== 'woocommerce') {
      throw new BadRequestException('اتصال فروشگاه یافت نشد.');
    }
    const creds = await this.decryptCreds(connection.tenantId);
    this.assertWebhookSignature(
      input.rawBody,
      input.signature,
      creds.webhookSecret,
    );

    if (input.webhookId && this.isDuplicateWebhook(input.webhookId)) {
      return { ok: true, duplicate: true, queued: false };
    }

    const bodyJson = input.rawBody.toString('utf8');
    const idempotencyKey = input.webhookId
      ? `wh:woo:${input.webhookId}`
      : `wh:woo:${input.connectionId}:${input.topic}:${createHmac('sha256', bodyJson).digest('hex').slice(0, 16)}`;

    const queued = await this.batchSync.enqueue({
      tenantId: connection.tenantId,
      type: 'commerce.webhook',
      idempotencyKey,
      payload: {
        connectionId: input.connectionId,
        topic: input.topic,
        webhookId: input.webhookId,
        bodyJson,
        platform: 'woocommerce',
      },
    });

    if (!queued) {
      const result = await this.processWebhookJob({
        connectionId: input.connectionId,
        topic: input.topic,
        bodyJson,
      });
      return { ...result, queued: false };
    }
    return { ok: true, queued: true, jobId: queued.jobId };
  }

  async processWebhookJob(input: {
    connectionId: string;
    topic: string | undefined;
    bodyJson: string;
  }) {
    const connection = await this.store.getStoreById(input.connectionId);
    if (!connection || connection.platform !== 'woocommerce') {
      throw new BadRequestException('اتصال فروشگاه یافت نشد.');
    }
    const topic = (input.topic ?? '').toLowerCase();
    let payload: unknown = {};
    try {
      payload = JSON.parse(input.bodyJson);
    } catch {
      throw new BadRequestException('بدنه webhook نامعتبر است.');
    }

    if (topic === 'product.deleted') {
      const id = String((payload as { id?: number }).id ?? '');
      if (id) {
        await this.store.deleteProductsByProductExternalPrefix(
          connection.tenantId,
          id,
        );
      }
      await this.touchHealthy(connection.tenantId);
      return { ok: true, topic, action: 'product_deleted' };
    }

    if (topic === 'product.created' || topic === 'product.updated') {
      const product = payload as WooProduct;
      const currency =
        (await this.guessCurrency(connection.tenantId)) || 'IRR';
      await this.store.upsertSyncedProduct(
        connection.tenantId,
        normalizeWooProduct(product, currency),
      );
      await this.touchHealthy(connection.tenantId);
      return { ok: true, topic, action: 'product_upserted' };
    }

    if (topic === 'order.created' || topic === 'order.updated') {
      const order = payload as WooOrder;
      const currency =
        order.currency ||
        (await this.guessCurrency(connection.tenantId)) ||
        'IRR';
      await this.store.upsertSyncedOrder(
        connection.tenantId,
        normalizeWooOrderRecord(order, currency),
      );
      await this.touchHealthy(connection.tenantId);
      return { ok: true, topic, action: 'order_upserted' };
    }

    this.log.debug(`Ignored Woo webhook topic ${topic}`);
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

  private async decryptCreds(tenantId: string): Promise<WooCredPayload> {
    const cipher = await this.store.getStoreCredentialsCipher(tenantId);
    if (!cipher) {
      throw new BadRequestException('اعتبارنامه WooCommerce موجود نیست.');
    }
    try {
      return JSON.parse(
        decryptSecret(cipher, this.credentialsKey()),
      ) as WooCredPayload;
    } catch {
      await this.store.markStoreSyncResult(tenantId, {
        syncHealth: 'failed',
        failureReason: 'رمزگشایی اعتبارنامه ناموفق',
      });
      throw new BadRequestException('رمزگشایی اعتبارنامه ناموفق بود.');
    }
  }

  private assertWebhookSignature(
    rawBody: Buffer,
    signature: string | undefined,
    secret: string,
  ) {
    const relaxed = process.env.WOOCOMMERCE_WEBHOOK_RELAXED === '1';
    if (!signature) {
      if (relaxed) return;
      throw new UnauthorizedException('امضای webhook موجود نیست.');
    }
    const digest = createHmac('sha256', secret).update(rawBody).digest('base64');
    const a = Buffer.from(digest);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('امضای webhook نامعتبر است.');
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
}
