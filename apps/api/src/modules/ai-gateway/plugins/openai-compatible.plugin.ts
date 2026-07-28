import { Logger } from '@nestjs/common';
import { GatewayError } from '../gateway-errors';
import type {
  ChatProviderPlugin,
  CompletionRequest,
  CompletionResponse,
  RouteHint,
} from '../provider-plugin';

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

export type OpenAiCompatiblePluginConfig = {
  /** Plugin / meter label: openai | gapgpt | liara | boxapi | custom */
  providerId: string;
  apiKey: string;
  /** OpenAI-compatible root ending in /v1 */
  baseUrl: string;
  modelCheap: string;
  modelPremium: string;
  timeoutMs: number;
};

/** Any OpenAI-compatible `/chat/completions` proxy (GapGPT, Liara, BoxAPI AI, …). */
export class OpenAiCompatibleChatPlugin implements ChatProviderPlugin {
  readonly id: string;
  private readonly log = new Logger(OpenAiCompatibleChatPlugin.name);

  constructor(private readonly config: OpenAiCompatiblePluginConfig) {
    this.id = config.providerId;
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const modelId = this.resolveModel(req.routeHint);
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`;
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          temperature: req.temperature ?? 0.3,
          max_tokens: req.maxTokens ?? 600,
          messages: [
            { role: 'system', content: req.system },
            { role: 'user', content: req.user },
          ],
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - started;
      const body = (await res.json().catch(() => ({}))) as OpenAiChatResponse;

      if (!res.ok) {
        throw this.mapHttpError(res.status, body, modelId);
      }

      const text = body.choices?.[0]?.message?.content?.trim() ?? '';
      if (!text) {
        throw new GatewayError('invalid_response', 'Empty completion text', {
          providerId: this.id,
          retryable: true,
        });
      }

      return {
        text,
        finishReason: body.choices?.[0]?.finish_reason ?? 'stop',
        usage: {
          tokensIn: body.usage?.prompt_tokens ?? 0,
          tokensOut: body.usage?.completion_tokens ?? 0,
        },
        providerId: this.id,
        modelId: body.model ?? modelId,
        latencyMs,
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
        `${this.id} complete failed tenant=${req.tenantId} task=${req.taskClass}: ${
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

  private resolveModel(hint: RouteHint): string {
    if (hint === 'premium') return this.config.modelPremium;
    return this.config.modelCheap;
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

/** @deprecated alias — use OpenAiCompatibleChatPlugin */
export const OpenAiChatPlugin = OpenAiCompatibleChatPlugin;
