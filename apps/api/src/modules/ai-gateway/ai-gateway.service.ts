import { Injectable, Logger } from '@nestjs/common';
import { GatewayError } from './domain/gateway-errors';
import type { GenerateResponse } from './domain/provider.port';
import type { RouteHint, TaskClass } from './domain/routing.types';
import { RouterService } from './application/router.service';

export type CompleteInput = {
  system: string;
  user: string;
  tenantId: string;
  taskClass?: TaskClass;
  routeHint?: RouteHint;
  feature?: string;
  conversationId?: string;
  maxTokens?: number;
  temperature?: number;
};

export type GatewayMeter = {
  mode: 'mock' | 'live';
  providerId: string;
  modelId: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  taskClass: TaskClass;
  routeHint: RouteHint;
  retryCount?: number;
  fallbackCount?: number;
  costUsd?: number;
  cacheHit?: boolean;
  fallbackReason?: string;
};

export type CompleteResult = {
  text: string;
  mode: 'mock' | 'live';
  meter: GatewayMeter;
};

/**
 * AI Gateway façade — single entry point for Runtime / Cost / Knowledge.
 * Provider Layer adapters (incl. 9Router) sit behind the Router.
 */
@Injectable()
export class AiGatewayService {
  private readonly log = new Logger(AiGatewayService.name);

  constructor(private readonly router: RouterService) {}

  async complete(input: CompleteInput): Promise<CompleteResult> {
    const taskClass: TaskClass = input.taskClass ?? 'chat.reply.cheap';
    const routeHint: RouteHint =
      input.routeHint ??
      (taskClass === 'chat.reply.premium' ? 'premium' : 'cheap');

    const decision = this.router.decide({
      tenantId: input.tenantId,
      taskClass,
      routeHint,
    });

    const chain = [decision.primary, ...decision.fallbacks];
    let retryCount = 0;
    let fallbackCount = 0;
    let lastReason: string | undefined;

    for (let i = 0; i < chain.length; i++) {
      const candidate = chain[i]!;
      const provider = this.router.resolveProvider(candidate.providerId);
      if (!provider) {
        lastReason = `provider_missing:${candidate.providerId}`;
        continue;
      }

      try {
        const res = await provider.generate({
          tenantId: input.tenantId,
          messages: [
            { role: 'system', content: input.system },
            { role: 'user', content: input.user },
          ],
          modelId: candidate.modelId,
          maxTokens: input.maxTokens,
          temperature: input.temperature,
          timeoutMs: decision.timeoutMs,
          taskClass,
          routeHint,
        });

        const mode: 'mock' | 'live' =
          res.providerId === 'mock' ? 'mock' : 'live';
        const meter = this.toMeter({
          res,
          mode,
          taskClass,
          routeHint,
          retryCount,
          fallbackCount,
          fallbackReason:
            i > 0 || lastReason
              ? (lastReason ?? `fallback_to:${res.providerId}`).slice(0, 240)
              : undefined,
        });
        this.logMeter(input.tenantId, meter);
        return {
          text: res.text?.trim() || '',
          mode,
          meter,
        };
      } catch (err) {
        const reason =
          err instanceof GatewayError
            ? `${err.code}:${err.message}`
            : err instanceof Error
              ? err.message
              : 'unknown';
        lastReason = reason.slice(0, 240);

        const retryable =
          err instanceof GatewayError ? err.retryable : true;

        if (retryable && i === 0 && retryCount < 1) {
          // one immediate retry on primary
          retryCount += 1;
          i -= 1;
          continue;
        }

        if (i < chain.length - 1) {
          fallbackCount += 1;
          this.log.warn(
            `Provider ${candidate.providerId} failed; failover tenant=${input.tenantId} reason=${lastReason}`,
          );
        }
      }
    }

    // Absolute last resort — should be unreachable if mock is in chain
    const mock = this.router.resolveProvider('mock');
    const res = mock
      ? await mock.generate({
          tenantId: input.tenantId,
          messages: [
            { role: 'system', content: input.system },
            { role: 'user', content: input.user },
          ],
          modelId: 'grounded-template',
          timeoutMs: decision.timeoutMs,
          taskClass,
          routeHint,
        })
      : {
          text: 'الان اطلاعات مطمئنی ندارم.',
          finishReason: 'stop',
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          providerId: 'mock',
          modelId: 'grounded-template',
          latencyMs: 0,
        };

    const meter = this.toMeter({
      res,
      mode: 'mock',
      taskClass,
      routeHint,
      retryCount,
      fallbackCount,
      fallbackReason: (lastReason ?? 'all_providers_failed').slice(0, 240),
    });
    this.logMeter(input.tenantId, meter);
    return { text: res.text?.trim() || '', mode: 'mock', meter };
  }

  private toMeter(args: {
    res: GenerateResponse;
    mode: 'mock' | 'live';
    taskClass: TaskClass;
    routeHint: RouteHint;
    retryCount: number;
    fallbackCount: number;
    fallbackReason?: string;
  }): GatewayMeter {
    return {
      mode: args.mode,
      providerId: args.res.providerId,
      modelId: args.res.modelId,
      tokensIn: args.res.usage.promptTokens,
      tokensOut: args.res.usage.completionTokens,
      latencyMs: args.res.latencyMs,
      taskClass: args.taskClass,
      routeHint: args.routeHint,
      retryCount: args.retryCount,
      fallbackCount: args.fallbackCount,
      costUsd: args.res.rawCost?.amount,
      cacheHit: false,
      fallbackReason: args.fallbackReason,
    };
  }

  private logMeter(tenantId: string, meter: GatewayMeter) {
    this.log.log(
      `gateway.complete tenant=${tenantId} mode=${meter.mode} provider=${meter.providerId} model=${meter.modelId} in=${meter.tokensIn} out=${meter.tokensOut} ms=${meter.latencyMs} task=${meter.taskClass} retries=${meter.retryCount ?? 0} fallbacks=${meter.fallbackCount ?? 0}${
        meter.fallbackReason ? ` fallback=${meter.fallbackReason}` : ''
      }`,
    );
  }
}
