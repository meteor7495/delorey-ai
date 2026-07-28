import { Logger } from '@nestjs/common';
import { GatewayError } from '../../domain/gateway-errors';
import type {
  AiMessage,
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
import type { RouteHint } from '../../domain/routing.types';

type OpenAiChatResponse = {
  id?: string;
  model?: string;
  choices?: Array<{
    finish_reason?: string | null;
    message?: { role?: string; content?: string | null };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string; type?: string; code?: string };
};

type OpenAiEmbedResponse = {
  data?: Array<{ embedding?: number[]; index?: number }>;
  model?: string;
  usage?: { prompt_tokens?: number; total_tokens?: number };
  error?: { message?: string };
};

export type OpenAiCompatibleProviderConfig = {
  /** Plugin / meter label: openai | gapgpt | liara | boxapi | ninerouter | custom */
  providerId: string;
  apiKey: string;
  /** OpenAI-compatible root ending in /v1 */
  baseUrl: string;
  modelCheap: string;
  modelPremium: string;
  timeoutMs: number;
  pricePromptPer1k?: number;
  priceCompletionPer1k?: number;
};

/** Any OpenAI-compatible `/chat/completions` upstream (GapGPT, Liara, BoxAPI AI, 9Router, …). */
export class OpenAiCompatibleProvider implements AiProviderPort {
  readonly id: string;
  readonly capabilities: ProviderCapabilities;
  private readonly log = new Logger(OpenAiCompatibleProvider.name);

  constructor(private readonly config: OpenAiCompatibleProviderConfig) {
    this.id = config.providerId;
    this.capabilities = {
      generate: true,
      stream: true,
      embeddings: true,
      vision: false,
      toolCalling: true,
      jsonMode: true,
      usage: true,
      healthCheck: true,
      listModels: true,
      estimateCost: true,
      contextWindow: 128_000,
      costTier: 'cheap',
      latencyClass: 'interactive',
      languageQuality: 'unknown',
    };
  }

  resolveModelForHint(hint: RouteHint | undefined): string {
    if (hint === 'premium') return this.config.modelPremium;
    return this.config.modelCheap;
  }

  async generate(req: GenerateRequest): Promise<GenerateResponse> {
    const modelId = req.modelId || this.resolveModelForHint(req.routeHint);
    const url = `${this.config.baseUrl}/chat/completions`;
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      req.timeoutMs || this.config.timeoutMs,
    );

    try {
      const body: Record<string, unknown> = {
        model: modelId,
        temperature: req.temperature ?? 0.3,
        max_tokens: req.maxTokens ?? 600,
        messages: toOpenAiMessages(req.messages),
      };
      if (req.jsonMode) {
        body.response_format = { type: 'json_object' };
      }
      if (req.tools?.length) {
        body.tools = req.tools.map((t) => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parametersJsonSchema,
          },
        }));
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - started;
      const raw = (await res.json().catch(() => ({}))) as OpenAiChatResponse;

      if (!res.ok) {
        throw this.mapHttpError(res.status, raw, modelId);
      }

      const text = raw.choices?.[0]?.message?.content?.trim() ?? '';
      if (!text && !req.tools?.length) {
        throw new GatewayError('invalid_response', 'Empty completion text', {
          providerId: this.id,
          retryable: true,
        });
      }

      const usage = this.usage(raw);
      const estimate = await this.estimateCost({
        modelId,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
      });

      return {
        text: text || null,
        finishReason: raw.choices?.[0]?.finish_reason ?? 'stop',
        usage,
        providerId: this.id,
        modelId: raw.model ?? modelId,
        latencyMs,
        rawCost: estimate,
      };
    } catch (err) {
      if (err instanceof GatewayError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new GatewayError('timeout', `${this.id} request timed out`, {
          providerId: this.id,
          retryable: true,
          cause: err,
        });
      }
      this.log.warn(
        `${this.id} generate failed tenant=${req.tenantId}: ${
          err instanceof Error ? err.message : 'unknown'
        }`,
      );
      throw new GatewayError(
        'unavailable',
        err instanceof Error ? err.message : `${this.id} unavailable`,
        { providerId: this.id, retryable: true, cause: err },
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async *stream(req: GenerateRequest): AsyncIterable<StreamChunk> {
    // MVP: non-SSE fallback via generate (Gateway may prefer stream later).
    const res = await this.generate(req);
    if (res.text) {
      yield { type: 'delta', text: res.text };
    }
    yield { type: 'usage', usage: res.usage };
    yield {
      type: 'done',
      finishReason: res.finishReason,
      modelId: res.modelId,
    };
  }

  async embeddings(req: EmbedRequest): Promise<EmbedResponse> {
    const url = `${this.config.baseUrl}/embeddings`;
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      req.timeoutMs || this.config.timeoutMs,
    );

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: req.modelId || this.config.modelCheap,
          input: req.texts,
        }),
        signal: controller.signal,
      });
      const latencyMs = Date.now() - started;
      const raw = (await res.json().catch(() => ({}))) as OpenAiEmbedResponse;
      if (!res.ok) {
        throw this.mapHttpError(
          res.status,
          { error: raw.error },
          req.modelId,
        );
      }
      const vectors = (raw.data ?? [])
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
        .map((d) => d.embedding ?? []);
      const promptTokens = raw.usage?.prompt_tokens ?? 0;
      return {
        vectors,
        usage: {
          promptTokens,
          completionTokens: 0,
          totalTokens: raw.usage?.total_tokens ?? promptTokens,
        },
        providerId: this.id,
        modelId: raw.model ?? req.modelId,
        latencyMs,
      };
    } catch (err) {
      if (err instanceof GatewayError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new GatewayError('timeout', `${this.id} embed timed out`, {
          providerId: this.id,
          retryable: true,
          cause: err,
        });
      }
      throw new GatewayError(
        'unavailable',
        err instanceof Error ? err.message : `${this.id} embed unavailable`,
        { providerId: this.id, retryable: true, cause: err },
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async vision(_req: VisionRequest): Promise<GenerateResponse> {
    throw new GatewayError('unavailable', `${this.id} vision not enabled`, {
      providerId: this.id,
      retryable: false,
    });
  }

  toolCalling(req: GenerateRequest): Promise<GenerateResponse> {
    return this.generate(req);
  }

  jsonMode(req: GenerateRequest): Promise<GenerateResponse> {
    return this.generate({ ...req, jsonMode: true });
  }

  usage(raw: unknown): TokenUsage {
    const u = (raw as OpenAiChatResponse)?.usage;
    const promptTokens = u?.prompt_tokens ?? 0;
    const completionTokens = u?.completion_tokens ?? 0;
    return {
      promptTokens,
      completionTokens,
      totalTokens: u?.total_tokens ?? promptTokens + completionTokens,
    };
  }

  async healthCheck(): Promise<ProviderHealth> {
    const started = Date.now();
    const url = `${this.config.baseUrl}/models`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
        signal: AbortSignal.timeout(Math.min(this.config.timeoutMs, 5000)),
      });
      return {
        healthy: res.ok || res.status === 404,
        latencyMs: Date.now() - started,
        checkedAt: new Date().toISOString(),
        detail: res.ok ? undefined : `HTTP ${res.status}`,
      };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - started,
        checkedAt: new Date().toISOString(),
        detail: err instanceof Error ? err.message : 'health_failed',
      };
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: this.config.modelCheap,
        displayName: `${this.id} cheap`,
        capabilities: { costTier: 'cheap', generate: true },
      },
      {
        id: this.config.modelPremium,
        displayName: `${this.id} premium`,
        capabilities: { costTier: 'premium', generate: true },
      },
    ];
  }

  async estimateCost(input: {
    modelId: string;
    promptTokens: number;
    completionTokens: number;
  }): Promise<CostEstimate> {
    const pp = this.config.pricePromptPer1k;
    const cp = this.config.priceCompletionPer1k;
    if (pp == null || cp == null) {
      return { currency: 'USD', amount: 0, basis: 'unknown' };
    }
    const amount =
      (input.promptTokens / 1000) * pp +
      (input.completionTokens / 1000) * cp;
    return { currency: 'USD', amount, basis: 'tokens' };
  }

  private mapHttpError(
    status: number,
    body: OpenAiChatResponse,
    modelId: string,
  ): GatewayError {
    const msg =
      body.error?.message ??
      `${this.id} HTTP ${status} (model=${modelId}, details redacted)`;
    if (status === 401 || status === 403) {
      return new GatewayError('auth', msg, {
        providerId: this.id,
        retryable: false,
      });
    }
    if (status === 402 || status === 429) {
      return new GatewayError('rate_limit', msg, {
        providerId: this.id,
        retryable: true,
      });
    }
    if (status === 400 && /content.?filter|safety/i.test(msg)) {
      return new GatewayError('content_filter', msg, {
        providerId: this.id,
        retryable: false,
      });
    }
    if (status >= 500) {
      return new GatewayError('unavailable', msg, {
        providerId: this.id,
        retryable: true,
      });
    }
    return new GatewayError('unavailable', msg, {
      providerId: this.id,
      retryable: status >= 500,
    });
  }
}

function toOpenAiMessages(
  messages: AiMessage[],
): Array<{ role: string; content: string }> {
  return messages.map((m) => {
    if (m.role === 'tool') {
      return { role: 'tool', content: m.content };
    }
    return {
      role: m.role,
      content: m.content ?? '',
    };
  });
}
