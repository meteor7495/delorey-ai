import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DataStore } from '../platform/data.store';
import { CommerceService } from '../commerce/commerce.service';
import { CommerceRetrievalService } from '../shop/commerce-retrieval.service';
import type { ProductFacts } from '../shop/commerce-retrieval.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { HandoffService } from '../inbox/handoff.service';
import { ChannelCheckoutService } from '../shop/channel-checkout.service';
import { ShopService } from '../shop/shop.service';
import { CustomersService } from '../shop/customers.service';
import { McpClientService } from '../mcp/client/mcp-client.service';
import { EmployeePermissionService } from '../ai-ops/employee-permission.service';
import { AiActivityService } from '../ai-ops/ai-activity.service';
import { CustomerMemoryService } from '../ai-ops/customer-memory.service';
import {
  extractOrderNumber,
  isCancelOrderIntent,
  isHumanRequest,
  isOrderLookupIntent,
  isRecommendIntent,
  isRefundIntent,
  normalizeShopperText,
} from '../shop/domain';
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

export function composeGroundedReply(
  products: ProductFacts[],
  knowledgeHits: Array<{
    doc: { title: string; sourceAttribution: string };
    chunk: { content: string };
  }>,
): string {
  const productLines = products.slice(0, 3).map((p) => {
    const price = Number(p.finalPrice).toLocaleString('fa-IR');
    return `• ${p.title}\n  کد: ${p.sku} — ${price} ${p.currency} — ${p.availabilityLabel}`;
  });
  const knowledgeLines = knowledgeHits.slice(0, 2).map((h) => {
    return `• ${h.doc.title}: ${h.chunk.content}\n  منبع: ${h.doc.sourceAttribution}`;
  });
  if (productLines.length && knowledgeLines.length) {
    return `بر اساس کاتالوگ و دانش فروشگاه:\n${knowledgeLines.join('\n')}\n${productLines.join('\n')}\n\nبرای افزودن به سبد، کد کالا را بفرستید.`;
  }
  if (productLines.length) {
    return `بر اساس کاتالوگ فروشگاه:\n${productLines.join('\n')}\n\nبرای افزودن به سبد، کد کالا را بفرستید.`;
  }
  if (knowledgeLines.length) {
    return `بر اساس دانش فروشگاه:\n${knowledgeLines.join('\n')}`;
  }
  return 'این مورد را در کاتالوگ پیدا نکردم. کد کالا را مثل CASE-220 بفرستید.';
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_LAST4_RE = /\b(\d{4})\b/;

const STATUS_FA: Record<string, string> = {
  pending: 'در انتظار تأیید',
  pending_payment: 'در انتظار پرداخت',
  pending_approval: 'در انتظار تأیید ادمین',
  approved: 'تأییدشده',
  confirmed: 'تأییدشده',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال‌شده',
  delivered: 'تحویل‌شده',
  cancelled: 'لغو‌شده',
  rejected: 'ردشده',
  payment_failed: 'پرداخت ناموفق',
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
    private readonly customers: CustomersService,
    private readonly mcp: McpClientService,
    private readonly permissions: EmployeePermissionService,
    private readonly activity: AiActivityService,
    private readonly customerMemory: CustomerMemoryService,
  ) {}

  /**
   * Capability discovery for internal agents / future LLM tool-calling loops.
   * Filters by permission scopes; does not hardcode tool lists into executeTurn.
   */
  discoverMcpTools(tenantId: string, employeeId?: string, scopes?: string[]) {
    const ctx = this.mcp.createContext({
      tenantId,
      employeeId,
      scopes: scopes as import('../mcp/core/types').McpPermission[] | undefined,
    });
    return this.mcp.discoverTools(ctx);
  }

  /** Execute an MCP tool in-process with tenant-bound internal context. */
  executeMcpTool(
    tenantId: string,
    toolName: string,
    args: unknown,
    opts?: {
      userId?: string;
      employeeId?: string;
      idempotencyKey?: string;
      scopes?: string[];
    },
  ) {
    const ctx = this.mcp.createContext({
      tenantId,
      userId: opts?.userId,
      employeeId: opts?.employeeId,
      scopes: opts?.scopes as
        | import('../mcp/core/types').McpPermission[]
        | undefined,
    });
    return this.mcp.callTool(ctx, toolName, args, {
      idempotencyKey: opts?.idempotencyKey,
    });
  }

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
    const employee = await this.store.employeeForTenant(tenantId, 'sales');
    const guardrails: EmployeeGuardrails =
      employee?.guardrails ?? DEFAULT_GUARDRAILS;
    const syncHealth = storeConn?.syncHealth ?? 'never';

    // Load customer memory when conversation is linked
    const earlyConversation = await this.store.getConversation(conversationId);
    if (earlyConversation?.customerId) {
      await this.customerMemory
        .recompute(tenantId, earlyConversation.customerId)
        .catch(() => null);
    }

    if (
      isHumanRequest(userText) &&
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

    if (guardrails.restrictedMutations.refund && isRefundIntent(userText)) {
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
      isCancelOrderIntent(userText)
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

    await this.linkKnownCustomer(conversation);

    const normalizedText = normalizeShopperText(userText);

    const checkoutTurn = await this.tryPlaceOrder(
      tenantId,
      conversationId,
      normalizedText,
    );
    if (checkoutTurn) return checkoutTurn;

    const orderTurn = await this.tryOrderLookup(
      tenantId,
      conversationId,
      normalizedText,
      employee,
    );
    if (orderTurn) return orderTurn;

    const recommendTurn = await this.tryRecommend(
      tenantId,
      conversationId,
      normalizedText,
      employee,
    );
    if (recommendTurn) return recommendTurn;

    // Commerce Core returns a bounded, pre-priced slice — the model never sees
    // the catalog and never does arithmetic on it.
    const [grounding, knowledgeHits] = await Promise.all([
      this.retrieval.groundTurn(tenantId, normalizedText, { limit: 5 }),
      this.knowledge.search(tenantId, normalizedText),
    ]);

    // Permission-filtered MCP tool path (e.g. commerce_search_products) when
    // grounded catalog is empty but employee may search via tools.
    if (
      employee &&
      grounding.products.length === 0 &&
      this.permissions.hasPermission(employee, 'products.read')
    ) {
      try {
        const scopes = this.permissions.resolveScopes(employee);
        const tools = this.discoverMcpTools(tenantId, employee.id, scopes);
        const searchTool = tools.find((t) => t.name === 'commerce_search_products');
        if (searchTool) {
          const toolResult = await this.executeMcpTool(
            tenantId,
            'commerce_search_products',
            { query: normalizedText, limit: 5 },
            { employeeId: employee.id, scopes, idempotencyKey: uuid() },
          );
          await this.activity.record({
            tenantId,
            employeeId: employee.id,
            actorType: 'employee',
            action: 'runtime.mcp_search',
            tool: 'commerce_search_products',
            result: 'success',
            inputSanitized: { query: normalizedText },
          });
          const items = (
            toolResult as { items?: Array<{ sku: string; title: string; price?: number; finalPrice?: number }> }
          )?.items;
          if (Array.isArray(items) && items.length) {
            const citations: Citation[] = items.slice(0, 3).map((m) => ({
              type: 'product' as const,
              sku: m.sku,
              title: m.title,
              price: Number(m.finalPrice ?? m.price ?? 0),
            }));
            const reply = items
              .slice(0, 3)
              .map((p) => {
                const price = Number(p.finalPrice ?? p.price ?? 0).toLocaleString(
                  'fa-IR',
                );
                return `• ${p.title}\n  کد: ${p.sku} — ${price}`;
              })
              .join('\n');
            await this.store.addAudit({
              id: uuid(),
              tenantId,
              conversationId,
              decision: 'answer_mcp_tools',
              citations,
            });
            return {
              reply: `بر اساس ابزار کاتالوگ:\n${reply}\n\nبرای افزودن به سبد، کد کالا را بفرستید.`,
              citations,
              decision: 'answer_mcp_tools',
              ownership: 'ai_owned',
            };
          }
        }
      } catch {
        // Fall through to grounded reply — never invent data on tool failure
      }
    }

    // Optional gateway planning (mock-safe): enrich tone only; prices stay from tools/grounding
    if (employee?.instructions && grounding.products.length + knowledgeHits.length > 0) {
      try {
        await this.gateway.complete({
          tenantId,
          system: employee.instructions,
          user: `Shopper: ${normalizedText}\nUse only provided catalog facts.`,
          feature: 'runtime.plan',
          conversationId,
          maxTokens: 64,
        });
      } catch {
        // Gateway optional — ignore failures in mock/billing edge cases
      }
    }

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

    // Commerce Core is the source of truth — do not ask the LLM/mock to
    // restate prices. Mock JSON parsing was returning a generic refuse.
    const reply = composeGroundedReply(grounding.products, knowledgeHits);
    let decision = 'answer_empty_catalog';
    if (grounding.products.length) decision = 'answer_grounded';
    else if (knowledgeHits.length) decision = 'answer_knowledge';

    if (employee) {
      await this.activity
        .record({
          tenantId,
          employeeId: employee.id,
          actorType: 'employee',
          action: `runtime.${decision}`,
          result: 'success',
        })
        .catch(() => undefined);
    }

    await this.store.addAudit({
      id: uuid(),
      tenantId,
      conversationId,
      decision,
      citations,
    });

    return {
      reply,
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
    const hasIntent = isRecommendIntent(userText) || hasBudget;
    if (!hasIntent) return null;

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
      isOrderLookupIntent(userText) ||
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

    let orderNumber = extractOrderNumber(userText);
    if (!orderNumber) {
      orderNumber = extractOrderNumber(recentText);
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

  private async linkKnownCustomer(
    conversation:
      | {
          id: string;
          tenantId: string;
          channel: string;
          customerId: string | null;
          externalThreadId: string | null;
        }
      | null
      | undefined,
  ) {
    if (!conversation?.id || conversation.customerId || !conversation.externalThreadId) {
      return;
    }
    if (
      conversation.channel !== 'telegram' &&
      conversation.channel !== 'bale' &&
      conversation.channel !== 'instagram'
    ) {
      return;
    }
    const known = await this.customers.lookupByIdentity(
      conversation.tenantId,
      conversation.channel,
      conversation.externalThreadId,
    );
    if (!known) return;
    await this.store.linkConversationCustomer(conversation.id, known.id);
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
