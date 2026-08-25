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
  canonicalizeOrderStatus,
  initialOrderStatus,
  initialPaymentStatus,
  isPaymentGatewayId,
  isPaymentMode,
  normalizePaymentGateway,
  normalizePaymentMode,
  resolveEffectivePrice,
  toSlug,
  type PaymentGatewayId,
  type PaymentMode,
} from './domain';
import { DiscountsService } from './discounts.service';
import { InventoryService } from './inventory.service';
import { VariantsService } from './variants.service';
import { CustomersService, type SalesChannel } from './customers.service';
import { PaymentsService } from './payments.service';
import { PaymentProviderResolver } from './payments/payment-provider-resolver.service';
import { OrderWorkflowService } from './order-workflow.service';
import { CartService } from './cart.service';
import { CheckoutSessionService } from './checkout-session.service';
import { CommerceEventsService } from './commerce-events.service';
import { isValidMobile, normalizePhone } from './phone';
import {
  getStorefrontTheme,
  isStorefrontThemeId,
  STOREFRONT_THEMES,
} from './storefront-themes';

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
    private readonly customers: CustomersService,
    private readonly payments: PaymentsService,
    private readonly paymentResolver: PaymentProviderResolver,
    private readonly workflow: OrderWorkflowService,
    private readonly carts: CartService,
    private readonly checkoutSessions: CheckoutSessionService,
    private readonly events: CommerceEventsService,
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
        where: {
          tenantId,
          status: { in: ['pending', 'pending_approval'] },
        },
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

  async listThemes() {
    return STOREFRONT_THEMES;
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
      themeId?: string;
      tagline?: string | null;
      codEnabled?: boolean;
      onlinePaymentEnabled?: boolean;
      supportPhone?: string | null;
      defaultCurrency?: string;
      lowStockThreshold?: number;
      allowNegativeInventory?: boolean;
      defaultProductStatus?: string;
      /** @deprecated Prefer PUT /shop/payment-settings — encrypted on write. */
      zarinpalMerchantId?: string | null;
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
    if (patch.themeId && !isStorefrontThemeId(patch.themeId)) {
      throw new BadRequestException('تم فروشگاه نامعتبر است');
    }
    const current = await this.prisma.storefrontSettings.findUniqueOrThrow({
      where: { tenantId },
    });
    if (patch.themeId && patch.themeId !== current.themeId) {
      const pack = getStorefrontTheme(patch.themeId);
      if (patch.primaryColor === undefined) {
        patch.primaryColor = pack.defaults.primaryColor;
      }
      if (patch.secondaryColor === undefined) {
        patch.secondaryColor = pack.defaults.secondaryColor;
      }
    }
    const nextCod = patch.codEnabled ?? current.codEnabled;
    const nextOnline =
      patch.onlinePaymentEnabled ?? current.onlinePaymentEnabled;
    if (!nextCod && !nextOnline) {
      throw new BadRequestException(
        'حداقل یکی از روش‌های پرداخت (در محل یا آنلاین) باید فعال باشد',
      );
    }
    const row = await this.prisma.storefrontSettings.update({
      where: { tenantId },
      data: {
        storeName: patch.storeName,
        storeSlug: patch.storeSlug,
        logoUrl: patch.logoUrl === undefined ? undefined : patch.logoUrl,
        primaryColor: patch.primaryColor,
        secondaryColor: patch.secondaryColor,
        themeId: patch.themeId,
        tagline: patch.tagline === undefined ? undefined : patch.tagline,
        codEnabled: patch.codEnabled,
        onlinePaymentEnabled: patch.onlinePaymentEnabled,
        supportPhone:
          patch.supportPhone === undefined ? undefined : patch.supportPhone,
        defaultCurrency: patch.defaultCurrency,
        lowStockThreshold: patch.lowStockThreshold,
        allowNegativeInventory: patch.allowNegativeInventory,
        defaultProductStatus: patch.defaultProductStatus,
        zarinpalMerchantId: this.encryptIncomingMerchantId(patch),
      },
    });
    return {
      ...this.mapSettings(row),
      storefrontUrl: `${this.storefrontBase()}/s/${row.storeSlug}`,
    };
  }

  async getPaymentSettings(tenantId: string) {
    const settings = await this.store.ensureStorefrontSettings(tenantId);
    return this.mapPaymentSettings(settings);
  }

  async updatePaymentSettings(
    tenantId: string,
    patch: {
      mode?: PaymentMode;
      provider?: PaymentGatewayId;
      onlinePaymentEnabled?: boolean;
      codEnabled?: boolean;
      merchantCredentials?: string | null;
      clearMerchantCredentials?: boolean;
    },
  ) {
    await this.store.ensureStorefrontSettings(tenantId);
    const current = await this.prisma.storefrontSettings.findUniqueOrThrow({
      where: { tenantId },
    });

    const nextMode = patch.mode
      ? patch.mode
      : normalizePaymentMode(
          current.paymentMode,
          Boolean(
            this.paymentResolver.decryptMerchantCredential(
              current.zarinpalMerchantId,
            ),
          ),
        );
    if (patch.mode && !isPaymentMode(patch.mode)) {
      throw new BadRequestException('حالت پرداخت نامعتبر است');
    }

    const nextGateway = patch.provider
      ? patch.provider
      : normalizePaymentGateway(nextMode, current.paymentProvider);
    if (patch.provider && !isPaymentGatewayId(patch.provider)) {
      throw new BadRequestException('درگاه پرداخت نامعتبر است');
    }
    if (nextMode === 'platform' && nextGateway !== 'seloma') {
      throw new BadRequestException(
        'در حالت سلومـا فقط درگاه پلتفرم قابل انتخاب است',
      );
    }
    if (nextMode === 'merchant' && nextGateway === 'seloma') {
      throw new BadRequestException(
        'در حالت درگاه اختصاصی، یک پذیرنده مثل زرین‌پال را انتخاب کنید',
      );
    }

    const nextCod = patch.codEnabled ?? current.codEnabled;
    const nextOnline =
      patch.onlinePaymentEnabled ?? current.onlinePaymentEnabled;
    if (!nextCod && !nextOnline) {
      throw new BadRequestException(
        'حداقل یکی از روش‌های پرداخت (در محل یا آنلاین) باید فعال باشد',
      );
    }

    let nextCipher: string | null | undefined = undefined;
    if (patch.clearMerchantCredentials) {
      nextCipher = null;
    } else if (
      patch.merchantCredentials !== undefined &&
      patch.merchantCredentials !== null
    ) {
      const plain = String(patch.merchantCredentials).trim();
      if (!plain) {
        throw new BadRequestException('کد پذیرنده خالی است');
      }
      nextCipher = this.paymentResolver.encryptMerchantCredential(plain);
    }

    if (
      nextMode === 'merchant' &&
      nextCipher === null &&
      !this.paymentResolver.decryptMerchantCredential(current.zarinpalMerchantId)
    ) {
      throw new BadRequestException(
        'برای حالت درگاه اختصاصی باید کد پذیرنده را وارد کنید',
      );
    }
    if (
      nextMode === 'merchant' &&
      nextCipher === undefined &&
      !this.paymentResolver.decryptMerchantCredential(current.zarinpalMerchantId)
    ) {
      throw new BadRequestException(
        'برای حالت درگاه اختصاصی باید کد پذیرنده را وارد کنید',
      );
    }

    const row = await this.prisma.storefrontSettings.update({
      where: { tenantId },
      data: {
        paymentMode: nextMode,
        paymentProvider: nextMode === 'platform' ? 'seloma' : nextGateway,
        onlinePaymentEnabled: patch.onlinePaymentEnabled,
        codEnabled: patch.codEnabled,
        zarinpalMerchantId: nextCipher,
      },
    });
    return this.mapPaymentSettings(row);
  }

  async testPaymentSettings(tenantId: string) {
    const settings = await this.store.ensureStorefrontSettings(tenantId);
    return this.paymentResolver.testConnection({
      tenantId: settings.tenantId,
      paymentMode: settings.paymentMode,
      paymentProvider: settings.paymentProvider,
      zarinpalMerchantId: settings.zarinpalMerchantId,
    });
  }

  private encryptIncomingMerchantId(patch: {
    zarinpalMerchantId?: string | null;
  }): string | null | undefined {
    if (!('zarinpalMerchantId' in patch)) return undefined;
    if (patch.zarinpalMerchantId == null || patch.zarinpalMerchantId === '') {
      return null;
    }
    return this.paymentResolver.encryptMerchantCredential(
      String(patch.zarinpalMerchantId),
    );
  }

  private mapPaymentSettings(row: {
    tenantId: string;
    paymentMode?: string | null;
    paymentProvider?: string | null;
    zarinpalMerchantId?: string | null;
    onlinePaymentEnabled?: boolean;
    codEnabled: boolean;
  }) {
    const creds = this.paymentResolver.credentialPublicView(
      row.zarinpalMerchantId,
    );
    const mode = normalizePaymentMode(
      row.paymentMode,
      creds.hasMerchantCredentials,
    );
    const provider = normalizePaymentGateway(mode, row.paymentProvider);
    return {
      mode,
      provider,
      onlinePaymentEnabled: row.onlinePaymentEnabled ?? false,
      codEnabled: row.codEnabled,
      hasMerchantCredentials: creds.hasMerchantCredentials,
      merchantCredentialHint: creds.merchantCredentialHint,
      availableModes: ['platform', 'merchant'] as const,
      availableProviders: {
        platform: ['seloma'] as const,
        merchant: ['zarinpal'] as const,
      },
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

  async getStorefrontOrder(tenantId: string, id: string) {
    return this.mapOrder(await this.workflow.get(tenantId, id));
  }

  async updateStorefrontOrderStatus(
    tenantId: string,
    id: string,
    status: string,
    actorUserId?: string | null,
  ) {
    const to = canonicalizeOrderStatus(status === 'confirmed' ? 'approved' : status);
    const existing = await this.prisma.storefrontOrder.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('سفارش پیدا نشد');

    if (
      canonicalizeOrderStatus(existing.status) === 'pending_payment' &&
      to === 'pending_approval'
    ) {
      return this.mapOrder(
        await this.workflow.markPaid(
          tenantId,
          id,
          existing.paymentRef ?? 'manual',
          actorUserId,
        ),
      );
    }
    if (
      canonicalizeOrderStatus(existing.status) === 'payment_failed' &&
      to === 'pending_approval'
    ) {
      return this.mapOrder(
        await this.workflow.markPaid(
          tenantId,
          id,
          existing.paymentRef ?? 'manual',
          actorUserId,
        ),
      );
    }

    return this.mapOrder(
      await this.workflow.transition({
        tenantId,
        orderId: id,
        to,
        actorUserId,
        reason: `status:${to}`,
      }),
    );
  }

  async approveStorefrontOrder(tenantId: string, id: string, actorUserId?: string | null) {
    return this.mapOrder(await this.workflow.approve(tenantId, id, actorUserId));
  }

  async rejectStorefrontOrder(
    tenantId: string,
    id: string,
    reason: string,
    actorUserId?: string | null,
  ) {
    return this.mapOrder(await this.workflow.reject(tenantId, id, reason, actorUserId));
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
    const [banners, categories, featured, articles] = await Promise.all([
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
        take: 24,
      }),
      this.prisma.article.findMany({
        where: { tenantId, status: 'published' },
        orderBy: { publishedAt: 'desc' },
        take: 8,
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
      articles: articles.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        featuredImageUrl: a.featuredImageUrl,
        publishedAt: a.publishedAt?.toISOString() ?? null,
      })),
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

  async publicArticles(storeSlug: string) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    const rows = await this.prisma.article.findMany({
      where: { tenantId: settings.tenantId, status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: 24,
    });
    return rows.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      featuredImageUrl: a.featuredImageUrl,
      publishedAt: a.publishedAt?.toISOString() ?? null,
    }));
  }

  async publicArticle(storeSlug: string, articleSlug: string) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    const row = await this.prisma.article.findFirst({
      where: {
        tenantId: settings.tenantId,
        slug: articleSlug,
        status: 'published',
      },
    });
    if (!row) throw new NotFoundException('مقاله پیدا نشد');
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      featuredImageUrl: row.featuredImageUrl,
      tags: row.tags,
      publishedAt: row.publishedAt?.toISOString() ?? null,
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
    return this.carts.getOrCreate(tenantId, sessionId);
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
    return this.carts.setItem(settings.tenantId, input);
  }

  async getCart(storeSlug: string, sessionId: string) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    return this.carts.getOrCreate(settings.tenantId, sessionId);
  }

  async createCheckoutSession(storeSlug: string, sessionId: string) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    return this.checkoutSessions.create({
      tenantId: settings.tenantId,
      sessionId,
      storeSlug: settings.storeSlug,
    });
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
      checkoutToken?: string;
    },
  ) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    const order = await this.placeOrder({
      tenantId: settings.tenantId,
      sessionId: body.sessionId,
      channel: 'website',
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      customerNote: body.customerNote,
      discountCode: body.discountCode,
      paymentMethod: body.paymentMethod,
      identityExternalId: body.sessionId,
      codEnabled: settings.codEnabled,
      onlinePaymentEnabled: settings.onlinePaymentEnabled,
    });
    await this.checkoutSessions.consume(body.checkoutToken);
    return order;
  }

  async placeOrder(input: {
    tenantId: string;
    sessionId: string;
    channel: SalesChannel;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerNote?: string;
    discountCode?: string;
    paymentMethod?: 'cod' | 'online';
    identityExternalId?: string | null;
    codEnabled: boolean;
    onlinePaymentEnabled: boolean;
  }) {
    const paymentMethod = input.paymentMethod ?? (input.codEnabled ? 'cod' : 'online');
    if (paymentMethod === 'cod' && !input.codEnabled) {
      throw new BadRequestException('پرداخت در محل برای این فروشگاه فعال نیست');
    }
    if (paymentMethod === 'online' && !input.onlinePaymentEnabled) {
      throw new BadRequestException(
        'پرداخت آنلاین برای این فروشگاه فعال نشده است',
      );
    }
    if (!isValidMobile(input.customerPhone) && normalizePhone(input.customerPhone).length < 8) {
      throw new BadRequestException('شماره موبایل نامعتبر است');
    }

    const cart = await this.prisma.cart.findUnique({
      where: {
        tenantId_sessionId: {
          tenantId: input.tenantId,
          sessionId: input.sessionId,
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
      const livePrice = resolveEffectivePrice({
        productPrice: Number(item.product.price),
        variantPrice:
          item.variant?.price != null ? Number(item.variant.price) : null,
      });
      const unitPrice =
        item.unitPriceSnapshot != null
          ? Number(item.unitPriceSnapshot)
          : livePrice;
      const title = item.variant
        ? `${item.product.title} (${item.variant.sku})`
        : item.product.title;
      const sku = item.variant?.sku ?? item.product.sku;
      return {
        item,
        unitPrice,
        title,
        sku,
        lineTotal:
          item.lineTotalSnapshot != null
            ? Number(item.lineTotalSnapshot)
            : unitPrice * item.quantity,
        categoryId: item.product.categoryId,
      };
    });

    for (const line of pricedLines) {
      if (line.item.variantId) {
        const level = line.item.variant?.inventoryLevel;
        const available = level ? availableStock(level) : 0;
        if (available < line.item.quantity) {
          throw new BadRequestException(`موجودی «${line.title}» کافی نیست`);
        }
      } else {
        const level = await this.prisma.inventoryLevel.findFirst({
          where: {
            tenantId: input.tenantId,
            productId: line.item.productId,
            variantId: null,
          },
        });
        if (level) {
          const available = availableStock(level);
          if (available > 0 && available < line.item.quantity) {
            throw new BadRequestException(`موجودی «${line.title}» کافی نیست`);
          }
          if (available <= 0 && !line.item.product.inStock) {
            throw new BadRequestException(
              `محصول «${line.item.product.title}» ناموجود است`,
            );
          }
        } else if (!line.item.product.inStock) {
          throw new BadRequestException(
            `محصول «${line.item.product.title}» ناموجود است`,
          );
        }
      }
    }

    const customer = await this.customers.upsertFromCheckout({
      tenantId: input.tenantId,
      name: input.customerName,
      phone: input.customerPhone,
      address: input.customerAddress,
      channel: input.channel,
      externalId: input.identityExternalId ?? input.sessionId,
    });

    const subtotal = pricedLines.reduce((sum, l) => sum + l.lineTotal, 0);
    const discountCode = input.discountCode?.trim() || null;
    let discountAmount = 0;
    let appliedDiscountId: string | null = null;

    if (discountCode) {
      const applied = await this.computeCartDiscount(
        input.tenantId,
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
    const status = initialOrderStatus(paymentMethod);
    const paymentStatus = initialPaymentStatus(paymentMethod);

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.storefrontOrder.create({
        data: {
          tenantId: input.tenantId,
          orderNumber,
          status,
          paymentStatus,
          channel: input.channel,
          paymentMethod,
          subtotalAmount: new Prisma.Decimal(subtotal),
          discountCode,
          discountAmount: new Prisma.Decimal(discountAmount),
          totalAmount: new Prisma.Decimal(total),
          currency: cart.items[0]?.product.currency ?? 'IRR',
          customerId: customer.id,
          customerName: input.customerName.trim(),
          customerPhone: normalizePhone(input.customerPhone),
          customerAddress: input.customerAddress.trim(),
          customerNote: input.customerNote?.trim() || null,
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

      const decrementLines = pricedLines
        .filter((l) => {
          if (l.item.variantId) {
            const avail = l.item.variant?.inventoryLevel
              ? availableStock(l.item.variant.inventoryLevel)
              : 0;
            return avail > 0;
          }
          return true;
        })
        .map((l) => ({
          productId: l.item.productId,
          variantId: l.item.variantId,
          quantity: l.item.quantity,
          title: l.title,
        }));

      const productIds = await this.inventory.decrementInTx(
        tx,
        input.tenantId,
        decrementLines,
        { orderId: created.id, orderNumber },
      );

      await this.carts.markConverted(tx, cart.id, customer.id);
      await this.workflow.recordCreated(tx, {
        tenantId: input.tenantId,
        orderId: created.id,
        status,
        paymentStatus,
      });
      return { created, productIds };
    });

    for (const productId of order.productIds) {
      await this.inventory.refreshProductProjection(input.tenantId, productId);
    }

    let payUrl: string | null = null;
    let paymentHint: string | null = null;
    if (paymentMethod === 'online') {
      const pay = await this.payments.startPayment({
        tenantId: input.tenantId,
        orderId: order.created.id,
        description: `سفارش ${orderNumber}`,
      });
      payUrl = pay.payUrl;
      paymentHint = pay.mocked
        ? 'پرداخت آزمایشی — لینک mock برای محیط توسعه'
        : 'برای تکمیل خرید لینک درگاه را باز کنید';
    }

    await this.events.track({
      tenantId: input.tenantId,
      name: 'order_created',
      channel: input.channel,
      customerId: customer.id,
      orderId: order.created.id,
    });

    return {
      ...this.mapOrder(order.created),
      customerId: customer.id,
      paymentHint,
      payUrl,
    };
  }

  async lookupCustomer(storeSlug: string, phone: string) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    return this.customers.lookupByPhone(settings.tenantId, phone);
  }

  async registerCustomer(
    storeSlug: string,
    body: {
      name: string;
      phone: string;
      address: string;
      sessionId?: string;
    },
  ) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    return this.customers.register({
      tenantId: settings.tenantId,
      name: body.name,
      phone: body.phone,
      address: body.address,
      sessionId: body.sessionId,
    });
  }

  async setCartItemForTenant(
    tenantId: string,
    input: {
      sessionId: string;
      productId: string;
      variantId?: string | null;
      quantity: number;
    },
  ) {
    const settings = await this.prisma.storefrontSettings.findUnique({
      where: { tenantId },
    });
    if (!settings) throw new NotFoundException('فروشگاه پیدا نشد');
    return this.setCartItem(settings.storeSlug, input);
  }

  async paymentOptions(tenantId: string) {
    const settings = await this.store.ensureStorefrontSettings(tenantId);
    return {
      storeSlug: settings.storeSlug,
      storeName: settings.storeName,
      codEnabled: settings.codEnabled,
      onlinePaymentEnabled: settings.onlinePaymentEnabled,
      paymentMode: settings.paymentMode,
      paymentProvider: settings.paymentProvider,
    };
  }

  async lookupStorefrontOrder(
    tenantId: string,
    orderNumber: string,
    phoneLast4?: string | null,
  ) {
    const normalized = orderNumber.trim().toUpperCase();
    const order = await this.prisma.storefrontOrder.findFirst({
      where: { tenantId, orderNumber: { equals: normalized, mode: 'insensitive' } },
      include: { items: true },
    });
    if (!order) return null;
    if (phoneLast4 && order.customerPhone.slice(-4) !== phoneLast4) {
      return { found: true as const, verified: false as const, order: this.mapOrder(order) };
    }
    return { found: true as const, verified: !phoneLast4 ? false as const : true as const, order: this.mapOrder(order) };
  }

  async hasNativeCatalog(tenantId: string) {
    const count = await this.prisma.product.count({
      where: {
        tenantId,
        status: 'published',
        source: { in: ['native', 'mock'] },
      },
    });
    return count > 0;
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
        orderNumber: { equals: orderNumber.trim(), mode: 'insensitive' },
        customerPhone: normalizePhone(phone),
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
    themeId?: string;
    tagline: string | null;
    codEnabled: boolean;
    onlinePaymentEnabled?: boolean;
    supportPhone: string | null;
    defaultCurrency?: string;
    lowStockThreshold?: number;
    allowNegativeInventory?: boolean;
    defaultProductStatus?: string;
    zarinpalMerchantId?: string | null;
    paymentMode?: string | null;
    paymentProvider?: string | null;
  }) {
    const payment = this.mapPaymentSettings(row);
    return {
      id: row.id,
      tenantId: row.tenantId,
      storeName: row.storeName,
      storeSlug: row.storeSlug,
      logoUrl: row.logoUrl,
      primaryColor: row.primaryColor,
      secondaryColor: row.secondaryColor,
      themeId: row.themeId ?? 'zi-home',
      tagline: row.tagline,
      codEnabled: row.codEnabled,
      onlinePaymentEnabled: row.onlinePaymentEnabled ?? false,
      paymentMode: payment.mode,
      paymentProvider: payment.provider,
      hasMerchantCredentials: payment.hasMerchantCredentials,
      merchantCredentialHint: payment.merchantCredentialHint,
      /** @deprecated Never returns the secret — use merchantCredentialHint. */
      zarinpalMerchantId: null,
      supportPhone: row.supportPhone,
      defaultCurrency: row.defaultCurrency ?? 'IRR',
      lowStockThreshold: row.lowStockThreshold ?? 5,
      allowNegativeInventory: row.allowNegativeInventory ?? false,
      defaultProductStatus: row.defaultProductStatus ?? 'draft',
    };
  }

  private mapOrder(row: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus?: string;
    channel?: string;
    paymentMethod: string;
    paymentRef?: string | null;
    rejectionReason?: string | null;
    subtotalAmount?: Prisma.Decimal;
    discountCode?: string | null;
    discountAmount?: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
    currency: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerNote: string | null;
    customerId?: string | null;
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
    history?: Array<{
      id: string;
      fromStatus: string;
      toStatus: string;
      paymentStatus: string | null;
      reason: string | null;
      actorUserId: string | null;
      createdAt: Date;
    }>;
  }) {
    return {
      id: row.id,
      orderNumber: row.orderNumber,
      status: (() => {
        try {
          return canonicalizeOrderStatus(
            row.status === 'confirmed' ? 'approved' : row.status,
          );
        } catch {
          return row.status;
        }
      })(),
      paymentStatus: row.paymentStatus ?? 'unpaid',
      channel: row.channel ?? 'website',
      paymentMethod: row.paymentMethod,
      paymentRef: row.paymentRef ?? null,
      rejectionReason: row.rejectionReason ?? null,
      subtotalAmount: Number(row.subtotalAmount ?? row.totalAmount),
      discountCode: row.discountCode ?? null,
      discountAmount: Number(row.discountAmount ?? 0),
      totalAmount: Number(row.totalAmount),
      currency: row.currency,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerAddress: row.customerAddress,
      customerNote: row.customerNote,
      customerId: row.customerId ?? null,
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
      history: (row.history ?? []).map((h) => ({
        id: h.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        paymentStatus: h.paymentStatus,
        reason: h.reason,
        actorUserId: h.actorUserId,
        createdAt: h.createdAt.toISOString(),
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
