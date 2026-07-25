import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { MemoryStore } from '../platform/memory.store';
import { CommerceService } from '../commerce/commerce.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';

export type TurnResult = {
  reply: string;
  citations: Array<{ sku: string; title: string; price: number }>;
  decision: string;
};

@Injectable()
export class RuntimeService {
  constructor(
    private readonly store: MemoryStore,
    private readonly commerce: CommerceService,
    private readonly gateway: AiGatewayService,
  ) {}

  async executeTurn(tenantId: string, conversationId: string, userText: string): Promise<TurnResult> {
    const store = this.store.stores.get(tenantId);
    const employee = this.store.employeeForTenant(tenantId);
    const syncHealth = store?.syncHealth ?? 'never';

    // Cost layer stub: always need intelligence for Slice 01 chat.
    if (employee && employee.status === 'paused') {
      return {
        reply: 'کارمند فروش فعلاً متوقف است.',
        citations: [],
        decision: 'refuse_paused',
      };
    }

    if (syncHealth !== 'healthy') {
      return {
        reply:
          'همگام‌سازی فروشگاه سالم نیست؛ نمی‌توانم درباره قیمت یا موجودی با اطمینان جواب بدهم.',
        citations: [],
        decision: 'refuse_sync_unhealthy',
      };
    }

    const matches = this.commerce.searchProducts(tenantId, userText);
    const citations = matches.slice(0, 3).map((m) => ({
      sku: m.sku,
      title: m.title,
      price: m.price,
    }));

    const contextJson = JSON.stringify({
      syncHealth,
      employee: employee
        ? { name: employee.name, tone: employee.tone, language: employee.language }
        : null,
      matches: matches.slice(0, 5).map((m) => ({
        sku: m.sku,
        title: m.title,
        price: m.price,
        currency: m.currency,
        inStock: m.inStock,
        description: m.description ?? null,
      })),
    });

    const system = [
      'You are a DeloRey AI Sales Employee. Answer only from CONTEXT_JSON.',
      'Never invent SKUs, prices, or stock. If missing, say you do not know.',
      'Prefer Persian if employee.language is fa.',
      `CONTEXT_JSON:${contextJson}`,
    ].join('\n');

    const completion = await this.gateway.complete({ system, user: userText });

    this.store.audits.push({
      id: uuid(),
      tenantId,
      conversationId,
      decision: matches.length ? 'answer_grounded' : 'answer_empty_catalog',
      citations,
      createdAt: new Date().toISOString(),
    });

    return {
      reply: completion.text,
      citations,
      decision: matches.length ? 'answer_grounded' : 'answer_empty_catalog',
    };
  }
}
