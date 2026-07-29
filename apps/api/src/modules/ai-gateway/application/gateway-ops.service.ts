import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderRegistry } from '../domain/provider.registry';
import { CircuitBreakerService } from '../infrastructure/circuit-breaker.redis';
import { PROVIDER_REGISTRY } from '../infrastructure/provider.factory';
import { TenantAiPolicyService } from '../infrastructure/persistence/tenant-ai-policy.service';
import { UsageLedgerService } from '../infrastructure/persistence/usage-ledger.service';
import type { UpsertTenantAiPolicyInput } from '../infrastructure/persistence/tenant-ai-policy.service';
import { PROVIDER_PRESETS } from '../infrastructure/provider-presets';

@Injectable()
export class GatewayOpsService {
  constructor(
    private readonly config: ConfigService,
    @Inject(PROVIDER_REGISTRY) private readonly registry: ProviderRegistry,
    private readonly circuits: CircuitBreakerService,
    private readonly policies: TenantAiPolicyService,
    private readonly ledger: UsageLedgerService,
  ) {}

  async health() {
    const mode = (
      this.config.get<string>('AI_GATEWAY_MODE') ?? 'mock'
    ).toLowerCase();
    const providers = await Promise.all(
      this.registry.list().map(async (p) => {
        const [circuit, probe] = await Promise.all([
          this.circuits.getCircuitState(p.id),
          p.healthCheck().catch((err) => ({
            healthy: false as const,
            latencyMs: undefined as number | undefined,
            checkedAt: new Date().toISOString(),
            detail: err instanceof Error ? err.message : 'health_failed',
          })),
        ]);
        return {
          id: p.id,
          circuit,
          healthy: probe.healthy,
          latencyMs: 'latencyMs' in probe ? probe.latencyMs : undefined,
          capabilities: {
            generate: p.capabilities.generate,
            stream: p.capabilities.stream,
            embeddings: p.capabilities.embeddings,
            costTier: p.capabilities.costTier,
          },
        };
      }),
    );

    return {
      ok: true,
      mode,
      primaryProvider: this.config.get<string>('AI_GATEWAY_PROVIDER') ?? 'mock',
      fallbackProviders:
        this.config.get<string>('AI_GATEWAY_FALLBACK_PROVIDERS') ?? '',
      knownProviderIds: ['mock', ...Object.keys(PROVIDER_PRESETS)],
      providers,
      note: '9Router is one upstream provider behind this Gateway — not the architecture.',
    };
  }

  getPolicy(tenantId: string) {
    return this.policies.getForTenant(tenantId);
  }

  upsertPolicy(tenantId: string, input: UpsertTenantAiPolicyInput) {
    return this.policies.upsertForTenant(tenantId, input);
  }

  usage(tenantId: string) {
    return this.ledger.summarize(tenantId);
  }
}
