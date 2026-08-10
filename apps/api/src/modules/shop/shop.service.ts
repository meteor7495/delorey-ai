import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { DataStore } from '../platform/data.store';
import { PrismaService } from '../platform/prisma.service';
import {
  availableStock,
  calculateDiscount,
  resolveEffectivePrice,
  toSlug,
} from './domain';
import { DiscountsService } from './discounts.service';
import { InventoryService } from './inventory.service';
import { VariantsService } from './variants.service';

function mapProduct(row: {
  id: string;
  tenantId: string;
  externalId: string | null;
  sku: string;
  slug: string;
  title: string;
  price: Prisma.Decimal;
  compareAtPrice: Prisma.Decimal | null;
  currency: string;
  inStock: boolean;
  description: string | null;
  images: string[];
  categoryId: string | null;
  status: string;
  source: string;
  shortDescription?: string | null;
  brand?: string | null;
  costPrice?: Prisma.Decimal | null;
  barcode?: string | null;
  tags?: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  hasVariants?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    externalId: row.externalId,
    sku: row.sku,
    slug: row.slug,
    title: row.title,
    price: Number(row.price),
    compareAtPrice:
      row.compareAtPrice != null ? Number(row.compareAtPrice) : null,
    currency: row.currency,
    inStock: row.inStock,
    description: row.description,
    images: row.images ?? [],
    categoryId: row.categoryId,
    status: row.status,
    source: row.source,
    shortDescription: row.shortDescription ?? null,
    brand: row.brand ?? null,
    costPrice: row.costPrice != null ? Number(row.costPrice) : null,
    barcode: row.barcode ?? null,
    tags: row.tags ?? [],
    seoTitle: row.seoTitle ?? null,
    seoDescription: row.seoDescription ?? null,
    seoKeywords: row.seoKeywords ?? [],
    hasVariants: row.hasVariants ?? false,
    createdAt: row.createdAt?.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
  };
}

export interface ProductWriteInput {
  sku?: string;
  title?: string;
  slug?: string;
  price?: number;
  compareAtPrice?: number | null;
  currency?: string;
  inStock?: boolean;
  description?: string | null;
  images?: string[];
  categoryId?: string | null;
  status?: 'draft' | 'published';
  shortDescription?: string | null;
  brand?: string | null;
  costPrice?: number | null;
  barcode?: string | null;
  tags?: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  /** Product-level stock, only used while the product has no variants. */
  onHand?: number;
  lowStockThreshold?: number;
}

export interface ProductFilters {
  source?: string;
  q?: string;
  status?: string;
  categoryId?: string;
  /** in_stock | out_of_stock */
  stock?: string;
  hasVariants?: boolean;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface CategoryWriteInput {
  name?: string;
  slug?: string;
  parentId?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  active?: boolean;
}

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly store: DataStore,
    private readonly inventory: InventoryService,
    private readonly variants: VariantsService,
    private readonly discounts: DiscountsService,
  ) {}

  private storefrontBase() {
    return (
      process.env.STOREFRONT_BASE_URL ?? 'http://localhost:3020'
    ).replace(/\/$/, '');
  }

  // ─── Settings / overview ───────────────────────────────────────────

  async getOverview(tenantId: string) {
    const settings = await this.store.ensureStorefrontSettings(tenantId);
    const [
      productCount,
      categoryCount,
      orderCount,
      pendingOrders,
      variantCount,
      attributeCount,
      activeDiscounts,
      publishedArticles,
      inventory,
    ] = await Promise.all([
      this.prisma.product.count({ where: { tenantId, source: 'native' } }),
      this.prisma.category.count({ where: { tenantId } }),
      this.prisma.storefrontOrder.count({ where: { tenantId } }),
      this.prisma.storefrontOrder.count({
        where: { tenantId, status: 'pending' },
      }),
      this.prisma.productVariant.count({ where: { tenantId } }),
      this.prisma.attribute.count({ where: { tenantId } }),
      this.prisma.discount.count({ where: { tenantId, active: true } }),
      this.prisma.article.count({ where: { tenantId, status: 'published' } }),
      this.inventory.summary(tenantId),
    ]);

    return {
      settings: this.mapSettings(settings),
      storefrontUrl: `${this.storefrontBase()}/s/${settings.storeSlug}`,
      stats: {
        productCount,
        categoryCount,
        orderCount,
        pendingOrders,
        variantCount,
        attributeCount,
        activeDiscounts,
        publishedArticles,
        lowStock: inventory.lowStock,
        outOfStock: inventory.outOfStock,
        inventoryValue: inventory.inventoryValue,
      },
    };
  }

  async getSettings(tenantId: string) {
    const settings = await this.store.ensureStorefrontSettings(tenantId);
    return {
      ...this.mapSettings(settings),
      storefrontUrl: `${this.storefrontBase()}/s/${settings.storeSlug}`,
    };
  }

  async updateSettings(
    tenantId: string,
    patch: {
      storeName?: string;
      storeSlug?: string;
      logoUrl?: string | null;
      primaryColor?: string;
      secondaryColor?: string;
      tagline?: string | null;
      codEnabled?: boolean;
      onlinePaymentEnabled?: boolean;
      supportPhone?: string | null;
      defaultCurrency?: string;
      lowStockThreshold?: number;
      allowNegativeInventory?: boolean;
      defaultProductStatus?: string;
    },
  ) {
    await this.store.ensureStorefrontSettings(tenantId);
    if (
      patch.defaultProductStatus &&
      !['draft', 'published'].includes(patch.defaultProductStatus)
    ) {
      throw new BadRequestException('وضعیت پیش‌فرض محصول نامعتبر است');
    }
    if (
      patch.lowStockThreshold != null &&
      (!Number.isInteger(patch.lowStockThreshold) || patch.lowStockThreshold < 0)
    ) {
      throw new BadRequestException('آستانه موجودی کم نامعتبر است');
    }
    if (patch.storeSlug) {
      const slug = toSlug(patch.storeSlug, tenantId);
      const clash = await this.prisma.storefrontSettings.findFirst({
        where: { storeSlug: slug, NOT: { tenantId } },
      });
      if (clash) throw new BadRequestException('این اسلاگ قبلاً گرفته شده');
      patch.storeSlug = slug;
    }
    const row = await this.prisma.storefrontSettings.update({
      where: { tenantId },
      data: {
        storeName: patch.storeName,
        storeSlug: patch.storeSlug,
        logoUrl: patch.logoUrl === undefined ? undefined : patch.logoUrl,
        primaryColor: patch.primaryColor,
        secondaryColor: patch.secondaryColor,
        tagline: patch.tagline === undefined ? undefined : patch.tagline,
        codEnabled: patch.codEnabled,
        onlinePaymentEnabled: patch.onlinePaymentEnabled,
        supportPhone:
          patch.supportPhone === undefined ? undefined : patch.supportPhone,
        defaultCurrency: patch.defaultCurrency,
        lowStockThreshold: patch.lowStockThreshold,
        allowNegativeInventory: patch.allowNegativeInventory,
        defaultProductStatus: patch.defaultProductStatus,
      },
    });
    return {
      ...this.mapSettings(row),
      storefrontUrl: `${this.storefrontBase()}/s/${row.storeSlug}`,
    };
  }

  // ─── Categories ────────────────────────────────────────────────────

  async listCategories(tenantId: string) {
    const [rows, productCounts] = await Promise.all([
      this.prisma.category.findMany({
        where: { tenantId },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.product.groupBy({
        by: ['categoryId'],
        where: { tenantId, categoryId: { not: null } },
        _count: { _all: true },
      }),
    ]);
    const counts = new Map(
      productCounts.map((c) => [c.categoryId as string, c._count._all]),
    );
    return rows.map((r) => ({
      ...this.mapCategory(r),
      productCount: counts.get(r.id) ?? 0,
    }));
  }

  async createCategory(tenantId: string, body: CategoryWriteInput) {
    const name = (body.name ?? '').trim();
    if (!name) throw new BadRequestException('نام دسته الزامی است');
    const slug = await this.uniqueCategorySlug(
      tenantId,
      body.slug || toSlug(name, uuid()),
    );
    if (body.parentId) await this.assertCategoryExists(tenantId, body.parentId);

    const row = await this.prisma.category.create({
      data: {
        tenantId,
        name,
        slug,
        parentId: body.parentId || null,
        imageUrl: body.imageUrl || null,
        sortOrder: body.sortOrder ?? 0,
        description: body.description ?? null,
        seoTitle: body.seoTitle ?? null,
        seoDescription: body.seoDescription ?? null,
        active: body.active ?? true,
      },
    });
    return this.mapCategory(row);
  }

  async updateCategory(tenantId: string, id: string, body: CategoryWriteInput) {
    const existing = await this.prisma.category.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('دسته پیدا نشد');

    let slug = existing.slug;
    if (body.slug) {
      slug = await this.uniqueCategorySlug(tenantId, body.slug, id);
    }
    if (body.parentId) {
      if (body.parentId === id) {
        throw new BadRequestException('دسته نمی‌تواند والد خودش باشد');
      }
      await this.assertCategoryExists(tenantId, body.parentId);
      await this.assertNoCycle(tenantId, id, body.parentId);
    }

    const row = await this.prisma.category.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? existing.name,
        slug,
        parentId:
          body.parentId === undefined ? existing.parentId : body.parentId,
        imageUrl:
          body.imageUrl === undefined ? existing.imageUrl : body.imageUrl,
        sortOrder: body.sortOrder ?? existing.sortOrder,
        description:
          body.description === undefined
            ? existing.description
            : body.description,
        seoTitle:
          body.seoTitle === undefined ? existing.seoTitle : body.seoTitle,
        seoDescription:
          body.seoDescription === undefined
            ? existing.seoDescription
            : body.seoDescription,
        active: body.active ?? existing.active,
      },
    });
    return this.mapCategory(row);
  }

  async deleteCategory(tenantId: string, id: string) {
    const existing = await this.prisma.category.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('دسته پیدا نشد');
    await this.prisma.product.updateMany({
      where: { tenantId, categoryId: id },
      data: { categoryId: null },
    });
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  private mapCategory(row: {
    id: string;
    parentId: string | null;
    name: string;
    slug: string;
    imageUrl: string | null;
    sortOrder: number;
    description: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    active: boolean;
  }) {
    return {
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      slug: row.slug,
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
      description: row.description,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      active: row.active,
    };
  }

  private async assertCategoryExists(tenantId: string, id: string) {
    const found = await this.prisma.category.count({ where: { tenantId, id } });
    if (found === 0) throw new BadRequestException('دسته والد پیدا نشد');
  }

  /** Walks up the tree so a category cannot become its own ancestor. */
  private async assertNoCycle(
    tenantId: string,
    id: string,
    parentId: string,
  ) {
    let cursor: string | null = parentId;
    const seen = new Set<string>([id]);
    while (cursor) {
      if (seen.has(cursor)) {
        throw new BadRequestException('ساختار دسته‌بندی حلقه ایجاد می‌کند');
      }
      seen.add(cursor);
      const parent: { parentId: string | null } | null =
        await this.prisma.category.findFirst({
          where: { id: cursor, tenantId },
          select: { parentId: true },
        });
      cursor = parent?.parentId ?? null;
    }
  }

  // ─── Products CMS ──────────────────────────────────────────────────

  async listCmsProducts(tenantId: string, filters: ProductFilters = {}) {
    const limit = Math.min(Math.max(filters.limit ?? 25, 1), 100);
    const offset = Math.max(filters.offset ?? 0, 0);

    const where: Prisma.ProductWhereInput = {
      tenantId,
      source: filters.source ?? 'native',
    };
    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.hasVariants != null) where.hasVariants = filters.hasVariants;
    if (filters.stock === 'in_stock') where.inStock = true;
    if (filters.stock === 'out_of_stock') where.inStock = false;
    if (filters.q) {
      const q = filters.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { barcode: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: this.productOrderBy(filters.sort),
        skip: offset,
        take: limit,
        include: {
          inventoryLevels: {
            select: { onHand: true, reserved: true, lowStockThreshold: true },
          },
          _count: { select: { variants: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({
        ...mapProduct(row),
        variantCount: row._count.variants,
        stock: this.summarizeStock(row.inventoryLevels),
      })),
      total,
      limit,
      offset,
    };
  }

  async getCmsProduct(tenantId: string, id: string) {
    const row = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        inventoryLevels: {
          select: {
            id: true,
            variantId: true,
            onHand: true,
            reserved: true,
            lowStockThreshold: true,
          },
        },
        _count: { select: { variants: true } },
      },
    });
    if (!row) throw new NotFoundException('محصول پیدا نشد');

    const productLevel = row.inventoryLevels.find((l) => l.variantId === null);
    return {
      ...mapProduct(row),
      variantCount: row._count.variants,
      stock: this.summarizeStock(row.inventoryLevels),
      inventoryLevelId: productLevel?.id ?? null,
    };
  }

  async createNativeProduct(tenantId: string, body: ProductWriteInput) {
    const sku = (body.sku ?? '').trim();
    const title = (body.title ?? '').trim();
    if (!sku) throw new BadRequestException('SKU الزامی است');
    if (!title) throw new BadRequestException('عنوان الزامی است');
    if (body.price == null || Number.isNaN(body.price)) {
      throw new BadRequestException('قیمت الزامی است');
    }
    if (body.categoryId) await this.assertCategoryExists(tenantId, body.categoryId);

    const settings = await this.inventory.commerceSettings(tenantId);
    const slug = await this.uniqueProductSlug(
      tenantId,
      body.slug || toSlug(title, sku),
    );

    let created;
    try {
      created = await this.prisma.product.create({
        data: {
          tenantId,
          sku,
          slug,
          title,
          price: new Prisma.Decimal(body.price),
          compareAtPrice:
            body.compareAtPrice != null
              ? new Prisma.Decimal(body.compareAtPrice)
              : null,
          currency: body.currency ?? settings.defaultCurrency,
          inStock: body.inStock ?? true,
          description: body.description ?? null,
          images: body.images ?? [],
          categoryId: body.categoryId || null,
          status: body.status ?? 'published',
          source: 'native',
          shortDescription: body.shortDescription ?? null,
          brand: body.brand ?? null,
          costPrice:
            body.costPrice != null ? new Prisma.Decimal(body.costPrice) : null,
          barcode: body.barcode ?? null,
          tags: body.tags ?? [],
          seoTitle: body.seoTitle ?? null,
          seoDescription: body.seoDescription ?? null,
          seoKeywords: body.seoKeywords ?? [],
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('SKU یا اسلاگ تکراری است');
      }
      throw e;
    }

    // Every product is tracked from creation so stock reads never 404.
    await this.inventory.ensureLevel(tenantId, created.id, null);
    if (body.onHand != null || body.lowStockThreshold != null) {
      await this.inventory.adjust(tenantId, {
        productId: created.id,
        setTo: body.onHand ?? 0,
        lowStockThreshold: body.lowStockThreshold,
        type: 'initial',
        reason: 'موجودی اولیه محصول',
      });
    }

    return this.getCmsProduct(tenantId, created.id);
  }

  async updateNativeProduct(
    tenantId: string,
    id: string,
    body: ProductWriteInput,
  ) {
    const existing = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('محصول پیدا نشد');
    if (existing.source !== 'native') {
      throw new BadRequestException(
        'محصول همگام‌سازی‌شده فقط‌خواندنی است؛ از CMS بومی ویرایش کنید یا محصول native بسازید',
      );
    }
    if (body.categoryId) await this.assertCategoryExists(tenantId, body.categoryId);

    let slug = existing.slug;
    if (body.slug) slug = await this.uniqueProductSlug(tenantId, body.slug, id);

    try {
      await this.prisma.product.update({
        where: { id },
        data: {
          sku: body.sku?.trim() ?? existing.sku,
          slug,
          title: body.title?.trim() ?? existing.title,
          price:
            body.price != null
              ? new Prisma.Decimal(body.price)
              : existing.price,
          compareAtPrice:
            body.compareAtPrice === undefined
              ? existing.compareAtPrice
              : body.compareAtPrice == null
                ? null
                : new Prisma.Decimal(body.compareAtPrice),
          currency: body.currency ?? existing.currency,
          inStock: body.inStock ?? existing.inStock,
          description:
            body.description === undefined
              ? existing.description
              : body.description,
          images: body.images ?? existing.images,
          categoryId:
            body.categoryId === undefined
              ? existing.categoryId
              : body.categoryId || null,
          status: body.status ?? existing.status,
          shortDescription:
            body.shortDescription === undefined
              ? existing.shortDescription
              : body.shortDescription,
          brand: body.brand === undefined ? existing.brand : body.brand,
          costPrice:
            body.costPrice === undefined
              ? existing.costPrice
              : body.costPrice == null
                ? null
                : new Prisma.Decimal(body.costPrice),
          barcode: body.barcode === undefined ? existing.barcode : body.barcode,
          tags: body.tags ?? existing.tags,
          seoTitle:
            body.seoTitle === undefined ? existing.seoTitle : body.seoTitle,
          seoDescription:
            body.seoDescription === undefined
              ? existing.seoDescription
              : body.seoDescription,
          seoKeywords: body.seoKeywords ?? existing.seoKeywords,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('SKU یا اسلاگ تکراری است');
      }
      throw e;
    }

    // Variant-level stock is owned by the variants, not the product row.
    if (!existing.hasVariants && body.onHand != null) {
      await this.inventory.adjust(tenantId, {
        productId: id,
        setTo: body.onHand,
        lowStockThreshold: body.lowStockThreshold,
        type: 'adjustment',
        reason: 'ویرایش محصول',
      });
    }

    return this.getCmsProduct(tenantId, id);
  }

  async deleteNativeProduct(tenantId: string, id: string) {
    const existing = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('محصول پیدا نشد');
    if (existing.source !== 'native') {
      throw new BadRequestException('فقط محصولات بومی قابل حذف از CMS هستند');
    }
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  /** Status / category / delete applied to a selection in one request. */
  async bulkProducts(
    tenantId: string,
    input: {
      ids: string[];
      action: 'publish' | 'draft' | 'delete' | 'category';
      categoryId?: string | null;
    },
  ) {
    const ids = [...new Set(input.ids.filter(Boolean))];
    if (ids.length === 0) {
      throw new BadRequestException('هیچ محصولی انتخاب نشده است');
    }

    const owned = await this.prisma.product.findMany({
      where: { tenantId, id: { in: ids }, source: 'native' },
      select: { id: true },
    });
    if (owned.length === 0) {
      throw new BadRequestException('محصول بومی معتبری انتخاب نشده است');
    }
    const ownedIds = owned.map((p) => p.id);

    if (input.action === 'delete') {
      const result = await this.prisma.product.deleteMany({
        where: { tenantId, id: { in: ownedIds } },
      });
      return { affected: result.count, action: input.action };
    }

    if (input.action === 'category') {
      if (input.categoryId) {
        await this.assertCategoryExists(tenantId, input.categoryId);
      }
      const result = await this.prisma.product.updateMany({
        where: { tenantId, id: { in: ownedIds } },
        data: { categoryId: input.categoryId || null },
      });
      return { affected: result.count, action: input.action };
    }

    const result = await this.prisma.product.updateMany({
      where: { tenantId, id: { in: ownedIds } },
      data: { status: input.action === 'publish' ? 'published' : 'draft' },
    });
    return { affected: result.count, action: input.action };
  }

  private productOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'title_asc':
        return { title: 'asc' };
      case 'title_desc':
        return { title: 'desc' };
      case 'price_asc':
        return { price: 'asc' };
      case 'price_desc':
        return { price: 'desc' };
      case 'created_asc':
        return { createdAt: 'asc' };
      case 'created_desc':
        return { createdAt: 'desc' };
      default:
        return { updatedAt: 'desc' };
    }
  }

  private summarizeStock(
    levels: Array<{ onHand: number; reserved: number; lowStockThreshold: number }>,
  ) {
    if (levels.length === 0) {
      return { onHand: 0, reserved: 0, available: 0, lowStockThreshold: 0, tracked: false };
    }
    const onHand = levels.reduce((sum, l) => sum + l.onHand, 0);
    const reserved = levels.reduce((sum, l) => sum + l.reserved, 0);
    return {
      onHand,
      reserved,
      available: onHand - reserved,
      lowStockThreshold: Math.max(...levels.map((l) => l.lowStockThreshold)),
      tracked: true,
    };
  }

  // ─── Banners ───────────────────────────────────────────────────────

  async listBanners(tenantId: string) {
    const rows = await this.prisma.storefrontBanner.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      imageUrl: r.imageUrl,
      href: r.href,
      sortOrder: r.sortOrder,
      active: r.active,
    }));
  }

  async createBanner(
    tenantId: string,
    body: {
      title?: string;
      subtitle?: string | null;
      imageUrl?: string | null;
      href?: string | null;
      sortOrder?: number;
      active?: boolean;
    },
  ) {
    const title = (body.title ?? '').trim();
    if (!title) throw new BadRequestException('عنوان بنر الزامی است');
    const row = await this.prisma.storefrontBanner.create({
      data: {
        tenantId,
        title,
        subtitle: body.subtitle ?? null,
        imageUrl: body.imageUrl ?? null,
        href: body.href ?? null,
        sortOrder: body.sortOrder ?? 0,
        active: body.active ?? true,
      },
    });
    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      imageUrl: row.imageUrl,
      href: row.href,
      sortOrder: row.sortOrder,
      active: row.active,
    };
  }

  async updateBanner(
    tenantId: string,
    id: string,
    body: {
      title?: string;
      subtitle?: string | null;
      imageUrl?: string | null;
      href?: string | null;
      sortOrder?: number;
      active?: boolean;
    },
  ) {
    const existing = await this.prisma.storefrontBanner.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('بنر پیدا نشد');
    const row = await this.prisma.storefrontBanner.update({
      where: { id },
      data: {
        title: body.title?.trim() ?? existing.title,
        subtitle:
          body.subtitle === undefined ? existing.subtitle : body.subtitle,
        imageUrl:
          body.imageUrl === undefined ? existing.imageUrl : body.imageUrl,
        href: body.href === undefined ? existing.href : body.href,
        sortOrder: body.sortOrder ?? existing.sortOrder,
        active: body.active ?? existing.active,
      },
    });
    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      imageUrl: row.imageUrl,
      href: row.href,
      sortOrder: row.sortOrder,
      active: row.active,
    };
  }

  async deleteBanner(tenantId: string, id: string) {
    const existing = await this.prisma.storefrontBanner.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('بنر پیدا نشد');
    await this.prisma.storefrontBanner.delete({ where: { id } });
    return { ok: true };
  }

  // ─── CMS Orders ────────────────────────────────────────────────────

  async listStorefrontOrders(tenantId: string) {
    const rows = await this.prisma.storefrontOrder.findMany({
      where: { tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.mapOrder(r));
  }

  async updateStorefrontOrderStatus(
    tenantId: string,
    id: string,
    status: string,
  ) {
    const allowed = [
      'pending',
      'pending_payment',
      'confirmed',
      'shipped',
      'delivered',
      'cancelled',
    ];
    if (!allowed.includes(status)) {
      throw new BadRequestException('وضعیت نامعتبر');
    }
    const existing = await this.prisma.storefrontOrder.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('سفارش پیدا نشد');
    const row = await this.prisma.storefrontOrder.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    return this.mapOrder(row);
  }

  // ─── Public storefront ─────────────────────────────────────────────

  async resolveTenantBySlug(storeSlug: string) {
    const settings = await this.prisma.storefrontSettings.findUnique({
      where: { storeSlug },
    });
    if (!settings) throw new NotFoundException('فروشگاه پیدا نشد');
    return settings;
  }

  async publicHome(storeSlug: string) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    const tenantId = settings.tenantId;
    const [banners, categories, featured] = await Promise.all([
      this.prisma.storefrontBanner.findMany({
        where: { tenantId, active: true },
        orderBy: { sortOrder: 'asc' },
        take: 8,
      }),
      this.prisma.category.findMany({
        where: { tenantId },
        orderBy: { sortOrder: 'asc' },
        take: 12,
      }),
      this.prisma.product.findMany({
        where: {
          tenantId,
          status: 'published',
          source: { in: ['native', 'mock'] },
        },
        orderBy: { updatedAt: 'desc' },
        take: 12,
      }),
    ]);
    const channel = await this.store.websiteChannel(tenantId);
    return {
      settings: this.mapSettings(settings),
      banners: banners.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        imageUrl: b.imageUrl,
        href: b.href,
      })),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        imageUrl: c.imageUrl,
      })),
      featured: featured.map(mapProduct),
      widget: channel
        ? {
            publicKey: channel.publicKey,
            apiBase: (
              process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3001'
            ).replace(/\/$/, ''),
            widgetBase: (
              process.env.WIDGET_EMBED_BASE_URL ?? 'http://localhost:5173'
            ).replace(/\/$/, ''),
          }
        : null,
    };
  }

  async publicCategories(storeSlug: string) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    return this.listCategories(settings.tenantId);
  }

  async publicProducts(
    storeSlug: string,
    query: {
      q?: string;
      category?: string;
      inStock?: string;
      minPrice?: string;
      maxPrice?: string;
    },
  ) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    const tenantId = settings.tenantId;
    let categoryId: string | undefined;
    if (query.category) {
      const cat = await this.prisma.category.findFirst({
        where: { tenantId, slug: query.category },
      });
      categoryId = cat?.id;
    }
    const where: Prisma.ProductWhereInput = {
      tenantId,
      status: 'published',
      source: { in: ['native', 'mock'] },
      ...(categoryId ? { categoryId } : {}),
      ...(query.inStock === '1' ? { inStock: true } : {}),
      ...(query.minPrice || query.maxPrice
        ? {
            price: {
              ...(query.minPrice
                ? { gte: new Prisma.Decimal(query.minPrice) }
                : {}),
              ...(query.maxPrice
                ? { lte: new Prisma.Decimal(query.maxPrice) }
                : {}),
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { sku: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const rows = await this.prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 60,
    });
    return rows.map(mapProduct);
  }

  async publicProduct(storeSlug: string, productSlug: string) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    const row = await this.prisma.product.findFirst({
      where: {
        tenantId: settings.tenantId,
        slug: productSlug,
        status: 'published',
        source: { in: ['native', 'mock'] },
      },
    });
    if (!row) throw new NotFoundException('محصول پیدا نشد');
    const variants = row.hasVariants
      ? (await this.variants.listForProduct(settings.tenantId, row.id)).filter(
          (v) => v.active,
        )
      : [];
    return {
      ...mapProduct(row),
      variants,
    };
  }

  async getOrCreateCart(tenantId: string, sessionId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { tenantId_sessionId: { tenantId, sessionId } },
      include: {
        items: {
          include: {
            product: true,
            variant: {
              include: {
                attributeValues: {
                  include: {
                    attribute: {
                      select: { id: true, name: true, sortOrder: true },
                    },
                    attributeValue: {
                      select: {
                        id: true,
                        value: true,
                        label: true,
                        colorHex: true,
                      },
                    },
                  },
                },
                inventoryLevel: true,
              },
            },
          },
        },
      },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { tenantId, sessionId },
        include: {
          items: {
            include: {
              product: true,
              variant: {
                include: {
                  attributeValues: {
                    include: {
                      attribute: {
                        select: { id: true, name: true, sortOrder: true },
                      },
                      attributeValue: {
                        select: {
                          id: true,
                          value: true,
                          label: true,
                          colorHex: true,
                        },
                      },
                    },
                  },
                  inventoryLevel: true,
                },
              },
            },
          },
        },
      });
    }
    return this.mapCart(cart);
  }

  async setCartItem(
    storeSlug: string,
    input: {
      sessionId: string;
      productId: string;
      variantId?: string | null;
      quantity: number;
    },
  ) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    const tenantId = settings.tenantId;
    const sessionId = input.sessionId;
    const productId = input.productId;
    const variantId = input.variantId?.trim() || null;
    const quantity = input.quantity;

    if (!sessionId) throw new BadRequestException('sessionId الزامی است');
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
        status: 'published',
        source: { in: ['native', 'mock'] },
      },
    });
    if (!product) throw new NotFoundException('محصول پیدا نشد');

    if (product.hasVariants && !variantId) {
      throw new BadRequestException('انتخاب تنوع محصول الزامی است');
    }

    if (variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: {
          id: variantId,
          tenantId,
          productId,
          active: true,
        },
        include: { inventoryLevel: true },
      });
      if (!variant) throw new NotFoundException('تنوع محصول پیدا نشد');
      const available = variant.inventoryLevel
        ? availableStock(variant.inventoryLevel)
        : 0;
      if (quantity > 0 && available < quantity) {
        throw new BadRequestException('موجودی این تنوع کافی نیست');
      }
    } else if (quantity > 0 && !product.inStock) {
      throw new BadRequestException('محصول ناموجود است');
    }

    let cart = await this.prisma.cart.findUnique({
      where: { tenantId_sessionId: { tenantId, sessionId } },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { tenantId, sessionId },
      });
    }

    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        ...(variantId ? { variantId } : { variantId: null }),
      },
    });

    if (quantity <= 0) {
      if (existing) {
        await this.prisma.cartItem.delete({ where: { id: existing.id } });
      }
    } else if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId,
          quantity,
        },
      });
    }

    return this.getOrCreateCart(tenantId, sessionId);
  }

  async getCart(storeSlug: string, sessionId: string) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    return this.getOrCreateCart(settings.tenantId, sessionId);
  }

  async publicValidateDiscount(
    storeSlug: string,
    code: string,
    subtotal = 0,
  ) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    return this.discounts.validateCode(settings.tenantId, code, subtotal);
  }

  async checkout(
    storeSlug: string,
    body: {
      sessionId: string;
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      customerNote?: string;
      discountCode?: string;
      paymentMethod?: 'cod' | 'online';
    },
  ) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    const paymentMethod = body.paymentMethod ?? 'cod';

    if (paymentMethod === 'cod' && !settings.codEnabled) {
      throw new BadRequestException('پرداخت در محل برای این فروشگاه فعال نیست');
    }
    if (paymentMethod === 'online' && !settings.onlinePaymentEnabled) {
      throw new BadRequestException(
        'پرداخت آنلاین هنوز برای این فروشگاه فعال نشده است',
      );
    }

    const cart = await this.prisma.cart.findUnique({
      where: {
        tenantId_sessionId: {
          tenantId: settings.tenantId,
          sessionId: body.sessionId,
        },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: { include: { inventoryLevel: true } },
          },
        },
      },
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('سبد خرید خالی است');
    }

    const pricedLines = cart.items.map((item) => {
      const unitPrice = resolveEffectivePrice({
        productPrice: Number(item.product.price),
        variantPrice:
          item.variant?.price != null ? Number(item.variant.price) : null,
      });
      const title = item.variant
        ? `${item.product.title} (${item.variant.sku})`
        : item.product.title;
      const sku = item.variant?.sku ?? item.product.sku;
      return {
        item,
        unitPrice,
        title,
        sku,
        lineTotal: unitPrice * item.quantity,
        categoryId: item.product.categoryId,
      };
    });

    for (const line of pricedLines) {
      if (line.item.variantId) {
        const level = line.item.variant?.inventoryLevel;
        const available = level ? availableStock(level) : 0;
        if (available < line.item.quantity) {
          throw new BadRequestException(
            `موجودی «${line.title}» کافی نیست`,
          );
        }
      } else if (!line.item.product.inStock) {
        throw new BadRequestException(
          `محصول «${line.item.product.title}» ناموجود است`,
        );
      }
    }

    const subtotal = pricedLines.reduce((sum, l) => sum + l.lineTotal, 0);
    const discountCode = body.discountCode?.trim() || null;
    let discountAmount = 0;
    let appliedDiscountId: string | null = null;

    if (discountCode) {
      const applied = await this.computeCartDiscount(
        settings.tenantId,
        pricedLines.map((l) => ({
          productId: l.item.productId,
          variantId: l.item.variantId,
          categoryId: l.categoryId,
          lineTotal: l.lineTotal,
        })),
        subtotal,
        discountCode,
      );
      if (!applied.valid) {
        throw new BadRequestException(
          applied.reason === 'not_found'
            ? 'کد تخفیف پیدا نشد'
            : 'کد تخفیف قابل اعمال نیست',
        );
      }
      discountAmount = applied.discountAmount;
      appliedDiscountId = applied.discountId;
    }

    const total = Math.max(subtotal - discountAmount, 0);
    const orderNumber = `SF-${Date.now().toString(36).toUpperCase()}`;
    const status =
      paymentMethod === 'online' ? 'pending_payment' : 'pending';

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.storefrontOrder.create({
        data: {
          tenantId: settings.tenantId,
          orderNumber,
          status,
          paymentMethod,
          subtotalAmount: new Prisma.Decimal(subtotal),
          discountCode,
          discountAmount: new Prisma.Decimal(discountAmount),
          totalAmount: new Prisma.Decimal(total),
          currency: cart.items[0]?.product.currency ?? 'IRR',
          customerName: body.customerName.trim(),
          customerPhone: body.customerPhone.trim(),
          customerAddress: body.customerAddress.trim(),
          customerNote: body.customerNote?.trim() || null,
          items: {
            create: pricedLines.map((l) => ({
              productId: l.item.productId,
              variantId: l.item.variantId,
              sku: l.sku,
              title: l.title,
              unitPrice: new Prisma.Decimal(l.unitPrice),
              quantity: l.item.quantity,
              lineTotal: new Prisma.Decimal(l.lineTotal),
            })),
          },
        },
        include: { items: true },
      });

      if (appliedDiscountId) {
        await tx.discount.update({
          where: { id: appliedDiscountId },
          data: { usedCount: { increment: 1 } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    // Inventory decrement after order is committed (ledger-safe via InventoryService)
    for (const line of pricedLines) {
      try {
        await this.inventory.adjust(settings.tenantId, {
          productId: line.item.variantId ? undefined : line.item.productId,
          variantId: line.item.variantId ?? undefined,
          delta: -line.item.quantity,
          type: 'sale',
          referenceType: 'storefront_order',
          referenceId: order.id,
          reason: `فروش سفارش ${order.orderNumber}`,
        });
      } catch (err) {
        // Order already placed — surface soft failure via status note path later;
        // still throw so merchant sees the issue on tight stock races.
        throw new BadRequestException(
          err instanceof Error
            ? err.message
            : `خطا در کسر موجودی برای «${line.title}»`,
        );
      }
    }

    return {
      ...this.mapOrder(order),
      paymentHint:
        paymentMethod === 'online'
          ? 'پرداخت آنلاین در انتظار اتصال درگاه است؛ سفارش با وضعیت pending_payment ثبت شد.'
          : null,
      payUrl: null as string | null,
    };
  }

  private async computeCartDiscount(
    tenantId: string,
    lines: Array<{
      productId: string;
      variantId: string | null;
      categoryId: string | null;
      lineTotal: number;
    }>,
    subtotal: number,
    code: string,
  ) {
    const validation = await this.discounts.validateCode(
      tenantId,
      code,
      subtotal,
    );
    if (!validation.valid || !validation.discount) {
      return {
        valid: false as const,
        reason: validation.reason as string,
        discountAmount: 0,
        discountId: null,
      };
    }

    const rules = await this.discounts.rulesFor(tenantId);

    const matched = rules.filter(
      (r) =>
        r.code &&
        r.code.trim().toLowerCase() === code.trim().toLowerCase(),
    );
    if (matched.length === 0) {
      return {
        valid: false as const,
        reason: 'not_found',
        discountAmount: 0,
        discountId: null,
      };
    }

    const rule = matched[0]!;
    const targets = rule.targets ?? [];
    const isCartWide =
      targets.length === 0 || targets.some((t) => t.targetType === 'all');

    let discountAmount = 0;
    if (isCartWide) {
      const calc = calculateDiscount(
        { now: new Date(), subtotal, code },
        [rule],
      );
      discountAmount = calc.discountAmount;
    } else {
      for (const line of lines) {
        const calc = calculateDiscount(
          {
            now: new Date(),
            subtotal: line.lineTotal,
            productId: line.productId,
            variantId: line.variantId,
            categoryId: line.categoryId,
            code,
          },
          [rule],
        );
        discountAmount += calc.discountAmount;
      }
    }

    if (discountAmount <= 0) {
      return {
        valid: false as const,
        reason: 'not_applicable',
        discountAmount: 0,
        discountId: null,
      };
    }

    return {
      valid: true as const,
      reason: null,
      discountAmount,
      discountId: rule.id,
    };
  }

  async trackOrder(
    storeSlug: string,
    orderNumber: string,
    phone: string,
  ) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    const order = await this.prisma.storefrontOrder.findFirst({
      where: {
        tenantId: settings.tenantId,
        orderNumber,
        customerPhone: phone.trim(),
      },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('سفارش پیدا نشد');
    return this.mapOrder(order);
  }

  // ─── helpers ───────────────────────────────────────────────────────

  private mapSettings(row: {
    id: string;
    tenantId: string;
    storeName: string;
    storeSlug: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    tagline: string | null;
    codEnabled: boolean;
    onlinePaymentEnabled?: boolean;
    supportPhone: string | null;
    defaultCurrency?: string;
    lowStockThreshold?: number;
    allowNegativeInventory?: boolean;
    defaultProductStatus?: string;
  }) {
    return {
      id: row.id,
      tenantId: row.tenantId,
      storeName: row.storeName,
      storeSlug: row.storeSlug,
      logoUrl: row.logoUrl,
      primaryColor: row.primaryColor,
      secondaryColor: row.secondaryColor,
      tagline: row.tagline,
      codEnabled: row.codEnabled,
      onlinePaymentEnabled: row.onlinePaymentEnabled ?? false,
      supportPhone: row.supportPhone,
      defaultCurrency: row.defaultCurrency ?? 'IRR',
      lowStockThreshold: row.lowStockThreshold ?? 5,
      allowNegativeInventory: row.allowNegativeInventory ?? false,
      defaultProductStatus: row.defaultProductStatus ?? 'draft',
    };
  }

  private mapCart(cart: {
    id: string;
    sessionId: string;
    items: Array<{
      id: string;
      quantity: number;
      variantId?: string | null;
      product: {
        id: string;
        sku: string;
        slug: string;
        title: string;
        price: Prisma.Decimal;
        currency: string;
        inStock: boolean;
        images: string[];
        hasVariants?: boolean;
      };
      variant?: {
        id: string;
        sku: string;
        price: Prisma.Decimal | null;
        imageUrl: string | null;
        attributeValues: Array<{
          attribute: { id: string; name: string; sortOrder: number };
          attributeValue: {
            id: string;
            value: string;
            label: string | null;
            colorHex: string | null;
          };
        }>;
        inventoryLevel: { onHand: number; reserved: number } | null;
      } | null;
    }>;
  }) {
    const items = cart.items.map((i) => {
      const unitPrice = resolveEffectivePrice({
        productPrice: Number(i.product.price),
        variantPrice: i.variant?.price != null ? Number(i.variant.price) : null,
      });
      const options = (i.variant?.attributeValues ?? [])
        .slice()
        .sort((a, b) => a.attribute.sortOrder - b.attribute.sortOrder)
        .map((v) => ({
          attributeName: v.attribute.name,
          label: v.attributeValue.label || v.attributeValue.value,
        }));
      const available = i.variant?.inventoryLevel
        ? availableStock(i.variant.inventoryLevel)
        : null;
      return {
        id: i.id,
        quantity: i.quantity,
        variantId: i.variantId ?? null,
        product: {
          id: i.product.id,
          sku: i.product.sku,
          slug: i.product.slug,
          title: i.product.title,
          price: Number(i.product.price),
          currency: i.product.currency,
          inStock: i.product.inStock,
          images: i.product.images,
          hasVariants: i.product.hasVariants ?? false,
        },
        variant: i.variant
          ? {
              id: i.variant.id,
              sku: i.variant.sku,
              imageUrl: i.variant.imageUrl,
              options,
              available,
              effectivePrice: unitPrice,
            }
          : null,
        unitPrice,
        lineTotal: unitPrice * i.quantity,
      };
    });
    return {
      id: cart.id,
      sessionId: cart.sessionId,
      items,
      total: items.reduce((s, i) => s + i.lineTotal, 0),
      currency: items[0]?.product.currency ?? 'IRR',
    };
  }

  private mapOrder(row: {
    id: string;
    orderNumber: string;
    status: string;
    paymentMethod: string;
    subtotalAmount?: Prisma.Decimal;
    discountCode?: string | null;
    discountAmount?: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
    currency: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerNote: string | null;
    createdAt: Date;
    items: Array<{
      id: string;
      sku: string;
      title: string;
      unitPrice: Prisma.Decimal;
      quantity: number;
      lineTotal: Prisma.Decimal;
      productId: string | null;
      variantId?: string | null;
    }>;
  }) {
    return {
      id: row.id,
      orderNumber: row.orderNumber,
      status: row.status,
      paymentMethod: row.paymentMethod,
      subtotalAmount: Number(row.subtotalAmount ?? row.totalAmount),
      discountCode: row.discountCode ?? null,
      discountAmount: Number(row.discountAmount ?? 0),
      totalAmount: Number(row.totalAmount),
      currency: row.currency,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerAddress: row.customerAddress,
      customerNote: row.customerNote,
      createdAt: row.createdAt.toISOString(),
      items: row.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        variantId: i.variantId ?? null,
        sku: i.sku,
        title: i.title,
        unitPrice: Number(i.unitPrice),
        quantity: i.quantity,
        lineTotal: Number(i.lineTotal),
      })),
    };
  }

  private async uniqueCategorySlug(
    tenantId: string,
    desired: string,
    exceptId?: string,
  ) {
    let slug = toSlug(desired, uuid());
    let n = 0;
    while (true) {
      const clash = await this.prisma.category.findFirst({
        where: {
          tenantId,
          slug,
          ...(exceptId ? { NOT: { id: exceptId } } : {}),
        },
      });
      if (!clash) return slug;
      n += 1;
      slug = `${toSlug(desired, uuid())}-${n}`;
    }
  }

  private async uniqueProductSlug(
    tenantId: string,
    desired: string,
    exceptId?: string,
  ) {
    let slug = toSlug(desired, uuid());
    let n = 0;
    while (true) {
      const clash = await this.prisma.product.findFirst({
        where: {
          tenantId,
          slug,
          ...(exceptId ? { NOT: { id: exceptId } } : {}),
        },
      });
      if (!clash) return slug;
      n += 1;
      slug = `${toSlug(desired, uuid())}-${n}`;
    }
  }
}
