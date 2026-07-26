import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DataStore } from '../platform/data.store';
import { CommerceService } from '../commerce/commerce.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { HandoffService } from '../inbox/handoff.service';
import type { Citation } from '../platform/types';

export type TurnResult = {
  reply: string;
  citations: Citation[];
  decision: string;
  ownership?: 'ai_owned' | 'human_owned';
};

const HUMAN_REQUEST_RE =
  /(انسان|اپراتور|پشتیبان|همکار|آدم|human|agent|operator|support)/i;

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
      'Never invent SKUs, prices, stock, or policies. If missing, say you do not know.',
      'Prefer Persian if employee.language is fa.',
      'When answering from knowledge, cite sourceAttribution.',
      `CONTEXT_JSON:${contextJson}`,
    ].join('\n');

    const completion = await this.gateway.complete({ system, user: userText });

    let decision = 'answer_no_context';
    if (matches.length && knowledgeHits.length) decision = 'answer_grounded';
    else if (matches.length) decision = 'answer_grounded';
    else if (knowledgeHits.length) decision = 'answer_knowledge';
    else decision = 'answer_empty_catalog';

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
}
