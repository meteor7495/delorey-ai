import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataStore } from '../platform/data.store';
import { ShopifyAdapterService } from '../adapters/shopify/shopify.service';
import { WooCommerceAdapterService } from '../adapters/woocommerce/woocommerce.service';

@Injectable()
export class CommerceService {
  constructor(
    private readonly store: DataStore,
    private readonly shopify: ShopifyAdapterService,
    private readonly woo: WooCommerceAdapterService,
  ) {}

  async getStore(tenantId: string) {
    const connection = await this.store.getStore(tenantId);
    if (!connection) throw new NotFoundException('Store not connected');
    const products = await this.store.productsForTenant(tenantId);
    const apiBase = (
      process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3001'
    ).replace(/\/$/, '');
    return {
      ...connection,
      productCount: products.length,
      webhookUrl:
        connection.platform === 'shopify' ||
        connection.platform === 'woocommerce'
          ? `${apiBase}/v1/webhooks/store/${connection.id}`
          : null,
    };
  }

  async requestSync(tenantId: string) {
    const connection = await this.store.getStore(tenantId);
    if (!connection) throw new NotFoundException('Store not connected');
    if (connection.platform === 'woocommerce') {
      return this.woo.syncNow(tenantId);
    }
    if (connection.platform === 'shopify') {
      return this.shopify.syncNow(tenantId);
    }
    throw new BadRequestException(
      'همگام‌سازی فقط برای Shopify یا WooCommerce پشتیبانی می‌شود.',
    );
  }

  async registerWebhooks(tenantId: string) {
    const connection = await this.store.getStore(tenantId);
    if (!connection) throw new NotFoundException('Store not connected');
    if (connection.platform === 'woocommerce') {
      return this.woo.ensureWebhooks(tenantId);
    }
    if (connection.platform === 'shopify') {
      return this.shopify.ensureWebhooks(tenantId);
    }
    throw new BadRequestException('ثبت webhook برای این پلتفرم پشتیبانی نمی‌شود.');
  }

  async mockConnect(tenantId: string) {
    const existing = await this.store.getStore(tenantId);
    if (!existing) {
      await this.store.provisionTenantDefaults(tenantId);
    } else {
      await this.store.upsertHealthyStore(tenantId);
    }
    return this.getStore(tenantId);
  }

  async listProducts(tenantId: string) {
    return this.store.productsForTenant(tenantId);
  }

  async getWebsiteChannel(tenantId: string) {
    const channel = await this.store.websiteChannel(tenantId);
    if (!channel) throw new NotFoundException('Website channel missing');
    const widgetBase = (
      process.env.WIDGET_EMBED_BASE_URL ?? 'http://localhost:5173'
    ).replace(/\/$/, '');
    const apiBase = (
      process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3001'
    ).replace(/\/$/, '');
    const snippet = `<script src="${widgetBase}/embed.js" data-public-key="${channel.publicKey}" data-api-base="${apiBase}" async></script>`;
    return {
      publicKey: channel.publicKey,
      status: channel.status,
      allowedOrigins: channel.allowedOrigins,
      snippet,
      widgetBase,
      apiBase,
    };
  }

  async updateWebsiteOrigins(tenantId: string, origins: string[]) {
    const channel = await this.store.websiteChannel(tenantId);
    if (!channel) throw new NotFoundException('Website channel missing');
    const updated = await this.store.updateWebsiteAllowedOrigins(
      tenantId,
      origins,
    );
    return this.getWebsiteChannel(tenantId).then((w) => ({
      ...w,
      allowedOrigins: updated.allowedOrigins,
    }));
  }

  async searchProducts(tenantId: string, query: string) {
    const q = query.trim().toLowerCase();
    const products = await this.store.productsForTenant(tenantId);
    if (!q) return products.slice(0, 5);

    const tokens = q
      .split(/[\s,?!.;:،؟]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);

    return products.filter((p) => {
      const hay = `${p.title} ${p.sku} ${p.description ?? ''}`.toLowerCase();
      if (hay.includes(q)) return true;
      return tokens.some(
        (t) => hay.includes(t) || p.sku.toLowerCase().includes(t),
      );
    });
  }

  /**
   * Catalog-grounded recommend — never invents SKUs.
   * Prefers in-stock; applies simple budget filter when present.
   */
  async recommendProducts(tenantId: string, query: string) {
    const products = await this.store.productsForTenant(tenantId);
    if (products.length === 0) return [];

    const q = query.trim().toLowerCase();
    const budget = this.parseBudgetIrr(q);

    const categoryTokens = this.extractCategoryTokens(q);
    let candidates = products;

    if (categoryTokens.length > 0) {
      const filtered = products.filter((p) => {
        const hay = `${p.title} ${p.sku} ${p.description ?? ''}`.toLowerCase();
        return categoryTokens.some((t) => hay.includes(t));
      });
      if (filtered.length > 0) candidates = filtered;
    }

    if (budget != null) {
      candidates = candidates.filter((p) => p.price <= budget);
    }

    // Prefer in-stock first, keep OOS only if they matched category (labeled later)
    const inStock = candidates.filter((p) => p.inStock);
    const outStock = candidates.filter((p) => !p.inStock);

    const preferInStockOnly =
      /هدیه|پیشنهاد|چی بخر|recommend|gift|suggest/i.test(q) &&
      categoryTokens.length === 0;

    const ranked = preferInStockOnly
      ? inStock
      : [...inStock, ...outStock];

    if (ranked.length === 0 && budget != null) {
      // Budget too tight — return empty rather than invent
      return [];
    }

    if (ranked.length === 0) {
      return inStock.length ? inStock.slice(0, 3) : products.filter((p) => p.inStock).slice(0, 3);
    }

    return ranked.slice(0, 3);
  }

  parseBudgetIrr(query: string): number | null {
    const q = query.toLowerCase();
    // "زیر یک میلیون" / "بودجه ۱ میلیون"
    if (/یک\s*میلیون|1\s*میلیون|میلیون\s*تومان|1000000|۱۰۰۰۰۰۰/.test(q)) {
      return 1_000_000;
    }
    if (/دو\s*میلیون|2\s*میلیون/.test(q)) return 2_000_000;
    if (/سه\s*میلیون|3\s*میلیون/.test(q)) return 3_000_000;
    const m = q.match(
      /(?:زیر|کمتر از|تا|بودجه|under|below|max)\s*([\d۰-۹,]+)\s*(هزار|میلیون)?/i,
    );
    if (!m) return null;
    const raw = m[1]!.replace(/,/g, '').replace(/[۰-۹]/g, (d) =>
      String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)),
    );
    let n = Number(raw);
    if (!Number.isFinite(n)) return null;
    if (m[2]?.includes('میلیون')) n *= 1_000_000;
    else if (m[2]?.includes('هزار')) n *= 1_000;
    return n;
  }

  private extractCategoryTokens(query: string): string[] {
    const map: Array<[RegExp, string[]]> = [
      [/پیراهن|لینن|shirt/i, ['پیراهن', 'لینن', 'shirt']],
      [/کیف|bag/i, ['کیف', 'bag']],
      [/کفش|shoe|اسپرت/i, ['کفش', 'اسپرت', 'shoe']],
    ];
    const tokens: string[] = [];
    for (const [re, ts] of map) {
      if (re.test(query)) tokens.push(...ts);
    }
    return tokens;
  }

  listOrders(tenantId: string) {
    return this.store.listOrders(tenantId);
  }

  findOrderByNumber(tenantId: string, orderNumber: string) {
    return this.store.findOrderByNumber(tenantId, orderNumber);
  }

  /**
   * Verify shopper before revealing order details.
   * Policy MVP: phone last-4 OR exact email match.
   */
  verifyOrderAccess(
    order: {
      customerPhoneLast4: string;
      customerEmail: string | null;
    },
    proof: string,
  ): boolean {
    const p = proof.trim().toLowerCase();
    if (/^\d{4}$/.test(p) && p === order.customerPhoneLast4) return true;
    if (order.customerEmail && p === order.customerEmail.toLowerCase()) {
      return true;
    }
    return false;
  }
}
