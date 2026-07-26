import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { PrismaService } from './prisma.service';
import type {
  AuditTurn,
  ChannelBinding,
  Conversation,
  Employee,
  EscalationReason,
  HandoffPacket,
  KnowledgeChunk,
  KnowledgeDoc,
  Membership,
  Message,
  Product,
  Session,
  StoreConnection,
  Tenant,
  User,
} from './types';
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
        await this.seedDefaultKnowledge(membership.tenantId);
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
            order_status: false,
            escalate: true,
          } satisfies EmployeeSkills,
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
        title: 'پیراهن لینن آبی',
        price: 890000,
        currency: 'IRR',
        inStock: true,
        description: 'سایزهای M و L موجود',
      },
      {
        sku: 'BAG-014',
        title: 'کیف چرمی مشکی',
        price: 2450000,
        currency: 'IRR',
        inStock: true,
        description: null as string | null,
      },
      {
        sku: 'SHOE-220',
        title: 'کفش اسپرت سفید',
        price: 1750000,
        currency: 'IRR',
        inStock: false,
        description: 'فعلاً ناموجود',
      },
    ];

    for (const item of catalog) {
      await this.prisma.product.upsert({
        where: { tenantId_sku: { tenantId, sku: item.sku } },
        create: { tenantId, ...item },
        update: {
          title: item.title,
          price: item.price,
          currency: item.currency,
          inStock: item.inStock,
          description: item.description,
        },
      });
    }

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
        ],
      },
      update: {
        status: 'connected',
        allowedOrigins: [
          'http://localhost:5173',
          'http://127.0.0.1:5173',
        ],
      },
    });

    await this.seedDefaultKnowledge(tenantId);
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

  async createTenant(tenant: Omit<Tenant, 'createdAt'>): Promise<Tenant> {
    const row = await this.prisma.tenant.create({
      data: {
        id: tenant.id,
        name: tenant.name,
        ownerUserId: tenant.ownerUserId,
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

  async websiteChannel(tenantId: string): Promise<ChannelBinding | null> {
    const row = await this.prisma.channelBinding.findUnique({
      where: { tenantId_channel: { tenantId, channel: 'website' } },
    });
    return row ? this.mapChannel(row) : null;
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
      },
    });
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
    createdAt: Date;
  }): Tenant {
    return {
      id: row.id,
      name: row.name,
      ownerUserId: row.ownerUserId,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapStore(row: {
    tenantId: string;
    platform: string;
    syncHealth: string;
    lastSyncAt: Date | null;
    failureReason: string | null;
  }): StoreConnection {
    return {
      tenantId: row.tenantId,
      platform: row.platform as StoreConnection['platform'],
      syncHealth: row.syncHealth as StoreConnection['syncHealth'],
      lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
      failureReason: row.failureReason,
    };
  }

  private mapProduct(row: {
    id: string;
    tenantId: string;
    sku: string;
    title: string;
    price: Prisma.Decimal;
    currency: string;
    inStock: boolean;
    description: string | null;
  }): Product {
    return {
      id: row.id,
      tenantId: row.tenantId,
      sku: row.sku,
      title: row.title,
      price: Number(row.price),
      currency: row.currency,
      inStock: row.inStock,
      description: row.description ?? undefined,
    };
  }

  private mapEmployee(row: {
    id: string;
    tenantId: string;
    name: string;
    tone: string;
    language: string;
    status: string;
    skills: Prisma.JsonValue;
  }): Employee {
    return {
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      tone: row.tone,
      language: row.language,
      status: row.status as Employee['status'],
      skills: row.skills as EmployeeSkills,
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
}
