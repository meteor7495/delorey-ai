import type {
  AiProviderPort,
  CostEstimate,
  EmbedRequest,
  EmbedResponse,
  GenerateRequest,
  GenerateResponse,
  ModelInfo,
  ProviderCapabilities,
  ProviderHealth,
  StreamChunk,
  TokenUsage,
  VisionRequest,
} from '../../domain/provider.port';
import { GatewayError } from '../../domain/gateway-errors';

/**
 * Deterministic grounded mock — uses CONTEXT_JSON in system message only.
 * Last-resort failover and AI_GATEWAY_MODE=mock.
 */
export class MockProvider implements AiProviderPort {
  readonly id = 'mock';
  readonly capabilities: ProviderCapabilities = {
    generate: true,
    stream: true,
    embeddings: false,
    vision: false,
    toolCalling: false,
    jsonMode: false,
    usage: true,
    healthCheck: true,
    listModels: true,
    estimateCost: true,
    contextWindow: 32_000,
    costTier: 'free',
    latencyClass: 'interactive',
    languageQuality: 'fa_commerce_ok',
  };

  async generate(req: GenerateRequest): Promise<GenerateResponse> {
    const started = Date.now();
    const system =
      req.messages.find((m) => m.role === 'system')?.content ?? '';
    const text = mockFromContext(system);
    return {
      text,
      finishReason: 'stop',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      providerId: this.id,
      modelId: 'grounded-template',
      latencyMs: Date.now() - started,
      rawCost: { currency: 'USD', amount: 0, basis: 'request' },
    };
  }

  async *stream(req: GenerateRequest): AsyncIterable<StreamChunk> {
    const res = await this.generate(req);
    if (res.text) yield { type: 'delta', text: res.text };
    yield { type: 'usage', usage: res.usage };
    yield {
      type: 'done',
      finishReason: res.finishReason,
      modelId: res.modelId,
    };
  }

  async embeddings(_req: EmbedRequest): Promise<EmbedResponse> {
    throw new GatewayError('unavailable', 'mock embeddings not supported', {
      providerId: this.id,
      retryable: false,
    });
  }

  async vision(_req: VisionRequest): Promise<GenerateResponse> {
    throw new GatewayError('unavailable', 'mock vision not supported', {
      providerId: this.id,
      retryable: false,
    });
  }

  toolCalling(req: GenerateRequest): Promise<GenerateResponse> {
    return this.generate(req);
  }

  jsonMode(req: GenerateRequest): Promise<GenerateResponse> {
    return this.generate(req);
  }

  usage(_raw: unknown): TokenUsage {
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  async healthCheck(): Promise<ProviderHealth> {
    return {
      healthy: true,
      latencyMs: 0,
      checkedAt: new Date().toISOString(),
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: 'grounded-template',
        displayName: 'Grounded mock',
        capabilities: { costTier: 'free', generate: true },
      },
    ];
  }

  async estimateCost(_input: {
    modelId: string;
    promptTokens: number;
    completionTokens: number;
  }): Promise<CostEstimate> {
    return { currency: 'USD', amount: 0, basis: 'request' };
  }
}

export function mockFromContext(system: string): string {
  const block = system.match(/CONTEXT_JSON:([\s\S]*)$/);
  if (!block?.[1]) {
    return 'الان اطلاعات مطمئنی ندارم؛ لطفاً بعداً دوباره بپرسید یا با پشتیبانی فروشگاه صحبت کنید.';
  }
  try {
    const ctx = JSON.parse(block[1].trim()) as {
      syncHealth?: string;
      matches?: Array<{
        sku: string;
        title: string;
        price: number;
        inStock: boolean;
        currency: string;
      }>;
      knowledge?: Array<{
        title: string;
        body: string;
        sourceAttribution: string;
      }>;
    };
    if (ctx.syncHealth && ctx.syncHealth !== 'healthy') {
      return 'همگام‌سازی فروشگاه سالم نیست؛ نمی‌توانم قیمت یا موجودی را با اطمینان بگویم.';
    }

    const knowledge = ctx.knowledge ?? [];
    const matches = ctx.matches ?? [];

    if (knowledge.length > 0 && matches.length === 0) {
      const lines = knowledge.slice(0, 3).map((k) => {
        return `• ${k.title}: ${k.body}\n  منبع: ${k.sourceAttribution}`;
      });
      return `بر اساس دانش فروشگاه:\n${lines.join('\n')}`;
    }

    if (knowledge.length > 0 && matches.length > 0) {
      const kLines = knowledge.slice(0, 2).map((k) => {
        return `• ${k.title}: ${k.body}\n  منبع: ${k.sourceAttribution}`;
      });
      const pLines = matches.slice(0, 2).map((m) => {
        const stock = m.inStock ? 'موجود' : 'ناموجود';
        return `• ${m.title} (${m.sku}) — ${m.price.toLocaleString('fa-IR')} ${m.currency} — ${stock}`;
      });
      return `بر اساس دانش و کاتالوگ فروشگاه:\n${kLines.join('\n')}\n${pLines.join('\n')}`;
    }

    if (matches.length === 0) {
      return 'این مورد را در کاتالوگ یا دانش فروشگاه پیدا نکردم. اگر نام دقیق‌تری بدهید دوباره جستجو می‌کنم.';
    }
    const lines = matches.slice(0, 3).map((m) => {
      const stock = m.inStock ? 'موجود' : 'ناموجود';
      return `• ${m.title} (${m.sku}) — ${m.price.toLocaleString('fa-IR')} ${m.currency} — ${stock}`;
    });
    return `بر اساس کاتالوگ فروشگاه:\n${lines.join('\n')}`;
  } catch {
    return 'الان اطلاعات مطمئنی ندارم.';
  }
}
