import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { DataStore } from '../platform/data.store';
import { PrismaService } from '../platform/prisma.service';

function toSlug(input: string, fallback: string): string {
  const ascii = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  if (ascii) return ascii;
  return `item-${fallback.slice(0, 8)}`;
}

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
    createdAt: row.createdAt?.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
  };
}

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly store: DataStore,
  ) {}

  private storefrontBase() {
    return (
      process.env.STOREFRONT_BASE_URL ?? 'http://localhost:3020'
    ).replace(/\/$/, '');
  }

  // ─── Settings / overview ───────────────────────────────────────────

  async getOverview(tenantId: string) {
    const settings = await this.store.ensureStorefrontSettings(tenantId);
    const [productCount, categoryCount, orderCount, pendingOrders] =
      await Promise.all([
        this.prisma.product.count({
          where: { tenantId, source: 'native' },
        }),
        this.prisma.category.count({ where: { tenantId } }),
        this.prisma.storefrontOrder.count({ where: { tenantId } }),
        this.prisma.storefrontOrder.count({
          where: { tenantId, status: 'pending' },
        }),
      ]);
    return {
      settings: this.mapSettings(settings),
      storefrontUrl: `${this.storefrontBase()}/s/${settings.storeSlug}`,
      stats: { productCount, categoryCount, orderCount, pendingOrders },
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
      supportPhone?: string | null;
    },
  ) {
    await this.store.ensureStorefrontSettings(tenantId);
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
        supportPhone:
          patch.supportPhone === undefined ? undefined : patch.supportPhone,
      },
    });
    return {
      ...this.mapSettings(row),
      storefrontUrl: `${this.storefrontBase()}/s/${row.storeSlug}`,
    };
  }

  // ─── Categories ────────────────────────────────────────────────────

  async listCategories(tenantId: string) {
    const rows = await this.prisma.category.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((r) => ({
      id: r.id,
      parentId: r.parentId,
      name: r.name,
      slug: r.slug,
      imageUrl: r.imageUrl,
      sortOrder: r.sortOrder,
    }));
  }

  async createCategory(
    tenantId: string,
    body: {
      name?: string;
      slug?: string;
      parentId?: string | null;
      imageUrl?: string | null;
      sortOrder?: number;
    },
  ) {
    const name = (body.name ?? '').trim();
    if (!name) throw new BadRequestException('نام دسته الزامی است');
    const slug = await this.uniqueCategorySlug(
      tenantId,
      body.slug || toSlug(name, uuid()),
    );
    const row = await this.prisma.category.create({
      data: {
        tenantId,
        name,
        slug,
        parentId: body.parentId || null,
        imageUrl: body.imageUrl || null,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return {
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      slug: row.slug,
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
    };
  }

  async updateCategory(
    tenantId: string,
    id: string,
    body: {
      name?: string;
      slug?: string;
      parentId?: string | null;
      imageUrl?: string | null;
      sortOrder?: number;
    },
  ) {
    const existing = await this.prisma.category.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('دسته پیدا نشد');
    let slug = existing.slug;
    if (body.slug) {
      slug = await this.uniqueCategorySlug(tenantId, body.slug, id);
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
      },
    });
    return {
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      slug: row.slug,
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
    };
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

  // ─── Products CMS ──────────────────────────────────────────────────

  async listCmsProducts(tenantId: string, source?: string) {
    const rows = await this.prisma.product.findMany({
      where: {
        tenantId,
        source: source ?? 'native',
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map(mapProduct);
  }

  async createNativeProduct(
    tenantId: string,
    body: {
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
    },
  ) {
    const sku = (body.sku ?? '').trim();
    const title = (body.title ?? '').trim();
    if (!sku) throw new BadRequestException('SKU الزامی است');
    if (!title) throw new BadRequestException('عنوان الزامی است');
    if (body.price == null || Number.isNaN(body.price)) {
      throw new BadRequestException('قیمت الزامی است');
    }
    const slug = await this.uniqueProductSlug(
      tenantId,
      body.slug || toSlug(title, sku),
    );
    try {
      const row = await this.prisma.product.create({
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
          currency: body.currency ?? 'IRR',
          inStock: body.inStock ?? true,
          description: body.description ?? null,
          images: body.images ?? [],
          categoryId: body.categoryId || null,
          status: body.status ?? 'published',
          source: 'native',
        },
      });
      return mapProduct(row);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('SKU یا اسلاگ تکراری است');
      }
      throw e;
    }
  }

  async updateNativeProduct(
    tenantId: string,
    id: string,
    body: {
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
    },
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
    let slug = existing.slug;
    if (body.slug) slug = await this.uniqueProductSlug(tenantId, body.slug, id);
    const row = await this.prisma.product.update({
      where: { id },
      data: {
        sku: body.sku?.trim() ?? existing.sku,
        slug,
        title: body.title?.trim() ?? existing.title,
        price:
          body.price != null ? new Prisma.Decimal(body.price) : existing.price,
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
      },
    });
    return mapProduct(row);
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
    return mapProduct(row);
  }

  async getOrCreateCart(tenantId: string, sessionId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { tenantId_sessionId: { tenantId, sessionId } },
      include: { items: { include: { product: true } } },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { tenantId, sessionId },
        include: { items: { include: { product: true } } },
      });
    }
    return this.mapCart(cart);
  }

  async setCartItem(
    storeSlug: string,
    sessionId: string,
    productId: string,
    quantity: number,
  ) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    const tenantId = settings.tenantId;
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
    let cart = await this.prisma.cart.findUnique({
      where: { tenantId_sessionId: { tenantId, sessionId } },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { tenantId, sessionId },
      });
    }
    if (quantity <= 0) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
      });
    } else {
      await this.prisma.cartItem.upsert({
        where: {
          cartId_productId: { cartId: cart.id, productId },
        },
        create: { cartId: cart.id, productId, quantity },
        update: { quantity },
      });
    }
    const full = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });
    return this.mapCart(full);
  }

  async getCart(storeSlug: string, sessionId: string) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    return this.getOrCreateCart(settings.tenantId, sessionId);
  }

  async checkout(
    storeSlug: string,
    body: {
      sessionId: string;
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      customerNote?: string;
    },
  ) {
    const settings = await this.resolveTenantBySlug(storeSlug);
    if (!settings.codEnabled) {
      throw new BadRequestException('پرداخت در محل برای این فروشگاه فعال نیست');
    }
    const cart = await this.prisma.cart.findUnique({
      where: {
        tenantId_sessionId: {
          tenantId: settings.tenantId,
          sessionId: body.sessionId,
        },
      },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('سبد خرید خالی است');
    }
    for (const item of cart.items) {
      if (!item.product.inStock) {
        throw new BadRequestException(
          `محصول «${item.product.title}» ناموجود است`,
        );
      }
    }
    const total = cart.items.reduce(
      (sum, i) => sum + Number(i.product.price) * i.quantity,
      0,
    );
    const orderNumber = `SF-${Date.now().toString(36).toUpperCase()}`;
    const order = await this.prisma.storefrontOrder.create({
      data: {
        tenantId: settings.tenantId,
        orderNumber,
        status: 'pending',
        paymentMethod: 'cod',
        totalAmount: new Prisma.Decimal(total),
        currency: cart.items[0]?.product.currency ?? 'IRR',
        customerName: body.customerName.trim(),
        customerPhone: body.customerPhone.trim(),
        customerAddress: body.customerAddress.trim(),
        customerNote: body.customerNote?.trim() || null,
        items: {
          create: cart.items.map((i) => ({
            productId: i.productId,
            sku: i.product.sku,
            title: i.product.title,
            unitPrice: i.product.price,
            quantity: i.quantity,
            lineTotal: new Prisma.Decimal(
              Number(i.product.price) * i.quantity,
            ),
          })),
        },
      },
      include: { items: true },
    });
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.mapOrder(order);
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
    supportPhone: string | null;
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
      supportPhone: row.supportPhone,
    };
  }

  private mapCart(cart: {
    id: string;
    sessionId: string;
    items: Array<{
      id: string;
      quantity: number;
      product: {
        id: string;
        sku: string;
        slug: string;
        title: string;
        price: Prisma.Decimal;
        currency: string;
        inStock: boolean;
        images: string[];
      };
    }>;
  }) {
    const items = cart.items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      product: {
        id: i.product.id,
        sku: i.product.sku,
        slug: i.product.slug,
        title: i.product.title,
        price: Number(i.product.price),
        currency: i.product.currency,
        inStock: i.product.inStock,
        images: i.product.images,
      },
      lineTotal: Number(i.product.price) * i.quantity,
    }));
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
    }>;
  }) {
    return {
      id: row.id,
      orderNumber: row.orderNumber,
      status: row.status,
      paymentMethod: row.paymentMethod,
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
