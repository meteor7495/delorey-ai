import { Inject, Injectable, Logger } from '@nestjs/common';
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
import { CircuitBreakerService } from '../infrastructure/circuit-breaker.redis';
import { TenantAiPolicyService } from '../infrastructure/persistence/tenant-ai-policy.service';
import { ModelBindingService } from '../infrastructure/persistence/model-binding.service';
import { UsageLedgerService } from '../infrastructure/persistence/usage-ledger.service';

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
  private readonly log = new Logger(RouterService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(PROVIDER_REGISTRY) private readonly registry: ProviderRegistry,
    private readonly circuits: CircuitBreakerService,
    private readonly policies: TenantAiPolicyService,
    private readonly bindings: ModelBindingService,
    private readonly ledger: UsageLedgerService,
  ) {}

  async decide(input: RouterInput): Promise<RouteDecision> {
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

    const policy = await this.policies.getForTenant(input.tenantId);

    if (policy?.maxCostPerDayUsd != null) {
      const spent = await this.ledger.dayCostUsd(input.tenantId);
      if (spent >= policy.maxCostPerDayUsd) {
        this.log.warn(
          `Daily AI budget exceeded tenant=${input.tenantId} spent=${spent}`,
        );
        return {
          primary: { providerId: 'mock', modelId: 'grounded-template' },
          fallbacks: [],
          allowStream: true,
          timeoutMs,
          rejectReason: 'budget_exceeded',
        };
      }
    }

    const envPrimary = parseProviderId(
      this.config.get<string>('AI_GATEWAY_PROVIDER'),
    );
    const envFallbacks = parseFallbackProviderIds(
      this.config.get<string>('AI_GATEWAY_FALLBACK_PROVIDERS'),
    );

    const preferred =
      policy?.preferredProvider &&
      this.registry.has(policy.preferredProvider) &&
      !policy.blockedProviders.includes(policy.preferredProvider)
        ? policy.preferredProvider
        : envPrimary;

    const policyFallbacks =
      policy?.fallbackOrder?.length ? policy.fallbackOrder : envFallbacks;

    let chainIds = unique([
      preferred,
      ...policyFallbacks,
      'mock',
    ]).filter((id) => this.registry.has(id));

    if (policy?.allowedProviders?.length) {
      const allow = new Set([...policy.allowedProviders, 'mock']);
      chainIds = chainIds.filter((id) => allow.has(id));
    }
    if (policy?.blockedProviders?.length) {
      const block = new Set(policy.blockedProviders);
      chainIds = chainIds.filter((id) => id === 'mock' || !block.has(id));
    }

    // Skip open circuits (keep mock)
    const available: string[] = [];
    for (const id of chainIds) {
      if (id === 'mock' || (await this.circuits.isAvailable(id))) {
        available.push(id);
      } else {
        this.log.warn(`Skip open circuit provider=${id}`);
      }
    }
    chainIds = available;

    if (chainIds.length === 0) {
      return {
        primary: { providerId: 'mock', modelId: 'grounded-template' },
        fallbacks: [],
        allowStream: true,
        timeoutMs,
        rejectReason: 'no_healthy_provider',
      };
    }

    const candidates: RouteCandidate[] = [];
    for (const providerId of chainIds) {
      candidates.push(
        await this.toCandidate(providerId, input.routeHint, input.taskClass, policy),
      );
    }

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

  private async toCandidate(
    providerId: string,
    routeHint: RouteHint,
    taskClass: TaskClass,
    policy: Awaited<ReturnType<TenantAiPolicyService['getForTenant']>>,
  ): Promise<RouteCandidate> {
    if (providerId === 'mock') {
      return { providerId: 'mock', modelId: 'grounded-template' };
    }

    const preferredFromPolicy =
      routeHint === 'premium'
        ? policy?.preferredModels?.premium
        : policy?.preferredModels?.cheap;

    const fromBinding = await this.bindings.resolveUpstream({
      providerId,
      routeHint,
      taskClass,
    });

    if (preferredFromPolicy) {
      return { providerId, modelId: preferredFromPolicy };
    }
    if (fromBinding) {
      return { providerId, modelId: fromBinding };
    }

    const provider = this.registry.get(providerId);
    if (provider instanceof OpenAiCompatibleProvider) {
      return {
        providerId,
        modelId: provider.resolveModelForHint(routeHint),
      };
    }
    return {
      providerId,
      modelId: routeHint === 'premium' ? 'premium' : 'cheap',
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
