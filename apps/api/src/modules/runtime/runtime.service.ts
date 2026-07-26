import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DataStore } from '../platform/data.store';
import { CommerceService } from '../commerce/commerce.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { HandoffService } from '../inbox/handoff.service';
import type { Citation, Employee } from '../platform/types';

export type TurnResult = {
  reply: string;
  citations: Citation[];
  decision: string;
  ownership?: 'ai_owned' | 'human_owned';
};

const HUMAN_REQUEST_RE =
  /(انسان|اپراتور|پشتیبان|همکار|آدم|human|agent|operator|support)/i;

const ORDER_INTENT_RE =
  /(سفارش|وضعیت سفارش|پیگیری|کجا.*(سفارش|مرسول)|رسید|tracking|order\s*(status|number)?|where.?is.?my.?order)/i;

const ORDER_NUMBER_RE = /\b(DR-?\d{3,})\b/i;
const PHONE_LAST4_RE = /\b(\d{4})\b/;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

const STATUS_FA: Record<string, string> = {
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال‌شده',
  delivered: 'تحویل‌شده',
  cancelled: 'لغو‌شده',
};

@Injectable()
export class RuntimeService {
  constructor(
    private readonly store: DataStore,
    private readonly commerce: CommerceService,
    private readonly knowledge: KnowledgeService,
    private readonly gateway: AiGatewayService,
    @Inject(forwardRef(() => HandoffService))
    private readonly handoff: HandoffService,
  ) {}

  async executeTurn(
    tenantId: string,
    conversationId: string,
    userText: string,
  ): Promise<TurnResult> {
    const conversation = await this.store.getConversation(conversationId);
    if (conversation?.ownership === 'human_owned') {
      return {
        reply:
          'گفتگو در اختیار همکار انسانی است؛ پاسخ به‌زودی از طرف فروشگاه ارسال می‌شود.',
        citations: [],
        decision: 'paused_human_owned',
        ownership: 'human_owned',
      };
    }

    if (HUMAN_REQUEST_RE.test(userText)) {
      await this.handoff.escalate(
        tenantId,
        conversationId,
        'customer_request',
        [],
        userText.slice(0, 200),
      );
      return {
        reply: 'یک همکار انسانی به گفتگو می‌پیوندد.',
        citations: [],
        decision: 'escalated:customer_request',
        ownership: 'human_owned',
      };
    }

    const storeConn = await this.store.getStore(tenantId);
    const employee = await this.store.employeeForTenant(tenantId);
    const syncHealth = storeConn?.syncHealth ?? 'never';

    if (employee && employee.status === 'paused') {
      return {
        reply: 'کارمند فروش فعلاً متوقف است.',
        citations: [],
        decision: 'refuse_paused',
      };
    }

    if (syncHealth !== 'healthy') {
      await this.handoff.escalate(
        tenantId,
        conversationId,
        'sync_unhealthy',
        [],
        'factual question while sync unhealthy',
      );
      return {
        reply:
          'همگام‌سازی فروشگاه سالم نیست؛ شما را به همکار انسانی وصل می‌کنم.',
        citations: [],
        decision: 'escalated:sync_unhealthy',
        ownership: 'human_owned',
      };
    }

    const orderTurn = await this.tryOrderLookup(
      tenantId,
      conversationId,
      userText,
      employee,
    );
    if (orderTurn) return orderTurn;

    const [matches, knowledgeHits] = await Promise.all([
      this.commerce.searchProducts(tenantId, userText),
      this.knowledge.search(tenantId, userText),
    ]);

    const citations: Citation[] = [
      ...matches.slice(0, 3).map(
        (m): Citation => ({
          type: 'product',
          sku: m.sku,
          title: m.title,
          price: m.price,
        }),
      ),
      ...knowledgeHits.slice(0, 3).map(
        (h): Citation => ({
          type: 'knowledge',
          docId: h.doc.id,
          title: h.doc.title,
          sourceAttribution: h.doc.sourceAttribution,
        }),
      ),
    ];

    const contextJson = JSON.stringify({
      syncHealth,
      employee: employee
        ? {
            name: employee.name,
            tone: employee.tone,
            language: employee.language,
          }
        : null,
      matches: matches.slice(0, 5).map((m) => ({
        sku: m.sku,
        title: m.title,
        price: m.price,
        currency: m.currency,
        inStock: m.inStock,
        description: m.description ?? null,
      })),
      knowledge: knowledgeHits.slice(0, 5).map((h) => ({
        docId: h.doc.id,
        title: h.doc.title,
        body: h.chunk.content,
        sourceAttribution: h.doc.sourceAttribution,
        docType: h.doc.docType,
      })),
    });

    const system = [
      'You are a DeloRey AI Sales Employee. Answer only from CONTEXT_JSON.',
      'Never invent SKUs, prices, stock, policies, or order status.',
      'Prefer Persian if employee.language is fa.',
      'When answering from knowledge, cite sourceAttribution.',
      `CONTEXT_JSON:${contextJson}`,
    ].join('\n');

    const completion = await this.gateway.complete({ system, user: userText });

    let decision = 'answer_empty_catalog';
    if (matches.length) decision = 'answer_grounded';
    else if (knowledgeHits.length) decision = 'answer_knowledge';

    await this.store.addAudit({
      id: uuid(),
      tenantId,
      conversationId,
      decision,
      citations,
    });

    return {
      reply: completion.text,
      citations,
      decision,
      ownership: 'ai_owned',
    };
  }

  private async tryOrderLookup(
    tenantId: string,
    conversationId: string,
    userText: string,
    employee: Employee | null,
  ): Promise<TurnResult | null> {
    const history = await this.store.listMessages(tenantId, conversationId);
    const recentText = [...history.map((m) => m.content), userText].join('\n');

    const hasIntent =
      ORDER_INTENT_RE.test(userText) ||
      ORDER_NUMBER_RE.test(userText) ||
      history.some(
        (m) =>
          m.role === 'employee' &&
          /شماره سفارش|چهار رقم آخر|تأیید هویت/.test(m.content),
      );

    if (!hasIntent) return null;

    if (!employee?.skills.order_status) {
      const result: TurnResult = {
        reply:
          'مهارت پیگیری سفارش برای این کارمند فعال نیست. می‌توانید از پشتیبانی انسانی بپرسید.',
        citations: [],
        decision: 'order_lookup_skill_disabled',
      };
      await this.audit(tenantId, conversationId, result.decision, []);
      return result;
    }

    let orderNumber = this.extractOrderNumber(userText);
    if (!orderNumber) {
      orderNumber = this.extractOrderNumber(recentText);
    }

    if (!orderNumber) {
      const result: TurnResult = {
        reply:
          'برای پیگیری، لطفاً شماره سفارش را بفرستید (مثلاً DR-1001). پس از آن چهار رقم آخر موبایل ثبت‌شده را برای تأیید هویت می‌خواهم.',
        citations: [],
        decision: 'order_lookup_need_id',
      };
      await this.audit(tenantId, conversationId, result.decision, []);
      return result;
    }

    const normalized = orderNumber.toUpperCase().replace(/^DR(\d)/, 'DR-$1');
    const order = await this.commerce.findOrderByNumber(tenantId, normalized);
    if (!order) {
      const result: TurnResult = {
        reply: `سفارش ${normalized} را در همگام‌سازی فروشگاه پیدا نکردم. شماره را دوباره چک کنید یا با پشتیبانی صحبت کنید — وضعیتی اختراع نمی‌کنم.`,
        citations: [],
        decision: 'order_lookup_not_found',
      };
      await this.audit(tenantId, conversationId, result.decision, []);
      return result;
    }

    const proof =
      this.extractEmail(userText) ??
      this.extractPhoneLast4(userText) ??
      this.extractEmail(recentText) ??
      this.extractPhoneLast4ForVerify(userText, history);

    if (!proof || !this.commerce.verifyOrderAccess(order, proof)) {
      const result: TurnResult = {
        reply: `سفارش ${order.orderNumber} را پیدا کردم، ولی قبل از اعلام وضعیت باید هویت تأیید شود. لطفاً چهار رقم آخر موبایل ثبت‌شده در سفارش را بفرستید (یا ایمیل سفارش). جزئیات وضعیت را تا تأیید فاش نمی‌کنم.`,
        citations: [],
        decision: 'order_lookup_need_verify',
      };
      await this.audit(tenantId, conversationId, result.decision, []);
      return result;
    }

    const statusFa = STATUS_FA[order.status] ?? order.status;
    const tracking = order.trackingCode
      ? `کد رهگیری: ${order.trackingCode}`
      : 'هنوز کد رهگیری ثبت نشده';
    const citations: Citation[] = [
      {
        type: 'order',
        orderNumber: order.orderNumber,
        status: order.status,
      },
    ];
    const result: TurnResult = {
      reply: `وضعیت سفارش ${order.orderNumber} (از همگام‌سازی فروشگاه):\n• وضعیت: ${statusFa}\n• ${tracking}\nمنبع: Commerce Core · synced`,
      citations,
      decision: 'order_lookup',
    };
    await this.audit(tenantId, conversationId, result.decision, citations);
    return result;
  }

  private extractOrderNumber(text: string): string | null {
    const m = text.match(ORDER_NUMBER_RE);
    return m?.[1] ?? null;
  }

  private extractPhoneLast4(text: string): string | null {
    // Prefer explicit "چهار رقم" context; otherwise last standalone 4 digits
    const labeled = text.match(
      /(?:چهار رقم|last\s*4|phone|موبایل|تلفن)[^\d]*(\d{4})/i,
    );
    if (labeled?.[1]) return labeled[1];
    const all = [...text.matchAll(new RegExp(PHONE_LAST4_RE, 'g'))].map(
      (x) => x[1]!,
    );
    // Ignore years / order fragments already captured
    const filtered = all.filter((d) => !text.toUpperCase().includes(`DR-${d}`));
    return filtered[filtered.length - 1] ?? null;
  }

  private extractPhoneLast4ForVerify(
    userText: string,
    history: Array<{ role: string; content: string }>,
  ): string | null {
    const awaiting = history
      .slice(-4)
      .some(
        (m) =>
          m.role === 'employee' && /چهار رقم آخر|تأیید هویت/.test(m.content),
      );
    if (!awaiting) return this.extractPhoneLast4(userText);
    const m = userText.trim().match(/^(\d{4})$/);
    return m?.[1] ?? this.extractPhoneLast4(userText);
  }

  private extractEmail(text: string): string | null {
    const m = text.match(EMAIL_RE);
    return m?.[0]?.toLowerCase() ?? null;
  }

  private async audit(
    tenantId: string,
    conversationId: string,
    decision: string,
    citations: Citation[],
  ) {
    await this.store.addAudit({
      id: uuid(),
      tenantId,
      conversationId,
      decision,
      citations,
    });
  }
}
