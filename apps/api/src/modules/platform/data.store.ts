import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { PrismaService } from './prisma.service';
import type {
  AdminAuditEvent,
  AuditTurn,
  ChannelBinding,
  Conversation,
  Employee,
  EmployeeGuardrails,
  EscalationReason,
  HandoffPacket,
  KnowledgeChunk,
  KnowledgeDoc,
  Membership,
  Message,
  OrderRecord,
  Product,
  Session,
  StoreConnection,
  Tenant,
  User,
} from './types';
import { DEFAULT_GUARDRAILS, normalizeGuardrails } from './types';
import type { SyncHealth } from './types';
type EmployeeSkills = Employee['skills'];

/**
 * Postgres-backed SoR (Database Design). All merchant queries are tenant-scoped.
 * Module boundaries unchanged — services call this instead of MemoryStore.
 */
@Injectable()
export class DataStore implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const email = 'demo@delorey.local';
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await this.seedDemo(email);
    } else {
      const membership = await this.prisma.workspaceMembership.findFirst({
        where: { userId: existing.id },
      });
      if (membership) {
        await this.provisionTenantDefaults(membership.tenantId);
        await this.seedDefaultKnowledge(membership.tenantId);
        await this.seedDefaultOrders(membership.tenantId);
        await this.ensureOrderStatusSkill(membership.tenantId);
      }
    }
  }

  private async seedDemo(email: string) {
    const userId = uuid();
    const tenantId = uuid();
    const passwordHash = await bcrypt.hash('demo1234', 8);
    await this.prisma.user.create({
      data: { id: userId, email, passwordHash },
    });
    await this.prisma.tenant.create({
      data: {
        id: tenantId,
        name: 'فروشگاه دمو',
        ownerUserId: userId,
      },
    });
    await this.prisma.workspaceMembership.create({
      data: { userId, tenantId, role: 'owner' },
    });
    await this.provisionTenantDefaults(tenantId);
  }

  async provisionTenantDefaults(tenantId: string) {
    const existingEmployee = await this.prisma.employee.findFirst({
      where: { tenantId },
    });
    if (!existingEmployee) {
      await this.prisma.employee.create({
        data: {
          tenantId,
          name: 'کارمند فروش',
          tone: 'مودب و مستقیم',
          language: 'fa',
          status: 'active',
          skills: {
            product_search: true,
            recommend: true,
            order_status: true,
            escalate: true,
          } satisfies EmployeeSkills,
          guardrails: DEFAULT_GUARDRAILS as unknown as Prisma.InputJsonValue,
        },
      });
    } else if (existingEmployee.guardrails == null) {
      await this.prisma.employee.update({
        where: { id: existingEmployee.id },
        data: {
          guardrails: DEFAULT_GUARDRAILS as unknown as Prisma.InputJsonValue,
        },
      });
    }

    await this.prisma.storeConnection.upsert({
      where: { tenantId },
      create: {
        tenantId,
        platform: 'mock',
        syncHealth: 'healthy',
        lastSyncAt: new Date(),
        failureReason: null,
      },
      update: {
        syncHealth: 'healthy',
        lastSyncAt: new Date(),
        failureReason: null,
      },
    });

    const catalog = [
      {
        sku: 'SHIRT-001',
        slug: 'linen-blue-shirt',
        title: 'پیراهن لینن آبی',
        price: 890000,
        currency: 'IRR',
        inStock: true,
        description: 'سایزهای M و L موجود',
        source: 'native',
        status: 'published',
        images: [] as string[],
      },
      {
        sku: 'BAG-014',
        slug: 'black-leather-bag',
        title: 'کیف چرمی مشکی',
        price: 2450000,
        currency: 'IRR',
        inStock: true,
        description: null as string | null,
        source: 'native',
        status: 'published',
        images: [] as string[],
      },
      {
        sku: 'SHOE-220',
        slug: 'white-sport-shoes',
        title: 'کفش اسپرت سفید',
        price: 1750000,
        currency: 'IRR',
        inStock: false,
        description: 'فعلاً ناموجود',
        source: 'native',
        status: 'published',
        images: [] as string[],
      },
    ];

    for (const item of catalog) {
      await this.prisma.product.upsert({
        where: { tenantId_sku: { tenantId, sku: item.sku } },
        create: { tenantId, ...item },
        update: {
          title: item.title,
          slug: item.slug,
          price: item.price,
          currency: item.currency,
          inStock: item.inStock,
          description: item.description,
          source: item.source,
          status: item.status,
        },
      });
    }

    await this.ensureStorefrontSettings(tenantId);

    const publicKey = `pk_live_${tenantId.slice(0, 8)}`;
    await this.prisma.channelBinding.upsert({
      where: { tenantId_channel: { tenantId, channel: 'website' } },
      create: {
        tenantId,
        channel: 'website',
        status: 'connected',
        publicKey,
        allowedOrigins: [
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:3020',
          'http://127.0.0.1:3020',
        ],
      },
      // Do not reset merchant-configured origins on re-provision
      update: {
        status: 'connected',
      },
    });

    await this.seedDefaultKnowledge(tenantId);
    await this.seedDefaultOrders(tenantId);
  }

  async ensureOrderStatusSkill(tenantId: string): Promise<void> {
    const employee = await this.prisma.employee.findFirst({
      where: { tenantId },
    });
    if (!employee) return;
    const skills = employee.skills as EmployeeSkills;
    if (skills.order_status) return;
    await this.prisma.employee.update({
      where: { id: employee.id },
      data: { skills: { ...skills, order_status: true } },
    });
  }

  async seedDefaultOrders(tenantId: string): Promise<void> {
    const defaults = [
      {
        externalId: 'ext-1001',
        orderNumber: 'DR-1001',
        status: 'shipped',
        trackingCode: 'TRK-77881',
        totalAmount: new Prisma.Decimal(4_500_000),
        currency: 'IRR',
        customerPhoneLast4: '1234',
        customerEmail: 'buyer@example.com',
      },
      {
        externalId: 'ext-1002',
        orderNumber: 'DR-1002',
        status: 'processing',
        trackingCode: null as string | null,
        totalAmount: new Prisma.Decimal(1_200_000),
        currency: 'IRR',
        customerPhoneLast4: '5678',
        customerEmail: 'other@example.com',
      },
    ];
    for (const item of defaults) {
      await this.prisma.order.upsert({
        where: {
          tenantId_orderNumber: {
            tenantId,
            orderNumber: item.orderNumber,
          },
        },
        create: {
          tenantId,
          ...item,
          syncedAt: new Date(),
        },
        update: {
          status: item.status,
          trackingCode: item.trackingCode,
          totalAmount: item.totalAmount,
          currency: item.currency,
          customerPhoneLast4: item.customerPhoneLast4,
          customerEmail: item.customerEmail,
          syncedAt: new Date(),
        },
      });
    }
  }

  async findOrderByNumber(
    tenantId: string,
    orderNumber: string,
  ): Promise<OrderRecord | null> {
    const row = await this.prisma.order.findUnique({
      where: {
        tenantId_orderNumber: {
          tenantId,
          orderNumber: orderNumber.toUpperCase(),
        },
      },
    });
    return row ? this.mapOrder(row) : null;
  }

  async listOrders(tenantId: string): Promise<OrderRecord[]> {
    const rows = await this.prisma.order.findMany({
      where: { tenantId },
      orderBy: { orderNumber: 'asc' },
    });
    return rows.map((r) => this.mapOrder(r));
  }

  async seedDefaultKnowledge(tenantId: string): Promise<void> {
    const count = await this.prisma.knowledgeDoc.count({ where: { tenantId } });
    if (count > 0) return;
    const defaults: Array<{
      docType: KnowledgeDoc['docType'];
      title: string;
      bodyText: string;
      sourceAttribution: string;
    }> = [
      {
        docType: 'faq',
        title: 'شرایط بازگشت کالا',
        bodyText:
          'مشتری تا ۷ روز پس از تحویل می‌تواند کالا را با برچسب سالم برگرداند. هزینه ارسال بازگشت بر عهده مشتری است مگر نقص ساخت.',
        sourceAttribution: 'سیاست فروشگاه دمو — بازگشت',
      },
      {
        docType: 'policy_override',
        title: 'هزینه ارسال',
        bodyText:
          'ارسال به تهران رایگان برای خرید بالای ۲ میلیون ریال؛ سایر شهرها طبق نرخ پست پیشتاز در چک‌اوت محاسبه می‌شود. پرداخت در محل (COD) برای تهران فعال است.',
        sourceAttribution: 'سیاست فروشگاه دمو — ارسال',
      },
    ];
    for (const item of defaults) {
      const exists = await this.prisma.knowledgeDoc.findFirst({
        where: { tenantId, title: item.title },
      });
      if (exists) continue;
      await this.createKnowledgeDoc({
        tenantId,
        docType: item.docType,
        title: item.title,
        bodyText: item.bodyText,
        sourceAttribution: item.sourceAttribution,
      });
    }
  }

  async createUser(user: Omit<User, 'createdAt'>): Promise<User> {
    const row = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
      },
    });
    return this.mapUser(row);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.mapUser(row) : null;
  }

  async findUserById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.mapUser(row) : null;
  }

  async createTenant(
    tenant: Omit<Tenant, 'createdAt'> & {
      plan?: string;
      billingStatus?: string;
    },
  ): Promise<Tenant> {
    const row = await this.prisma.tenant.create({
      data: {
        id: tenant.id,
        name: tenant.name,
        ownerUserId: tenant.ownerUserId,
        plan: tenant.plan ?? 'trial',
        billingStatus: tenant.billingStatus ?? 'trial',
      },
    });
    return this.mapTenant(row);
  }

  async findTenant(id: string): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findUnique({ where: { id } });
    return row ? this.mapTenant(row) : null;
  }

  async addMembership(membership: Membership): Promise<void> {
    await this.prisma.workspaceMembership.create({ data: membership });
  }

  async findMembershipByUser(userId: string): Promise<Membership | null> {
    const row = await this.prisma.workspaceMembership.findFirst({
      where: { userId },
    });
    return row
      ? { userId: row.userId, tenantId: row.tenantId, role: row.role as Membership['role'] }
      : null;
  }

  async createSession(session: Session): Promise<void> {
    await this.prisma.session.create({
      data: {
        token: session.token,
        userId: session.userId,
        tenantId: session.tenantId,
        expiresAt: new Date(session.expiresAt),
      },
    });
  }

  async findSession(token: string): Promise<Session | null> {
    const row = await this.prisma.session.findUnique({ where: { token } });
    if (!row) return null;
    return {
      token: row.token,
      userId: row.userId,
      tenantId: row.tenantId,
      expiresAt: row.expiresAt.toISOString(),
    };
  }

  async getStore(tenantId: string): Promise<StoreConnection | null> {
    const row = await this.prisma.storeConnection.findUnique({
      where: { tenantId },
    });
    return row ? this.mapStore(row) : null;
  }

  async getStoreById(id: string): Promise<StoreConnection | null> {
    const row = await this.prisma.storeConnection.findUnique({ where: { id } });
    return row ? this.mapStore(row) : null;
  }

  async getStoreByShopDomain(
    shopDomain: string,
  ): Promise<StoreConnection | null> {
    const row = await this.prisma.storeConnection.findFirst({
      where: { shopDomain, platform: 'shopify' },
    });
    return row ? this.mapStore(row) : null;
  }

  async upsertHealthyStore(tenantId: string): Promise<StoreConnection> {
    const row = await this.prisma.storeConnection.upsert({
      where: { tenantId },
      create: {
        tenantId,
        platform: 'mock',
        syncHealth: 'healthy',
        lastSyncAt: new Date(),
        failureReason: null,
      },
      update: {
        syncHealth: 'healthy',
        lastSyncAt: new Date(),
        failureReason: null,
      },
    });
    return this.mapStore(row);
  }

  async getStoreCredentialsCipher(tenantId: string): Promise<string | null> {
    const row = await this.prisma.storeConnection.findUnique({
      where: { tenantId },
      select: { credentialsCipher: true },
    });
    return row?.credentialsCipher ?? null;
  }

  async upsertShopifyConnection(input: {
    tenantId: string;
    shopDomain: string;
    externalShopId: string | null;
    credentialsCipher: string;
    syncHealth: SyncHealth;
    failureReason: string | null;
    lastSyncAt: Date | null;
  }): Promise<StoreConnection> {
    return this.upsertPlatformConnection({ ...input, platform: 'shopify' });
  }

  async upsertPlatformConnection(input: {
    tenantId: string;
    platform: 'shopify' | 'woocommerce';
    shopDomain: string;
    externalShopId: string | null;
    credentialsCipher: string;
    syncHealth: SyncHealth;
    failureReason: string | null;
    lastSyncAt: Date | null;
  }): Promise<StoreConnection> {
    const row = await this.prisma.storeConnection.upsert({
      where: { tenantId: input.tenantId },
      create: {
        tenantId: input.tenantId,
        platform: input.platform,
        shopDomain: input.shopDomain,
        externalShopId: input.externalShopId,
        credentialsCipher: input.credentialsCipher,
        syncHealth: input.syncHealth,
        lastSyncAt: input.lastSyncAt,
        failureReason: input.failureReason,
      },
      update: {
        platform: input.platform,
        shopDomain: input.shopDomain,
        externalShopId: input.externalShopId,
        credentialsCipher: input.credentialsCipher,
        syncHealth: input.syncHealth,
        lastSyncAt: input.lastSyncAt,
        failureReason: input.failureReason,
      },
    });
    return this.mapStore(row);
  }

  async markStoreSyncResult(
    tenantId: string,
    result: {
      syncHealth: SyncHealth;
      failureReason: string | null;
      lastSyncAt?: Date | null;
    },
  ): Promise<StoreConnection> {
    const row = await this.prisma.storeConnection.update({
      where: { tenantId },
      data: {
        syncHealth: result.syncHealth,
        failureReason: result.failureReason,
        ...(result.lastSyncAt !== undefined
          ? { lastSyncAt: result.lastSyncAt }
          : {}),
      },
    });
    return this.mapStore(row);
  }

  /**
   * Replace synced (non-native) catalog rows. Native CMS products are preserved.
   */
  async replaceCatalog(
    tenantId: string,
    products: Array<{
      externalId: string;
      sku: string;
      title: string;
      price: number;
      currency: string;
      inStock: boolean;
      description: string | null;
    }>,
    source: 'shopify' | 'woocommerce' | 'mock' = 'shopify',
  ): Promise<number> {
    await this.prisma.product.deleteMany({
      where: { tenantId, source: { not: 'native' } },
    });
    if (products.length === 0) return 0;
    await this.prisma.product.createMany({
      data: products.map((p) => ({
        tenantId,
        externalId: p.externalId,
        sku: p.sku,
        slug: this.slugFromSku(p.sku, p.externalId),
        title: p.title,
        price: new Prisma.Decimal(p.price),
        currency: p.currency,
        inStock: p.inStock,
        description: p.description,
        source,
        status: 'published',
        images: [],
      })),
    });
    return products.length;
  }

  async replaceOrders(
    tenantId: string,
    orders: Array<{
      externalId: string;
      orderNumber: string;
      status: string;
      trackingCode: string | null;
      totalAmount: number;
      currency: string;
      customerPhoneLast4: string;
      customerEmail: string | null;
    }>,
  ): Promise<number> {
    await this.prisma.order.deleteMany({ where: { tenantId } });
    if (orders.length === 0) return 0;
    const now = new Date();
    await this.prisma.order.createMany({
      data: orders.map((o) => ({
        tenantId,
        externalId: o.externalId,
        orderNumber: o.orderNumber,
        status: o.status,
        trackingCode: o.trackingCode,
        totalAmount: new Prisma.Decimal(o.totalAmount),
        currency: o.currency,
        customerPhoneLast4: o.customerPhoneLast4,
        customerEmail: o.customerEmail,
        syncedAt: now,
      })),
    });
    return orders.length;
  }

  async upsertSyncedProduct(
    tenantId: string,
    product: {
      externalId: string;
      sku: string;
      title: string;
      price: number;
      currency: string;
      inStock: boolean;
      description: string | null;
    },
    source: 'shopify' | 'woocommerce' | 'mock' = 'shopify',
  ): Promise<void> {
    const existing = await this.prisma.product.findFirst({
      where: { tenantId, externalId: product.externalId },
    });
    const slug = this.slugFromSku(product.sku, product.externalId);
    if (existing) {
      await this.prisma.product.update({
        where: { id: existing.id },
        data: {
          sku: product.sku,
          slug: existing.source === 'native' ? existing.slug : slug,
          title: product.title,
          price: new Prisma.Decimal(product.price),
          currency: product.currency,
          inStock: product.inStock,
          description: product.description,
          source: existing.source === 'native' ? 'native' : source,
          status: 'published',
        },
      });
      return;
    }
    const skuTaken = await this.prisma.product.findUnique({
      where: { tenantId_sku: { tenantId, sku: product.sku } },
    });
    const sku = skuTaken
      ? `${product.sku}-${product.externalId}`.slice(0, 64)
      : product.sku;
    await this.prisma.product.create({
      data: {
        tenantId,
        externalId: product.externalId,
        sku,
        slug: this.slugFromSku(sku, product.externalId),
        title: product.title,
        price: new Prisma.Decimal(product.price),
        currency: product.currency,
        inStock: product.inStock,
        description: product.description,
        source,
        status: 'published',
        images: [],
      },
    });
  }

  async deleteProductsByProductExternalPrefix(
    tenantId: string,
    productId: string,
  ): Promise<number> {
    const result = await this.prisma.product.deleteMany({
      where: {
        tenantId,
        OR: [
          { externalId: { startsWith: `${productId}:` } },
          { externalId: productId },
          { sku: { startsWith: `SHP-${productId}-` } },
        ],
      },
    });
    return result.count;
  }

  async upsertSyncedOrder(
    tenantId: string,
    order: {
      externalId: string;
      orderNumber: string;
      status: string;
      trackingCode: string | null;
      totalAmount: number;
      currency: string;
      customerPhoneLast4: string;
      customerEmail: string | null;
    },
  ): Promise<void> {
    const now = new Date();
    const byExternal = await this.prisma.order.findUnique({
      where: {
        tenantId_externalId: { tenantId, externalId: order.externalId },
      },
    });
    if (byExternal) {
      await this.prisma.order.update({
        where: { id: byExternal.id },
        data: {
          orderNumber: order.orderNumber,
          status: order.status,
          trackingCode: order.trackingCode,
          totalAmount: new Prisma.Decimal(order.totalAmount),
          currency: order.currency,
          customerPhoneLast4: order.customerPhoneLast4,
          customerEmail: order.customerEmail,
          syncedAt: now,
        },
      });
      return;
    }
    const byNumber = await this.prisma.order.findUnique({
      where: {
        tenantId_orderNumber: { tenantId, orderNumber: order.orderNumber },
      },
    });
    if (byNumber) {
      await this.prisma.order.update({
        where: { id: byNumber.id },
        data: {
          externalId: order.externalId,
          status: order.status,
          trackingCode: order.trackingCode,
          totalAmount: new Prisma.Decimal(order.totalAmount),
          currency: order.currency,
          customerPhoneLast4: order.customerPhoneLast4,
          customerEmail: order.customerEmail,
          syncedAt: now,
        },
      });
      return;
    }
    await this.prisma.order.create({
      data: {
        tenantId,
        externalId: order.externalId,
        orderNumber: order.orderNumber,
        status: order.status,
        trackingCode: order.trackingCode,
        totalAmount: new Prisma.Decimal(order.totalAmount),
        currency: order.currency,
        customerPhoneLast4: order.customerPhoneLast4,
        customerEmail: order.customerEmail,
        syncedAt: now,
      },
    });
  }

  async countProducts(tenantId: string): Promise<number> {
    return this.prisma.product.count({ where: { tenantId } });
  }

  async productsForTenant(tenantId: string): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({ where: { tenantId } });
    return rows.map((r) => this.mapProduct(r));
  }

  async employeeForTenant(tenantId: string): Promise<Employee | null> {
    const row = await this.prisma.employee.findFirst({ where: { tenantId } });
    return row ? this.mapEmployee(row) : null;
  }

  async updateEmployee(
    tenantId: string,
    patch: Partial<
      Pick<Employee, 'name' | 'tone' | 'language' | 'status'> & {
        skills?: Partial<EmployeeSkills>;
      }
    >,
  ): Promise<Employee | null> {
    const current = await this.employeeForTenant(tenantId);
    if (!current) return null;
    const skills = patch.skills
      ? { ...current.skills, ...patch.skills }
      : current.skills;
    const row = await this.prisma.employee.update({
      where: { id: current.id },
      data: {
        name: patch.name ?? current.name,
        tone: patch.tone ?? current.tone,
        language: patch.language ?? current.language,
        status: patch.status ?? current.status,
        skills,
      },
    });
    return this.mapEmployee(row);
  }

  async updateEmployeeGuardrails(
    tenantId: string,
    guardrails: EmployeeGuardrails,
  ): Promise<Employee | null> {
    const current = await this.employeeForTenant(tenantId);
    if (!current) return null;
    const normalized = normalizeGuardrails(guardrails);
    const row = await this.prisma.employee.update({
      where: { id: current.id },
      data: {
        guardrails: normalized as unknown as Prisma.InputJsonValue,
      },
    });
    return this.mapEmployee(row);
  }

  async websiteChannel(tenantId: string): Promise<ChannelBinding | null> {
    const row = await this.prisma.channelBinding.findUnique({
      where: { tenantId_channel: { tenantId, channel: 'website' } },
    });
    return row ? this.mapChannel(row) : null;
  }

  async updateWebsiteAllowedOrigins(
    tenantId: string,
    origins: string[],
  ): Promise<ChannelBinding> {
    const normalized = normalizeAllowedOrigins(origins);
    const row = await this.prisma.channelBinding.update({
      where: { tenantId_channel: { tenantId, channel: 'website' } },
      data: { allowedOrigins: normalized },
    });
    return this.mapChannel(row);
  }

  async channelByPublicKey(publicKey: string): Promise<ChannelBinding | null> {
    const row = await this.prisma.channelBinding.findUnique({
      where: { publicKey },
    });
    return row ? this.mapChannel(row) : null;
  }

  async channelById(id: string): Promise<ChannelBinding | null> {
    const row = await this.prisma.channelBinding.findUnique({ where: { id } });
    return row ? this.mapChannel(row) : null;
  }

  async telegramChannel(tenantId: string): Promise<ChannelBinding | null> {
    const row = await this.prisma.channelBinding.findUnique({
      where: { tenantId_channel: { tenantId, channel: 'telegram' } },
    });
    return row ? this.mapChannel(row) : null;
  }

  async upsertTelegramChannel(data: {
    tenantId: string;
    credentialsCipher: string;
    webhookSecret: string;
    botUsername: string | null;
    status: ChannelBinding['status'];
  }): Promise<ChannelBinding> {
    const publicKey = `tg_${data.tenantId.slice(0, 8)}_${uuid().slice(0, 6)}`;
    const existing = await this.telegramChannel(data.tenantId);
    if (existing) {
      const row = await this.prisma.channelBinding.update({
        where: { id: existing.id },
        data: {
          credentialsCipher: data.credentialsCipher,
          webhookSecret: data.webhookSecret,
          botUsername: data.botUsername,
          status: data.status,
        },
      });
      return this.mapChannel(row);
    }
    const row = await this.prisma.channelBinding.create({
      data: {
        tenantId: data.tenantId,
        channel: 'telegram',
        status: data.status,
        publicKey,
        allowedOrigins: [],
        credentialsCipher: data.credentialsCipher,
        webhookSecret: data.webhookSecret,
        botUsername: data.botUsername,
      },
    });
    return this.mapChannel(row);
  }

  async baleChannel(tenantId: string): Promise<ChannelBinding | null> {
    const row = await this.prisma.channelBinding.findUnique({
      where: { tenantId_channel: { tenantId, channel: 'bale' } },
    });
    return row ? this.mapChannel(row) : null;
  }

  async upsertBaleChannel(data: {
    tenantId: string;
    credentialsCipher: string;
    webhookSecret: string;
    botUsername: string | null;
    status: ChannelBinding['status'];
  }): Promise<ChannelBinding> {
    const publicKey = `bale_${data.tenantId.slice(0, 8)}_${uuid().slice(0, 6)}`;
    const existing = await this.baleChannel(data.tenantId);
    if (existing) {
      const row = await this.prisma.channelBinding.update({
        where: { id: existing.id },
        data: {
          credentialsCipher: data.credentialsCipher,
          webhookSecret: data.webhookSecret,
          botUsername: data.botUsername,
          status: data.status,
        },
      });
      return this.mapChannel(row);
    }
    const row = await this.prisma.channelBinding.create({
      data: {
        tenantId: data.tenantId,
        channel: 'bale',
        status: data.status,
        publicKey,
        allowedOrigins: [],
        credentialsCipher: data.credentialsCipher,
        webhookSecret: data.webhookSecret,
        botUsername: data.botUsername,
      },
    });
    return this.mapChannel(row);
  }

  async setChannelStatus(
    id: string,
    status: ChannelBinding['status'],
  ): Promise<void> {
    await this.prisma.channelBinding.update({
      where: { id },
      data: { status },
    });
  }

  async createConversation(data: {
    id: string;
    tenantId: string;
    channel: Conversation['channel'];
    ownership: Conversation['ownership'];
    externalThreadId?: string | null;
  }): Promise<Conversation> {
    const row = await this.prisma.conversation.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        channel: data.channel,
        ownership: data.ownership,
        externalThreadId: data.externalThreadId ?? null,
      },
    });
    return this.mapConversation(row);
  }

  async findConversationByExternalThread(
    tenantId: string,
    channel: Conversation['channel'],
    externalThreadId: string,
  ): Promise<Conversation | null> {
    const row = await this.prisma.conversation.findFirst({
      where: { tenantId, channel, externalThreadId },
    });
    return row ? this.mapConversation(row) : null;
  }

  async getOrCreateExternalConversation(
    tenantId: string,
    channel: Conversation['channel'],
    externalThreadId: string,
  ): Promise<Conversation> {
    const existing = await this.findConversationByExternalThread(
      tenantId,
      channel,
      externalThreadId,
    );
    if (existing) return existing;
    return this.createConversation({
      id: uuid(),
      tenantId,
      channel,
      ownership: 'ai_owned',
      externalThreadId,
    });
  }

  async getConversation(
    conversationId: string,
  ): Promise<Conversation | null> {
    const row = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    return row ? this.mapConversation(row) : null;
  }

  async listConversations(
    tenantId: string,
    filter?: { ownership?: Conversation['ownership'] },
  ): Promise<
    Array<
      Conversation & {
        preview: string | null;
        messageCount: number;
      }
    >
  > {
    const rows = await this.prisma.conversation.findMany({
      where: {
        tenantId,
        ...(filter?.ownership ? { ownership: filter.ownership } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
    });
    return rows.map((row) => ({
      ...this.mapConversation(row),
      preview: row.messages[0]?.content ?? null,
      messageCount: row._count.messages,
    }));
  }

  async escalateConversation(
    tenantId: string,
    conversationId: string,
    reason: EscalationReason,
    packet: HandoffPacket,
  ): Promise<Conversation> {
    const row = await this.prisma.conversation.updateMany({
      where: { id: conversationId, tenantId },
      data: {
        ownership: 'human_owned',
        escalationReason: reason,
        escalatedAt: new Date(),
        handoffPacket: packet,
      },
    });
    if (row.count === 0) {
      throw new Error('Conversation not found for tenant');
    }
    const updated = await this.getConversation(conversationId);
    return updated!;
  }

  async setOwnership(
    tenantId: string,
    conversationId: string,
    ownership: Conversation['ownership'],
    clearEscalation = false,
  ): Promise<Conversation> {
    await this.prisma.conversation.updateMany({
      where: { id: conversationId, tenantId },
      data: {
        ownership,
        ...(clearEscalation
          ? {
              escalationReason: null,
              escalatedAt: null,
              handoffPacket: Prisma.JsonNull,
            }
          : {}),
      },
    });
    const updated = await this.getConversation(conversationId);
    if (!updated) throw new Error('Conversation not found');
    return updated;
  }

  async countEscalated(tenantId: string): Promise<number> {
    return this.prisma.conversation.count({
      where: {
        tenantId,
        ownership: 'human_owned',
        escalationReason: { not: null },
      },
    });
  }

  /** Design-partner readiness signals (Slice 19). */
  async partnerPathStats(tenantId: string) {
    const [
      groundedTurns,
      anyAudit,
      escalatedEver,
      activeKnowledge,
      websiteConversations,
    ] = await Promise.all([
      this.prisma.auditTurn.count({
        where: {
          tenantId,
          OR: [
            { decision: { startsWith: 'answer_grounded' } },
            { decision: { startsWith: 'answer_knowledge' } },
            { decision: { startsWith: 'recommend' } },
          ],
        },
      }),
      this.prisma.auditTurn.count({ where: { tenantId } }),
      this.prisma.conversation.count({
        where: {
          tenantId,
          OR: [
            { ownership: 'human_owned' },
            { escalationReason: { not: null } },
          ],
        },
      }),
      this.prisma.knowledgeDoc.count({
        where: { tenantId, status: 'active' },
      }),
      this.prisma.conversation.count({
        where: { tenantId, channel: 'website' },
      }),
    ]);
    return {
      groundedTurns,
      anyAudit,
      escalatedEver,
      activeKnowledge,
      websiteConversations,
    };
  }

  async findMessageByIdempotency(
    tenantId: string,
    idempotencyKey: string,
  ): Promise<Message | null> {
    const row = await this.prisma.message.findFirst({
      where: { tenantId, idempotencyKey },
    });
    return row ? this.mapMessage(row) : null;
  }

  async listKnowledgeDocs(tenantId: string): Promise<KnowledgeDoc[]> {
    const rows = await this.prisma.knowledgeDoc.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => this.mapKnowledgeDoc(r));
  }

  async getKnowledgeDoc(
    tenantId: string,
    id: string,
  ): Promise<KnowledgeDoc | null> {
    const row = await this.prisma.knowledgeDoc.findFirst({
      where: { id, tenantId },
    });
    return row ? this.mapKnowledgeDoc(row) : null;
  }

  async createKnowledgeDoc(data: {
    tenantId: string;
    docType: KnowledgeDoc['docType'];
    title: string;
    bodyText: string;
    sourceAttribution: string;
  }): Promise<KnowledgeDoc> {
    const row = await this.prisma.knowledgeDoc.create({
      data: {
        tenantId: data.tenantId,
        docType: data.docType,
        title: data.title,
        bodyText: data.bodyText,
        sourceAttribution: data.sourceAttribution,
        status: 'indexing',
      },
    });
    return this.reindexKnowledgeDoc(data.tenantId, row.id);
  }

  async updateKnowledgeDoc(
    tenantId: string,
    id: string,
    data: Partial<{
      title: string;
      bodyText: string;
      sourceAttribution: string;
      docType: KnowledgeDoc['docType'];
    }>,
  ): Promise<KnowledgeDoc> {
    const existing = await this.getKnowledgeDoc(tenantId, id);
    if (!existing) throw new Error('Knowledge doc not found');
    await this.prisma.knowledgeDoc.update({
      where: { id },
      data: {
        ...(data.title != null ? { title: data.title } : {}),
        ...(data.bodyText != null ? { bodyText: data.bodyText } : {}),
        ...(data.sourceAttribution != null
          ? { sourceAttribution: data.sourceAttribution }
          : {}),
        ...(data.docType != null ? { docType: data.docType } : {}),
        status: 'indexing',
      },
    });
    return this.reindexKnowledgeDoc(tenantId, id);
  }

  async deleteKnowledgeDoc(tenantId: string, id: string): Promise<void> {
    await this.prisma.knowledgeDoc.deleteMany({ where: { id, tenantId } });
  }

  /** Sync keyword index worker — chunks body; status honest indexing → active/failed */
  async reindexKnowledgeDoc(
    tenantId: string,
    id: string,
  ): Promise<KnowledgeDoc> {
    const doc = await this.prisma.knowledgeDoc.findFirst({
      where: { id, tenantId },
    });
    if (!doc) throw new Error('Knowledge doc not found');
    try {
      await this.prisma.knowledgeChunk.deleteMany({
        where: { knowledgeDocId: id, tenantId },
      });
      const parts = this.chunkText(doc.bodyText);
      for (let i = 0; i < parts.length; i++) {
        await this.prisma.knowledgeChunk.create({
          data: {
            tenantId,
            knowledgeDocId: id,
            ordinal: i,
            content: parts[i]!,
          },
        });
      }
      const row = await this.prisma.knowledgeDoc.update({
        where: { id },
        data: { status: 'active' },
      });
      return this.mapKnowledgeDoc(row);
    } catch {
      const row = await this.prisma.knowledgeDoc.update({
        where: { id },
        data: { status: 'failed' },
      });
      return this.mapKnowledgeDoc(row);
    }
  }

  async knowledgeIndexStatus(tenantId: string) {
    const [active, indexing, failed, total] = await Promise.all([
      this.prisma.knowledgeDoc.count({ where: { tenantId, status: 'active' } }),
      this.prisma.knowledgeDoc.count({
        where: { tenantId, status: 'indexing' },
      }),
      this.prisma.knowledgeDoc.count({ where: { tenantId, status: 'failed' } }),
      this.prisma.knowledgeDoc.count({ where: { tenantId } }),
    ]);
    return {
      total,
      active,
      indexing,
      failed,
      mode: 'keyword' as const,
      note:
        total === 0
          ? 'هنوز سندی نیست'
          : indexing > 0
            ? 'در حال ایندکس — هنوز همه اسناد قابل بازیابی نیستند'
            : failed > 0
              ? 'برخی اسناد failed — آخرین ایندکس خوب برای بقیه سرو می‌شود'
              : 'ایندکس keyword فعال است',
    };
  }

  async searchKnowledge(
    tenantId: string,
    query: string,
    limit = 3,
  ): Promise<
    Array<{
      doc: KnowledgeDoc;
      chunk: KnowledgeChunk;
      score: number;
    }>
  > {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const tokens = q
      .split(/[\s,?!.;:،؟]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);

    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: {
        tenantId,
        doc: { status: 'active' },
      },
      include: { doc: true },
      take: 200,
    });

    const scored = chunks
      .map((c) => {
        const hay = `${c.doc.title} ${c.content}`.toLowerCase();
        let score = 0;
        if (hay.includes(q)) score += 10;
        for (const t of tokens) {
          if (hay.includes(t)) score += 2;
        }
        return {
          doc: this.mapKnowledgeDoc(c.doc),
          chunk: {
            id: c.id,
            tenantId: c.tenantId,
            knowledgeDocId: c.knowledgeDocId,
            ordinal: c.ordinal,
            content: c.content,
          },
          score,
        };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    const seen = new Set<string>();
    const out: typeof scored = [];
    for (const hit of scored) {
      if (seen.has(hit.doc.id)) continue;
      seen.add(hit.doc.id);
      out.push(hit);
      if (out.length >= limit) break;
    }
    return out;
  }

  private chunkText(text: string): string[] {
    const cleaned = text.trim();
    if (!cleaned) return [''];
    if (cleaned.length <= 500) return [cleaned];
    const parts: string[] = [];
    let i = 0;
    while (i < cleaned.length) {
      parts.push(cleaned.slice(i, i + 480));
      i += 480;
    }
    return parts;
  }

  async addMessage(
    partial: Omit<Message, 'id' | 'createdAt'> & {
      citations?: Message['citations'];
      idempotencyKey?: string;
    },
  ): Promise<Message> {
    if (partial.idempotencyKey) {
      const existing = await this.findMessageByIdempotency(
        partial.tenantId,
        partial.idempotencyKey,
      );
      if (existing) return existing;
    }
    try {
      const row = await this.prisma.message.create({
        data: {
          tenantId: partial.tenantId,
          conversationId: partial.conversationId,
          role: partial.role,
          content: partial.content,
          citations: partial.citations ?? Prisma.JsonNull,
          idempotencyKey: partial.idempotencyKey ?? null,
        },
      });
      return this.mapMessage(row);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        partial.idempotencyKey
      ) {
        const existing = await this.findMessageByIdempotency(
          partial.tenantId,
          partial.idempotencyKey,
        );
        if (existing) return existing;
      }
      throw err;
    }
  }

  async listMessages(
    tenantId: string,
    conversationId: string,
  ): Promise<Message[]> {
    const rows = await this.prisma.message.findMany({
      where: { tenantId, conversationId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.mapMessage(r));
  }

  async addAudit(turn: Omit<AuditTurn, 'id' | 'createdAt'> & { id?: string }) {
    await this.prisma.auditTurn.create({
      data: {
        id: turn.id,
        tenantId: turn.tenantId,
        conversationId: turn.conversationId,
        decision: turn.decision,
        citations: turn.citations,
        gateway:
          turn.gateway == null
            ? undefined
            : (turn.gateway as Prisma.InputJsonValue),
      },
    });
  }

  async addAdminAudit(event: {
    tenantId: string;
    actorUserId: string;
    action: string;
    summary: string;
    payload?: Record<string, unknown> | null;
  }): Promise<AdminAuditEvent> {
    const row = await this.prisma.adminAuditEvent.create({
      data: {
        tenantId: event.tenantId,
        actorUserId: event.actorUserId,
        action: event.action,
        summary: event.summary,
        payload:
          event.payload == null
            ? Prisma.JsonNull
            : (event.payload as Prisma.InputJsonValue),
      },
    });
    return this.mapAdminAudit(row);
  }

  async listAdminAudits(
    tenantId: string,
    opts: {
      days?: number;
      action?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const days = Math.max(1, Math.min(opts.days ?? 7, 90));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const limit = Math.max(1, Math.min(opts.limit ?? 50, 200));
    const offset = Math.max(0, opts.offset ?? 0);

    const where = {
      tenantId,
      createdAt: { gte: since },
      ...(opts.action
        ? opts.action.endsWith('*')
          ? { action: { startsWith: opts.action.slice(0, -1) } }
          : { action: opts.action }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.adminAuditEvent.count({ where }),
      this.prisma.adminAuditEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
    ]);

    return {
      total,
      limit,
      offset,
      rangeDays: days,
      items: rows.map((r: {
        id: string;
        tenantId: string;
        actorUserId: string;
        action: string;
        summary: string;
        payload: Prisma.JsonValue | null;
        createdAt: Date;
      }) => this.mapAdminAudit(r)),
    };
  }

  async getAdminAudit(
    tenantId: string,
    id: string,
  ): Promise<AdminAuditEvent | null> {
    const row = await this.prisma.adminAuditEvent.findFirst({
      where: { id, tenantId },
    });
    return row ? this.mapAdminAudit(row) : null;
  }

  private mapAdminAudit(row: {
    id: string;
    tenantId: string;
    actorUserId: string;
    action: string;
    summary: string;
    payload: Prisma.JsonValue | null;
    createdAt: Date;
  }): AdminAuditEvent {
    return {
      id: row.id,
      tenantId: row.tenantId,
      actorUserId: row.actorUserId,
      action: row.action,
      summary: row.summary,
      payload:
        row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
          ? (row.payload as Record<string, unknown>)
          : null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async analyticsSummary(tenantId: string, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - Math.max(1, Math.min(days, 90)));

    const [conversations, audits, store, escalatedNow] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { tenantId, createdAt: { gte: since } },
        select: {
          id: true,
          channel: true,
          ownership: true,
          escalationReason: true,
          createdAt: true,
        },
      }),
      this.prisma.auditTurn.findMany({
        where: { tenantId, createdAt: { gte: since } },
        select: { decision: true, conversationId: true, createdAt: true },
      }),
      this.getStore(tenantId),
      this.countEscalated(tenantId),
    ]);

    const byChannel: Record<string, number> = {};
    for (const c of conversations) {
      byChannel[c.channel] = (byChannel[c.channel] ?? 0) + 1;
    }

    const resolvedDecisions = new Set([
      'answer_grounded',
      'answer_knowledge',
      'recommend',
      'order_lookup',
    ]);
    const gapDecisions = new Set([
      'answer_empty_catalog',
      'recommend_empty',
      'order_lookup_not_found',
    ]);

    let resolvedTurns = 0;
    let escalatedTurns = 0;
    let assistedActions = 0;
    const decisionCounts: Record<string, number> = {};
    for (const a of audits) {
      decisionCounts[a.decision] = (decisionCounts[a.decision] ?? 0) + 1;
      if (resolvedDecisions.has(a.decision)) resolvedTurns += 1;
      if (a.decision.startsWith('escalated:')) escalatedTurns += 1;
      if (a.decision === 'recommend' || a.decision === 'order_lookup') {
        assistedActions += 1;
      }
    }

    const escalationReasons: Record<string, number> = {};
    for (const c of conversations) {
      if (c.escalationReason) {
        escalationReasons[c.escalationReason] =
          (escalationReasons[c.escalationReason] ?? 0) + 1;
      }
    }

    const totalTurns = audits.length;
    const resolutionProxy =
      totalTurns === 0 ? null : Number((resolvedTurns / totalTurns).toFixed(3));
    const escalationRate =
      conversations.length === 0
        ? null
        : Number(
            (
              conversations.filter((c) => c.ownership === 'human_owned').length /
              conversations.length
            ).toFixed(3),
          );

    const volumeByDay: Record<string, number> = {};
    for (const c of conversations) {
      const day = c.createdAt.toISOString().slice(0, 10);
      volumeByDay[day] = (volumeByDay[day] ?? 0) + 1;
    }

    return {
      rangeDays: days,
      since: since.toISOString(),
      empty: conversations.length === 0 && audits.length === 0,
      conversations: {
        total: conversations.length,
        byChannel,
        volumeByDay,
        humanOwnedOpen: escalatedNow,
      },
      audits: {
        total: totalTurns,
        decisionCounts,
        resolvedTurns,
        escalatedTurns,
        assistedActions,
      },
      rates: {
        resolutionProxy,
        escalationRate,
      },
      escalationReasons,
      syncHealth: store?.syncHealth ?? 'never',
      syncLastAt: store?.lastSyncAt ?? null,
      methodology: {
        resolutionProxy:
          'نسبت نوبت‌های audit با تصمیم‌های grounded/knowledge/recommend/order_lookup به کل نوبت‌ها — نه «رضایت AI».',
        escalationRate:
          'نسبت گفتگوهای human_owned به کل گفتگوهای بازه.',
        assistedActions:
          'تعداد نوبت recommend + order_lookup — انتساب فروش علّی نیست.',
        freshness: 'محاسبه زنده از Postgres؛ تأخیر batch جداگانه نداریم.',
      },
      gapDecisionCounts: Object.fromEntries(
        [...gapDecisions].map((d) => [d, decisionCounts[d] ?? 0]),
      ),
    };
  }

  async analyticsRevenue(tenantId: string, days = 7) {
    const rangeDays = Math.max(1, Math.min(days, 90));
    const since = new Date();
    since.setDate(since.getDate() - rangeDays);

    const [orders, audits] = await Promise.all([
      this.prisma.order.findMany({
        where: { tenantId, syncedAt: { gte: since } },
        select: {
          orderNumber: true,
          totalAmount: true,
          currency: true,
          syncedAt: true,
        },
      }),
      this.prisma.auditTurn.findMany({
        where: { tenantId, createdAt: { gte: since } },
        select: { decision: true, conversationId: true },
      }),
    ]);

    let recommendVolume = 0;
    let orderLookupVolume = 0;
    const assistedConversationIds = new Set<string>();
    for (const a of audits) {
      if (a.decision === 'recommend') {
        recommendVolume += 1;
        assistedConversationIds.add(a.conversationId);
      } else if (a.decision === 'order_lookup') {
        orderLookupVolume += 1;
        assistedConversationIds.add(a.conversationId);
      }
    }

    const currency = orders[0]?.currency ?? 'IRR';
    const storeGmv = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    return {
      rangeDays,
      since: since.toISOString(),
      empty: orders.length === 0 && audits.length === 0,
      skills: {
        recommendVolume,
        orderLookupVolume,
        assistedActions: recommendVolume + orderLookupVolume,
        assistedConversations: assistedConversationIds.size,
      },
      store: {
        orderCount: orders.length,
        gmv: storeGmv,
        currency,
        note: 'مجموع total_amount سفارش‌های همگام‌شده در بازه — واقعیت فروشگاه، نه فروش منتسب به AI.',
      },
      linkage: {
        conversationToOrderLinked: 0,
        available: false,
        note: 'لینک deterministic گفتگو→سفارش در MVP نداریم؛ متریک‌ها جدا نمایش داده می‌شوند.',
      },
      usage: {
        auditTurnCount: audits.length,
        costMode: 'mock_proxy' as const,
        note: 'تعداد نوبت audit به‌عنوان proxy مصرف — فاکتور provider نیست.',
      },
      claims: {
        causalLiftShown: false,
        causalLiftPercent: null as number | null,
      },
      methodology: {
        assisted:
          'گفتگوی assisted = حداقل یک نوبت recommend یا order_lookup در بازه. اثبات تبدیل فروش نیست.',
        storeGmv:
          'GMV = جمع total_amount سفارش‌هایی که synced_at در بازه است (Commerce sync).',
        noCausalLift:
          'هیچ ادعای «+X٪ فروش به‌خاطر AI» بدون آزمایش کنترل‌شده نمایش داده نمی‌شود.',
        cost:
          'مصرف فعلی proxy مبتنی بر audit است؛ صورتحساب مدل جداگانه است.',
      },
    };
  }

  async analyticsKnowledgeGaps(tenantId: string, days = 7, limit = 10) {
    const since = new Date();
    since.setDate(since.getDate() - Math.max(1, Math.min(days, 90)));
    const gapDecisions = [
      'answer_empty_catalog',
      'recommend_empty',
      'order_lookup_not_found',
    ];
    const audits = await this.prisma.auditTurn.findMany({
      where: {
        tenantId,
        createdAt: { gte: since },
        decision: { in: gapDecisions },
      },
      orderBy: { createdAt: 'desc' },
      take: 80,
      select: { conversationId: true, decision: true, createdAt: true },
    });

    const topics: Array<{
      text: string;
      decision: string;
      conversationId: string;
      at: string;
    }> = [];

    for (const a of audits) {
      const shopper = await this.prisma.message.findFirst({
        where: {
          tenantId,
          conversationId: a.conversationId,
          role: 'shopper',
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!shopper) continue;
      topics.push({
        text: shopper.content.slice(0, 160),
        decision: a.decision,
        conversationId: a.conversationId,
        at: a.createdAt.toISOString(),
      });
      if (topics.length >= limit) break;
    }

    return {
      rangeDays: days,
      empty: topics.length === 0,
      topics,
      hrefKnowledge: '/knowledge',
      note: 'موضوعات نزدیک به تصمیم‌های empty/not_found — نقطه شروع ویرایش Knowledge، نه امتیاز وانیته.',
    };
  }

  async listAuditTurns(
    tenantId: string,
    opts: {
      days?: number;
      decision?: string;
      conversationId?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const days = Math.max(1, Math.min(opts.days ?? 7, 90));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const limit = Math.max(1, Math.min(opts.limit ?? 50, 200));
    const offset = Math.max(0, opts.offset ?? 0);

    const where = {
      tenantId,
      createdAt: { gte: since },
      ...(opts.conversationId
        ? { conversationId: opts.conversationId }
        : {}),
      ...(opts.decision
        ? opts.decision.endsWith('*')
          ? { decision: { startsWith: opts.decision.slice(0, -1) } }
          : { decision: opts.decision }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.auditTurn.count({ where }),
      this.prisma.auditTurn.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
    ]);

    return {
      total,
      limit,
      offset,
      rangeDays: days,
      items: rows.map((r) => ({
        id: r.id,
        conversationId: r.conversationId,
        decision: r.decision,
        citations: r.citations,
        gateway: r.gateway,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async getAuditTurn(tenantId: string, id: string) {
    const row = await this.prisma.auditTurn.findFirst({
      where: { id, tenantId },
    });
    if (!row) return null;

    const conversation = await this.getConversation(row.conversationId);
    const messages = await this.listMessages(tenantId, row.conversationId);
    const recent = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content.slice(0, 240),
      createdAt: m.createdAt,
    }));

    return {
      id: row.id,
      conversationId: row.conversationId,
      decision: row.decision,
      citations: row.citations,
      gateway: row.gateway,
      createdAt: row.createdAt.toISOString(),
      conversation: conversation
        ? {
            id: conversation.id,
            channel: conversation.channel,
            ownership: conversation.ownership,
            escalationReason: conversation.escalationReason,
          }
        : null,
      recentMessages: recent,
      note: 'خلاصه نوبت AI — prompt خام در MVP به نقش‌ها نشان داده نمی‌شود.',
    };
  }

  private mapUser(row: {
    id: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
  }): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapTenant(row: {
    id: string;
    name: string;
    ownerUserId: string;
    plan?: string;
    billingStatus?: string;
    createdAt: Date;
  }): Tenant {
    return {
      id: row.id,
      name: row.name,
      ownerUserId: row.ownerUserId,
      plan: row.plan ?? 'trial',
      billingStatus: row.billingStatus ?? 'trial',
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapStore(row: {
    id: string;
    tenantId: string;
    platform: string;
    shopDomain?: string | null;
    externalShopId?: string | null;
    credentialsCipher?: string | null;
    syncHealth: string;
    lastSyncAt: Date | null;
    failureReason: string | null;
  }): StoreConnection {
    return {
      id: row.id,
      tenantId: row.tenantId,
      platform: row.platform as StoreConnection['platform'],
      shopDomain: row.shopDomain ?? null,
      externalShopId: row.externalShopId ?? null,
      syncHealth: row.syncHealth as StoreConnection['syncHealth'],
      lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
      failureReason: row.failureReason,
      hasCredentials: Boolean(row.credentialsCipher),
    };
  }

  private mapProduct(row: {
    id: string;
    tenantId: string;
    externalId?: string | null;
    sku: string;
    slug?: string | null;
    title: string;
    price: Prisma.Decimal;
    compareAtPrice?: Prisma.Decimal | null;
    currency: string;
    inStock: boolean;
    description: string | null;
    images?: string[] | null;
    categoryId?: string | null;
    status?: string | null;
    source?: string | null;
  }): Product {
    return {
      id: row.id,
      tenantId: row.tenantId,
      externalId: row.externalId ?? null,
      sku: row.sku,
      slug: row.slug && row.slug.length > 0 ? row.slug : this.slugFromSku(row.sku, row.id),
      title: row.title,
      price: Number(row.price),
      compareAtPrice:
        row.compareAtPrice != null ? Number(row.compareAtPrice) : null,
      currency: row.currency,
      inStock: row.inStock,
      description: row.description ?? undefined,
      images: row.images ?? [],
      categoryId: row.categoryId ?? null,
      status: row.status ?? 'published',
      source: row.source ?? 'mock',
    };
  }

  slugFromSku(sku: string, fallback: string): string {
    const base = `${sku}-${fallback}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);
    return base || `p-${fallback.slice(0, 8)}`;
  }

  async ensureStorefrontSettings(tenantId: string) {
    const existing = await this.prisma.storefrontSettings.findUnique({
      where: { tenantId },
    });
    if (existing) return existing;
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const base = (tenant?.name ?? 'store')
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff]+/gi, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    let storeSlug = base.replace(/[^\w-]/g, '') || `shop-${tenantId.slice(0, 8)}`;
    const taken = await this.prisma.storefrontSettings.findUnique({
      where: { storeSlug },
    });
    if (taken) storeSlug = `${storeSlug}-${tenantId.slice(0, 6)}`;
    return this.prisma.storefrontSettings.create({
      data: {
        tenantId,
        storeName: tenant?.name ?? 'فروشگاه من',
        storeSlug,
        tagline: 'خرید آسان با پشتیبانی هوشمند',
        primaryColor: '#ef4056',
        secondaryColor: '#0c0c0c',
        codEnabled: true,
      },
    });
  }

  private mapEmployee(row: {
    id: string;
    tenantId: string;
    name: string;
    tone: string;
    language: string;
    status: string;
    skills: Prisma.JsonValue;
    guardrails?: Prisma.JsonValue | null;
  }): Employee {
    return {
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      tone: row.tone,
      language: row.language,
      status: row.status as Employee['status'],
      skills: row.skills as EmployeeSkills,
      guardrails: normalizeGuardrails(row.guardrails),
    };
  }

  private mapChannel(row: {
    id: string;
    tenantId: string;
    channel: string;
    status: string;
    publicKey: string;
    allowedOrigins: Prisma.JsonValue;
    credentialsCipher: string | null;
    webhookSecret: string | null;
    botUsername: string | null;
  }): ChannelBinding {
    return {
      id: row.id,
      tenantId: row.tenantId,
      channel: row.channel as ChannelBinding['channel'],
      status: row.status as ChannelBinding['status'],
      publicKey: row.publicKey,
      allowedOrigins: row.allowedOrigins as string[],
      credentialsCipher: row.credentialsCipher,
      webhookSecret: row.webhookSecret,
      botUsername: row.botUsername,
    };
  }

  private mapConversation(row: {
    id: string;
    tenantId: string;
    channel: string;
    ownership: string;
    externalThreadId: string | null;
    escalationReason: string | null;
    escalatedAt: Date | null;
    handoffPacket: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }): Conversation {
    return {
      id: row.id,
      tenantId: row.tenantId,
      channel: row.channel as Conversation['channel'],
      ownership: row.ownership as Conversation['ownership'],
      externalThreadId: row.externalThreadId,
      escalationReason: (row.escalationReason as EscalationReason | null) ?? null,
      escalatedAt: row.escalatedAt?.toISOString() ?? null,
      handoffPacket: (row.handoffPacket as HandoffPacket | null) ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapMessage(row: {
    id: string;
    tenantId: string;
    conversationId: string;
    role: string;
    content: string;
    citations: Prisma.JsonValue | null;
    createdAt: Date;
  }): Message {
    return {
      id: row.id,
      tenantId: row.tenantId,
      conversationId: row.conversationId,
      role: row.role as Message['role'],
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      citations: (row.citations as Message['citations']) ?? undefined,
    };
  }

  private mapKnowledgeDoc(row: {
    id: string;
    tenantId: string;
    docType: string;
    title: string;
    bodyText: string;
    sourceAttribution: string;
    status: string;
    objectKey: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): KnowledgeDoc {
    return {
      id: row.id,
      tenantId: row.tenantId,
      docType: row.docType as KnowledgeDoc['docType'],
      title: row.title,
      bodyText: row.bodyText,
      sourceAttribution: row.sourceAttribution,
      status: row.status as KnowledgeDoc['status'],
      objectKey: row.objectKey,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapOrder(row: {
    id: string;
    tenantId: string;
    externalId: string;
    orderNumber: string;
    status: string;
    trackingCode: string | null;
    totalAmount: Prisma.Decimal;
    currency: string;
    customerPhoneLast4: string;
    customerEmail: string | null;
    syncedAt: Date;
  }): OrderRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      externalId: row.externalId,
      orderNumber: row.orderNumber,
      status: row.status,
      trackingCode: row.trackingCode,
      totalAmount: Number(row.totalAmount),
      currency: row.currency,
      customerPhoneLast4: row.customerPhoneLast4,
      customerEmail: row.customerEmail,
      syncedAt: row.syncedAt.toISOString(),
    };
  }
}

/** Trim, strip trailing slash, dedupe, cap list size for website allowlist. */
export function normalizeAllowedOrigins(origins: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of origins) {
    let o = raw.trim();
    if (!o) continue;
    o = o.replace(/\/+$/, '');
    if (!/^https?:\/\/.+/i.test(o) && o !== 'null') continue;
    const key = o.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(o);
    if (out.length >= 40) break;
  }
  return out;
}
