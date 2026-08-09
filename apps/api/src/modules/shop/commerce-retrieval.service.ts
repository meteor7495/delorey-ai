import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import { ArticlesService } from './articles.service';
import { DiscountsService } from './discounts.service';
import {
  availableStock,
  calculateDiscount,
  resolveEffectivePrice,
  resolveStockState,
  type DiscountContext,
  type DiscountRule,
  type StockState,
} from './domain';

/**
 * Read-only commerce grounding for the AI Sales Employee.
 *
 * Two rules shape this service:
 *
 * 1. The model never computes. Prices are already discounted, stock is already
 *    resolved to a state, and availability is already decided here.
 * 2. The model never receives the catalog. Every method takes a query and
 *    returns a bounded slice, so prompt size stays flat as the catalog grows.
 */

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;
const MAX_VARIANTS_PER_PRODUCT = 12;

const STOCK_LABEL_FA: Record<StockState, string> = {
  in_stock: 'موجود',
  low_stock: 'موجودی محدود',
  out_of_stock: 'ناموجود',
};

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true } },
  inventoryLevels: {
    select: {
      variantId: true,
      onHand: true,
      reserved: true,
      lowStockThreshold: true,
    },
  },
  variants: {
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { sku: 'asc' }],
    take: MAX_VARIANTS_PER_PRODUCT,
    include: {
      attributeValues: {
        include: {
          attribute: { select: { name: true, sortOrder: true } },
          attributeValue: { select: { value: true, label: true } },
        },
      },
      inventoryLevel: {
        select: { onHand: true, reserved: true, lowStockThreshold: true },
      },
    },
  },
} satisfies Prisma.ProductInclude;

type ProductWithRefs = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_INCLUDE;
}>;

export interface ProductFacts {
  sku: string;
  title: string;
  brand: string | null;
  category: string | null;
  currency: string;
  /** Price before discounts. */
  listPrice: number;
  /** What the backend would actually charge today. */
  finalPrice: number;
  discountAmount: number;
  appliedDiscounts: Array<{ name: string; code: string | null; amount: number }>;
  availability: StockState;
  availabilityLabel: string;
  /** Quantity, or null when the product is not inventory-tracked. */
  available: number | null;
  shortDescription: string | null;
  tags: string[];
  variants: Array<{
    sku: string;
    options: string;
    price: number;
    availability: StockState;
    available: number | null;
  }>;
}

@Injectable()
export class CommerceRetrievalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discounts: DiscountsService,
    private readonly articles: ArticlesService,
  ) {}

  /**
   * Everything the runtime needs for one shopper turn, in one bounded payload.
   */
  async groundTurn(
    tenantId: string,
    query: string,
    opts: { limit?: number; includeArticles?: boolean } = {},
  ) {
    const limit = this.clampLimit(opts.limit);
    const [products, articles, promotions] = await Promise.all([
      this.searchProducts(tenantId, query, { limit }),
      opts.includeArticles === false
        ? Promise.resolve([])
        : this.searchArticles(tenantId, query, 2),
      this.activePromotions(tenantId, 3),
    ]);

    return { products, articles, promotions };
  }

  /** Keyword search over the sellable catalog, returned as priced facts. */
  async searchProducts(
    tenantId: string,
    query: string,
    opts: { limit?: number; categoryId?: string; inStockOnly?: boolean } = {},
  ): Promise<ProductFacts[]> {
    const limit = this.clampLimit(opts.limit);
    const where: Prisma.ProductWhereInput = {
      tenantId,
      status: 'published',
    };
    if (opts.categoryId) where.categoryId = opts.categoryId;
    if (opts.inStockOnly) where.inStock = true;

    const tokens = this.tokenize(query);
    if (tokens.length > 0) {
      where.OR = tokens.flatMap((token) => [
        { title: { contains: token, mode: 'insensitive' as const } },
        { sku: { contains: token, mode: 'insensitive' as const } },
        { brand: { contains: token, mode: 'insensitive' as const } },
        { shortDescription: { contains: token, mode: 'insensitive' as const } },
        { description: { contains: token, mode: 'insensitive' as const } },
        { tags: { has: token } },
      ]);
    }

    const rows = await this.prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy: [{ inStock: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });

    const rules = await this.discountRules(tenantId);
    return rows.map((row) => this.toFacts(row, rules));
  }

  /** Exact lookup so the model can confirm a specific item it already named. */
  async getProductFacts(
    tenantId: string,
    identifier: string,
  ): Promise<ProductFacts | null> {
    const row = await this.prisma.product.findFirst({
      where: {
        tenantId,
        status: 'published',
        OR: [
          { sku: { equals: identifier, mode: 'insensitive' } },
          { slug: { equals: identifier, mode: 'insensitive' } },
        ],
      },
      include: PRODUCT_INCLUDE,
    });
    if (!row) return null;
    return this.toFacts(row, await this.discountRules(tenantId));
  }

  /**
   * Direct answer to "do you have it in size M?" — no arithmetic left for the
   * model to get wrong.
   */
  async checkAvailability(
    tenantId: string,
    identifier: string,
    optionValues: string[] = [],
  ) {
    const facts = await this.getProductFacts(tenantId, identifier);
    if (!facts) {
      return { found: false, available: false, label: 'محصول پیدا نشد' };
    }

    if (optionValues.length === 0 || facts.variants.length === 0) {
      return {
        found: true,
        sku: facts.sku,
        title: facts.title,
        available: facts.availability !== 'out_of_stock',
        quantity: facts.available,
        label: facts.availabilityLabel,
        finalPrice: facts.finalPrice,
        currency: facts.currency,
      };
    }

    const wanted = optionValues.map((v) => v.trim().toLowerCase());
    const match = facts.variants.find((variant) => {
      const haystack = variant.options.toLowerCase();
      return wanted.every((value) => haystack.includes(value));
    });

    if (!match) {
      return {
        found: true,
        sku: facts.sku,
        title: facts.title,
        available: false,
        quantity: 0,
        label: 'این ترکیب موجود نیست',
        alternatives: facts.variants
          .filter((v) => v.availability !== 'out_of_stock')
          .map((v) => v.options),
      };
    }

    return {
      found: true,
      sku: match.sku,
      title: facts.title,
      options: match.options,
      available: match.availability !== 'out_of_stock',
      quantity: match.available,
      label: STOCK_LABEL_FA[match.availability],
      finalPrice: match.price,
      currency: facts.currency,
    };
  }

  /** Authoritative price for a quantity, discounts included. */
  async quotePrice(
    tenantId: string,
    input: { sku: string; quantity?: number; code?: string | null },
  ) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { tenantId, sku: { equals: input.sku, mode: 'insensitive' } },
      select: { id: true },
    });
    if (variant) {
      return this.discounts.quote(tenantId, {
        variantId: variant.id,
        quantity: input.quantity,
        code: input.code,
      });
    }

    const product = await this.prisma.product.findFirst({
      where: { tenantId, sku: { equals: input.sku, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!product) return null;

    return this.discounts.quote(tenantId, {
      productId: product.id,
      quantity: input.quantity,
      code: input.code,
    });
  }

  async searchArticles(tenantId: string, query: string, limit = 3) {
    const rows = await this.articles.published(tenantId, { q: query, limit });
    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      tags: row.tags,
    }));
  }

  /** Promotions the shopper could be told about unprompted. */
  async activePromotions(tenantId: string, limit = 5) {
    const now = new Date();
    const rows = await this.prisma.discount.findMany({
      where: {
        tenantId,
        active: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { priority: 'desc' },
      take: limit,
      select: {
        name: true,
        code: true,
        type: true,
        value: true,
        minCartAmount: true,
        endsAt: true,
      },
    });

    return rows.map((row) => ({
      name: row.name,
      code: row.code,
      description:
        row.type === 'percentage'
          ? `${Number(row.value)}٪ تخفیف`
          : `${Number(row.value)} تخفیف`,
      minCartAmount:
        row.minCartAmount != null ? Number(row.minCartAmount) : null,
      endsAt: row.endsAt?.toISOString() ?? null,
    }));
  }

  // ─── Internals ─────────────────────────────────────────────────────

  private clampLimit(limit?: number) {
    return Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  }

  private tokenize(query: string): string[] {
    return query
      .toLowerCase()
      .split(/[\s,?!.;:،؟]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2)
      .slice(0, 8);
  }

  private async discountRules(tenantId: string): Promise<DiscountRule[]> {
    const rows = await this.prisma.discount.findMany({
      where: { tenantId, active: true },
      include: { targets: true },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      // Coupon-gated discounts must not silently lower quoted prices.
      code: row.code,
      type: row.type as DiscountRule['type'],
      value: Number(row.value),
      currency: row.currency,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      active: row.active,
      usageLimit: row.usageLimit,
      usedCount: row.usedCount,
      minCartAmount:
        row.minCartAmount != null ? Number(row.minCartAmount) : null,
      maxDiscountAmount:
        row.maxDiscountAmount != null ? Number(row.maxDiscountAmount) : null,
      priority: row.priority,
      stackable: row.stackable,
      targets: row.targets.map((t) => ({
        targetType: t.targetType as 'all' | 'product' | 'category' | 'variant',
        targetId: t.targetId,
      })),
    }));
  }

  private toFacts(row: ProductWithRefs, rules: DiscountRule[]): ProductFacts {
    const productPrice = Number(row.price);
    const context: DiscountContext = {
      now: new Date(),
      subtotal: productPrice,
      currency: row.currency,
      productId: row.id,
      categoryId: row.categoryId,
    };
    const calculation = calculateDiscount(context, rules);

    const productLevel = row.inventoryLevels.find((l) => l.variantId === null);
    const variantLevels = row.inventoryLevels.filter(
      (l) => l.variantId !== null,
    );
    const tracked = row.hasVariants
      ? variantLevels.length > 0
      : productLevel != null;
    const totalAvailable = row.hasVariants
      ? variantLevels.reduce((sum, l) => sum + availableStock(l), 0)
      : productLevel
        ? availableStock(productLevel)
        : 0;
    const threshold =
      productLevel?.lowStockThreshold ??
      variantLevels[0]?.lowStockThreshold ??
      0;
    const availability = resolveStockState({
      tracked,
      available: totalAvailable,
      lowStockThreshold: threshold,
      inStockFlag: row.inStock,
    });

    return {
      sku: row.sku,
      title: row.title,
      brand: row.brand,
      category: row.category?.name ?? null,
      currency: row.currency,
      listPrice: productPrice,
      finalPrice: calculation.finalPrice,
      discountAmount: calculation.discountAmount,
      appliedDiscounts: calculation.appliedDiscounts.map((d) => ({
        name: d.name,
        code: d.code,
        amount: d.amount,
      })),
      availability,
      availabilityLabel: STOCK_LABEL_FA[availability],
      available: tracked ? totalAvailable : null,
      shortDescription: row.shortDescription ?? row.description,
      tags: row.tags,
      variants: row.variants.map((variant) => {
        const level = variant.inventoryLevel;
        const available = level ? availableStock(level) : null;
        const variantPrice = resolveEffectivePrice({
          productPrice,
          variantPrice: variant.price != null ? Number(variant.price) : null,
        });
        const variantCalc = calculateDiscount(
          { ...context, subtotal: variantPrice, variantId: variant.id },
          rules,
        );
        return {
          sku: variant.sku,
          options: [...variant.attributeValues]
            .sort((a, b) => a.attribute.sortOrder - b.attribute.sortOrder)
            .map(
              (v) =>
                `${v.attribute.name}: ${v.attributeValue.label || v.attributeValue.value}`,
            )
            .join('، '),
          price: variantCalc.finalPrice,
          availability: resolveStockState({
            tracked: level != null,
            available: available ?? 0,
            lowStockThreshold: level?.lowStockThreshold ?? 0,
            inStockFlag: row.inStock,
          }),
          available,
        };
      }),
    };
  }
}
