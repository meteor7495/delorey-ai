import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DataStore } from '../platform/data.store';
import { CommerceService } from '../commerce/commerce.service';
import { CommerceRetrievalService } from '../shop/commerce-retrieval.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { HandoffService } from '../inbox/handoff.service';
import { ChannelCheckoutService } from '../shop/channel-checkout.service';
import { ShopService } from '../shop/shop.service';
import type {
  AuditTurn,
  Citation,
  Employee,
  EmployeeGuardrails,
} from '../platform/types';
import { DEFAULT_GUARDRAILS } from '../platform/types';

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

const RECOMMEND_INTENT_RE =
  /(پیشنهاد|توصیه|چی بخر|هدیه|recommend|suggest|gift|کدام.*(بهتر|بخر)|چی.*مناسب)/i;

const REFUND_RE =
  /(استرداد|بازگشت\s*وجه|پس\s*بگیر|refund|money\s*back)/i;
const CANCEL_ORDER_RE =
  /(لغو\s*سفارش|کنسل\s*سفارش|cancel\s*(my\s*)?order|order\s*cancel)/i;

const ORDER_NUMBER_RE = /\b((?:DR-?\d{3,})|(?:SF-[A-Z0-9]+))\b/i;
const PHONE_LAST4_RE = /\b(\d{4})\b/;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

const STATUS_FA: Record<string, string> = {
  pending: 'در انتظار تأیید',
  pending_payment: 'در انتظار پرداخت',
  confirmed: 'تأییدشده',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال‌شده',
  delivered: 'تحویل‌شده',
  cancelled: 'لغو‌شده',
};

function extractDiscountPercents(text: string): number[] {
  const found: number[] = [];
  const re =
    /(\d{1,3})\s*%|%\s*(\d{1,3})|(\d{1,3})\s*درصد|تخفیف\s*(\d{1,3})/gi;
  for (const m of text.matchAll(re)) {
    const n = Number(m[1] ?? m[2] ?? m[3] ?? m[4]);
    if (Number.isFinite(n) && n > 0 && n <= 100) found.push(n);
  }
  return found;
}

function matchesBlockedTopic(
  text: string,
  topics: string[],
): string | null {
  const lower = text.toLowerCase();
  for (const topic of topics) {
    const t = topic.trim();
    // Avoid accidental single-char / empty matches from bad config
    if (t.length < 2) continue;
    if (lower.includes(t.toLowerCase())) return t;
  }
  return null;
}

@Injectable()
export class RuntimeService {
  constructor(
    private readonly store: DataStore,
    private readonly commerce: CommerceService,
    private readonly retrieval: CommerceRetrievalService,
    private readonly knowledge: KnowledgeService,
    private readonly gateway: AiGatewayService,
    @Inject(forwardRef(() => HandoffService))
    private readonly handoff: HandoffService,
    private readonly checkout: ChannelCheckoutService,
    private readonly shop: ShopService,
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

    const storeConn = await this.store.getStore(tenantId);
    const employee = await this.store.employeeForTenant(tenantId);
    const guardrails: EmployeeGuardrails =
      employee?.guardrails ?? DEFAULT_GUARDRAILS;
    const syncHealth = storeConn?.syncHealth ?? 'never';

    if (
      HUMAN_REQUEST_RE.test(userText) &&
      guardrails.escalationRules.onCustomerRequest
    ) {
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

    const blocked = matchesBlockedTopic(userText, guardrails.blockedTopics);
    if (blocked && guardrails.escalationRules.onBlockedTopic) {
      await this.handoff.escalate(
        tenantId,
        conversationId,
        'blocked_topic',
        [],
        `موضوع ممنوع: ${blocked}`,
      );
      await this.audit(tenantId, conversationId, 'guardrail_block:topic', []);
      return {
        reply:
          'این موضوع خارج از محدوده مجاز کارمند فروش است؛ شما را به همکار انسانی وصل می‌کنم.',
        citations: [],
        decision: 'escalated:blocked_topic',
        ownership: 'human_owned',
      };
    }

    if (guardrails.restrictedMutations.refund && REFUND_RE.test(userText)) {
      await this.handoff.escalate(
        tenantId,
        conversationId,
        'skill_escalate',
        [],
        'درخواست استرداد وجه — مسدود توسط محدودیت سخت',
      );
      await this.audit(tenantId, conversationId, 'guardrail_block:refund', []);
      return {
        reply:
          'استرداد وجه توسط AI انجام نمی‌شود (محدودیت سخت). درخواست شما به همکار انسانی ارجاع شد.',
        citations: [],
        decision: 'guardrail_block:refund',
        ownership: 'human_owned',
      };
    }

    if (
      guardrails.restrictedMutations.cancel &&
      CANCEL_ORDER_RE.test(userText)
    ) {
      await this.handoff.escalate(
        tenantId,
        conversationId,
        'skill_escalate',
        [],
        'درخواست لغو سفارش — مسدود توسط محدودیت سخت',
      );
      await this.audit(tenantId, conversationId, 'guardrail_block:cancel', []);
      return {
        reply:
          'لغو سفارش توسط AI انجام نمی‌شود (محدودیت سخت). درخواست شما به همکار انسانی ارجاع شد.',
        citations: [],
        decision: 'guardrail_block:cancel',
        ownership: 'human_owned',
      };
    }

    const requestedDiscounts = extractDiscountPercents(userText);
    const overCap = requestedDiscounts.find(
      (p) => p > guardrails.discountCapPercent,
    );
    if (
      overCap != null &&
      guardrails.escalationRules.onDiscountAboveCap &&
      /(تخفیف|discount|٪|%)/i.test(userText)
    ) {
      await this.handoff.escalate(
        tenantId,
        conversationId,
        'discount_cap',
        [],
        `درخواست تخفیف ${overCap}٪ بالاتر از سقف ${guardrails.discountCapPercent}٪`,
      );
      await this.audit(
        tenantId,
        conversationId,
        'guardrail_block:discount_cap',
        [],
      );
      return {
        reply: `درخواست تخفیف ${overCap}٪ بالاتر از سقف مجاز فروشگاه (${guardrails.discountCapPercent}٪) است و بدون تأیید انسان اعمال نمی‌شود. شما را به همکار انسانی وصل می‌کنم.`,
        citations: [],
        decision: 'escalated:discount_cap',
        ownership: 'human_owned',
      };
    }

    if (employee && employee.status === 'paused') {
      return {
        reply: 'کارمند فروش فعلاً متوقف است.',
        citations: [],
        decision: 'refuse_paused',
      };
    }

    if (syncHealth !== 'healthy') {
      const nativeReady = await this.shop.hasNativeCatalog(tenantId);
      if (!nativeReady) {
        await this.handoff.escalate(
          tenantId,
          conversationId,
          'sync_unhealthy',
          [],
          'پرسش واقعی در حالی که همگام‌سازی ناسالم است',
        );
        return {
          reply:
            'همگام‌سازی فروشگاه سالم نیست؛ شما را به همکار انسانی وصل می‌کنم.',
          citations: [],
          decision: 'escalated:sync_unhealthy',
          ownership: 'human_owned',
        };
      }
    }

    const orderTurn = await this.tryOrderLookup(
      tenantId,
      conversationId,
      userText,
      employee,
    );
    if (orderTurn) return orderTurn;

    const checkoutTurn = await this.tryPlaceOrder(
      tenantId,
      conversationId,
      userText,
    );
    if (checkoutTurn) return checkoutTurn;

    const recommendTurn = await this.tryRecommend(
      tenantId,
      conversationId,
      userText,
      employee,
    );
    if (recommendTurn) return recommendTurn;

    // Commerce Core returns a bounded, pre-priced slice — the model never sees
    // the catalog and never does arithmetic on it.
    const [grounding, knowledgeHits] = await Promise.all([
      this.retrieval.groundTurn(tenantId, userText, { limit: 5 }),
      this.knowledge.search(tenantId, userText),
    ]);

    const citations: Citation[] = [
      ...grounding.products.slice(0, 3).map(
        (m): Citation => ({
          type: 'product',
          sku: m.sku,
          title: m.title,
          price: m.finalPrice,
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
      guardrails: {
        blockedTopics: guardrails.blockedTopics,
        discountCapPercent: guardrails.discountCapPercent,
        restrictedMutations: guardrails.restrictedMutations,
      },
      matches: grounding.products,
      promotions: grounding.promotions,
      articles: grounding.articles,
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
      'matches[].finalPrice is authoritative and already includes every applicable discount — quote it verbatim and never recalculate it.',
      'matches[].availabilityLabel is authoritative for stock — never infer availability from quantities.',
      'Prefer Persian if employee.language is fa.',
      'When answering from knowledge, cite sourceAttribution.',
      `Never offer discounts above ${guardrails.discountCapPercent}%. Never process refunds or order cancellations.`,
      `CONTEXT_JSON:${contextJson}`,
    ].join('\n');

    const completion = await this.gateway.complete({
      system,
      user: userText,
      tenantId,
      conversationId,
      feature: 'sales_reply',
      taskClass: 'chat.reply.cheap',
      routeHint: 'cheap',
    });

    const replyDiscounts = extractDiscountPercents(completion.text);
    const replyOverCap = replyDiscounts.find(
      (p) => p > guardrails.discountCapPercent,
    );
    if (
      replyOverCap != null &&
      guardrails.escalationRules.onDiscountAboveCap
    ) {
      await this.handoff.escalate(
        tenantId,
        conversationId,
        'discount_cap',
        citations,
        `پیشنهاد مدل ${replyOverCap}٪ بالاتر از سقف مجاز`,
      );
      await this.audit(
        tenantId,
        conversationId,
        'guardrail_block:discount_cap_reply',
        citations,
        completion.meter,
      );
      return {
        reply: `پاسخ مدل شامل تخفیف بالاتر از سقف (${guardrails.discountCapPercent}٪) بود و اعمال نشد. همکار انسانی پیگیری می‌کند.`,
        citations,
        decision: 'escalated:discount_cap',
        ownership: 'human_owned',
      };
    }

    let decision = 'answer_empty_catalog';
    if (grounding.products.length) decision = 'answer_grounded';
    else if (knowledgeHits.length) decision = 'answer_knowledge';
    if (completion.mode === 'live') decision = `${decision}:live`;
    else if (completion.meter.fallbackReason) {
      decision = `${decision}:mock_fallback`;
    }

    await this.store.addAudit({
      id: uuid(),
      tenantId,
      conversationId,
      decision,
      citations,
      gateway: completion.meter,
    });

    return {
      reply: completion.text,
      citations,
      decision,
      ownership: 'ai_owned',
    };
  }

  private async tryPlaceOrder(
    tenantId: string,
    conversationId: string,
    userText: string,
  ): Promise<TurnResult | null> {
    const conversation = await this.store.getConversation(conversationId);
    if (!conversation) return null;
    if (
      conversation.channel !== 'telegram' &&
      conversation.channel !== 'bale' &&
      conversation.channel !== 'instagram'
    ) {
      return null;
    }
    const handled = await this.checkout.handleTurn({
      tenantId,
      conversationId,
      channel: conversation.channel,
      userText,
      externalThreadId: conversation.externalThreadId,
    });
    if (!handled) return null;
    const result: TurnResult = {
      reply: handled.reply,
      citations: [],
      decision: handled.decision,
    };
    await this.audit(tenantId, conversationId, result.decision, []);
    return result;
  }

  private async tryRecommend(
    tenantId: string,
    conversationId: string,
    userText: string,
    employee: Employee | null,
  ): Promise<TurnResult | null> {
    const hasBudget = this.commerce.parseBudgetIrr(userText) != null;
    const hasIntent = RECOMMEND_INTENT_RE.test(userText) || hasBudget;
    // Category-only "کفش می‌خوام" also routes here when recommend skill on
    const categoryAsk =
      /(پیراهن|کیف|کفش|لینن|اسپرت).*(می‌خوام|میخوام|دارید|بده|پیدا)/i.test(
        userText,
      ) || /^(پیراهن|کیف|کفش)\b/i.test(userText.trim());

    if (!hasIntent && !categoryAsk) return null;

    if (!employee?.skills.recommend) {
      const result: TurnResult = {
        reply:
          'مهارت پیشنهاد محصول برای این کارمند فعال نیست. می‌توانید نام دقیق‌تری از کاتالوگ بپرسید.',
        citations: [],
        decision: 'recommend_skill_disabled',
      };
      await this.audit(tenantId, conversationId, result.decision, []);
      return result;
    }

    const picks = await this.recommendFromCommerceCore(tenantId, userText);
    if (picks.length === 0) {
      const result: TurnResult = {
        reply:
          'با این فیلتر در کاتالوگ همگام‌شده چیزی پیدا نکردم. بودجه یا دسته را عوض کنید — محصولی اختراع نمی‌کنم.',
        citations: [],
        decision: 'recommend_empty',
      };
      await this.audit(tenantId, conversationId, result.decision, []);
      return result;
    }

    const citations: Citation[] = picks.map((p) => ({
      type: 'product' as const,
      sku: p.sku,
      title: p.title,
      price: p.finalPrice,
    }));

    const lines = picks.map((p) => {
      const discounted = p.discountAmount > 0;
      const price = discounted
        ? `${p.finalPrice.toLocaleString('fa-IR')} ${p.currency} (به‌جای ${p.listPrice.toLocaleString('fa-IR')})`
        : `${p.finalPrice.toLocaleString('fa-IR')} ${p.currency}`;
      const why = discounted
        ? `تخفیف فعال: ${p.appliedDiscounts.map((d) => d.name).join('، ')}`
        : 'از کاتالوگ فروشگاه';
      return `• ${p.title} (${p.sku}) — ${price} — ${p.availabilityLabel}\n  دلیل: ${why}`;
    });

    const firstSku = picks[0]?.sku;
    const conversation = await this.store.getConversation(conversationId);
    const messaging =
      conversation?.channel === 'telegram' ||
      conversation?.channel === 'bale' ||
      conversation?.channel === 'instagram';
    const buyHint =
      messaging && firstSku
        ? `\n\nبرای ثبت سفارش از همین گفتگو بنویسید: می‌خوام بخرم ${firstSku}`
        : '';

    const result: TurnResult = {
      reply: `پیشنهاد بر اساس کاتالوگ فروشگاه (بدون اختراع کد کالا):\n${lines.join('\n')}${buyHint}`,
      citations,
      decision: 'recommend',
    };
    await this.audit(tenantId, conversationId, result.decision, citations);
    return result;
  }

  /**
   * Ranking happens here; pricing and stock come from Commerce Core already
   * resolved so a recommendation can never quote a stale number.
   */
  private async recommendFromCommerceCore(tenantId: string, userText: string) {
    const budget = this.commerce.parseBudgetIrr(userText.toLowerCase());
    const candidates = await this.retrieval.searchProducts(tenantId, userText, {
      limit: 20,
    });

    const affordable =
      budget == null
        ? candidates
        : candidates.filter((p) => p.finalPrice <= budget);
    if (affordable.length === 0) return [];

    const available = affordable.filter(
      (p) => p.availability !== 'out_of_stock',
    );
    const ranked = available.length > 0 ? available : affordable;
    return ranked.slice(0, 3);
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
          'برای پیگیری، لطفاً شماره سفارش را بفرستید (مثلاً SF-ABC12 یا DR-1001). پس از آن چهار رقم آخر موبایل را برای تأیید می‌خواهم.',
        citations: [],
        decision: 'order_lookup_need_id',
      };
      await this.audit(tenantId, conversationId, result.decision, []);
      return result;
    }

    const normalized = orderNumber.toUpperCase().replace(/^DR(\d)/, 'DR-$1');
    const native = await this.shop.lookupStorefrontOrder(tenantId, normalized);
    if (native?.found) {
      const last4 = this.extractPhoneLast4ForVerify(userText, history);
      if (!last4 || native.order.customerPhone.slice(-4) !== last4) {
        const result: TurnResult = {
          reply: `سفارش ${native.order.orderNumber} را پیدا کردم. چهار رقم آخر موبایل را بفرستید تا وضعیت را بگویم.`,
          citations: [],
          decision: 'order_lookup_need_verify',
        };
        await this.audit(tenantId, conversationId, result.decision, []);
        return result;
      }
      const statusFa = STATUS_FA[native.order.status] ?? native.order.status;
      const result: TurnResult = {
        reply: `وضعیت سفارش ${native.order.orderNumber} (کانال ${native.order.channel}):\n• وضعیت: ${statusFa}\n• مبلغ: ${native.order.totalAmount.toLocaleString('fa-IR')} ${native.order.currency}`,
        citations: [{ type: 'order', orderNumber: native.order.orderNumber, status: native.order.status }],
        decision: 'order_lookup',
      };
      await this.audit(tenantId, conversationId, result.decision, result.citations);
      return result;
    }

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
      reply: `وضعیت سفارش ${order.orderNumber} (از همگام‌سازی فروشگاه):\n• وضعیت: ${statusFa}\n• ${tracking}\nمنبع: هستهٔ تجارت · همگام‌شده`,
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
    gateway?: AuditTurn['gateway'],
  ) {
    await this.store.addAudit({
      id: uuid(),
      tenantId,
      conversationId,
      decision,
      citations,
      gateway: gateway ?? null,
    });
  }
}
