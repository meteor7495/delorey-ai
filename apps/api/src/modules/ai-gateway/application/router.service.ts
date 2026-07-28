import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderRegistry } from '../domain/provider.registry';
import type { AiProviderPort } from '../domain/provider.port';
import type {
  RouteCandidate,
  RouteDecision,
  RouteHint,
  TaskClass,
} from '../domain/routing.types';
import {
  parseFallbackProviderIds,
  parseProviderId,
} from '../infrastructure/provider-presets';
import { OpenAiCompatibleProvider } from '../infrastructure/providers/openai-compatible.provider';
import { PROVIDER_REGISTRY } from '../infrastructure/provider.factory';

export type RouterInput = {
  tenantId: string;
  taskClass: TaskClass;
  routeHint: RouteHint;
};

/**
 * Gateway Router — owns provider/model selection and fallback chains.
 * Upstream adapters (including 9Router) never decide business rules.
 */
@Injectable()
export class RouterService {
  constructor(
    private readonly config: ConfigService,
    @Inject(PROVIDER_REGISTRY) private readonly registry: ProviderRegistry,
  ) {}

  decide(input: RouterInput): RouteDecision {
    const timeoutMs = this.resolveTimeoutMs();
    const mode = (
      this.config.get<string>('AI_GATEWAY_MODE') ?? 'mock'
    ).toLowerCase();

    if (mode !== 'live') {
      return {
        primary: { providerId: 'mock', modelId: 'grounded-template' },
        fallbacks: [],
        allowStream: true,
        timeoutMs,
        rejectReason: 'mock_only',
      };
    }

    const primaryId = parseProviderId(
      this.config.get<string>('AI_GATEWAY_PROVIDER'),
    );
    const fallbackIds = parseFallbackProviderIds(
      this.config.get<string>('AI_GATEWAY_FALLBACK_PROVIDERS'),
    );

    const chainIds = unique([
      primaryId,
      ...fallbackIds,
      'mock', // always last-resort grounded path for chat
    ]).filter((id) => this.registry.has(id));

    if (chainIds.length === 0) {
      return {
        primary: { providerId: 'mock', modelId: 'grounded-template' },
        fallbacks: [],
        allowStream: true,
        timeoutMs,
        rejectReason: 'no_healthy_provider',
      };
    }

    const candidates = chainIds.map((providerId) =>
      this.toCandidate(providerId, input.routeHint),
    );

    return {
      primary: candidates[0]!,
      fallbacks: candidates.slice(1),
      allowStream: true,
      timeoutMs,
    };
  }

  resolveProvider(providerId: string): AiProviderPort | undefined {
    return this.registry.get(providerId);
  }

  private toCandidate(
    providerId: string,
    routeHint: RouteHint,
  ): RouteCandidate {
    const provider = this.registry.get(providerId);
    if (!provider) {
      return { providerId: 'mock', modelId: 'grounded-template' };
    }
    if (providerId === 'mock') {
      return { providerId: 'mock', modelId: 'grounded-template' };
    }
    if (provider instanceof OpenAiCompatibleProvider) {
      return {
        providerId,
        modelId: provider.resolveModelForHint(routeHint),
      };
    }
    return {
      providerId,
      modelId:
        routeHint === 'premium' ? 'premium' : 'cheap',
    };
  }

  private resolveTimeoutMs(): number {
    const timeoutRaw = Number(
      this.config.get<string>('AI_GATEWAY_TIMEOUT_MS') ?? '20000',
    );
    return Number.isFinite(timeoutRaw) && timeoutRaw > 1000
      ? Math.min(timeoutRaw, 120_000)
      : 20_000;
  }
}

function unique(ids: string[]): string[] {
  return ids.filter((id, i, arr) => arr.indexOf(id) === i);
}
