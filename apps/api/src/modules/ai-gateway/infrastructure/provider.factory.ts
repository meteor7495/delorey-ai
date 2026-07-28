import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderRegistry } from '../domain/provider.registry';
import type { AiProviderPort } from '../domain/provider.port';
import {
  parseFallbackProviderIds,
  parseProviderId,
  resolveProviderConfig,
  type GatewayProviderId,
} from './provider-presets';
import { MockProvider } from './providers/mock.provider';
import { NineRouterProvider } from './providers/ninerouter.provider';
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider';

export const PROVIDER_REGISTRY = Symbol('PROVIDER_REGISTRY');

@Injectable()
export class ProviderFactory {
  constructor(private readonly config: ConfigService) {}

  createRegistry(): ProviderRegistry {
    const registry = new ProviderRegistry();
    const mock = new MockProvider();
    registry.register(mock);

    const get = (key: string) => this.config.get<string>(key);
    const primaryId = parseProviderId(get('AI_GATEWAY_PROVIDER'));
    const fallbackIds = parseFallbackProviderIds(
      get('AI_GATEWAY_FALLBACK_PROVIDERS'),
    );

    const toBuild = uniqueIds([
      primaryId,
      ...fallbackIds,
      // Always try to register common live presets if credentials exist
      'ninerouter',
      'openai',
      'gapgpt',
      'boxapi',
      'liara',
      'custom',
    ]);

    for (const id of toBuild) {
      if (id === 'mock') continue;
      if (registry.has(id)) continue;
      const provider = this.tryBuild(id, get);
      if (provider) registry.register(provider);
    }

    return registry;
  }

  private tryBuild(
    id: GatewayProviderId,
    get: (key: string) => string | undefined,
  ): AiProviderPort | null {
    const resolved = resolveProviderConfig(get, id);
    if ('missingReason' in resolved) {
      return null;
    }
    if (id === 'ninerouter') {
      const { providerId: _pid, ...rest } = resolved;
      return new NineRouterProvider(rest);
    }
    return new OpenAiCompatibleProvider(resolved);
  }
}

function uniqueIds(ids: GatewayProviderId[]): GatewayProviderId[] {
  return ids.filter((id, i, arr) => arr.indexOf(id) === i);
}
