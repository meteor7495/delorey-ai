import type { OpenAiCompatibleProviderConfig } from './providers/openai-compatible.provider';

export type GatewayProviderId =
  | 'openai'
  | 'gapgpt'
  | 'liara'
  | 'boxapi'
  | 'ninerouter'
  | 'custom'
  | 'mock';

export type ProviderPreset = {
  id: GatewayProviderId;
  /** Default OpenAI-compatible base (…/v1). Null = must set env. */
  defaultBaseUrl: string | null;
  modelCheap: string;
  modelPremium: string;
  /** Env keys checked for API key (first non-empty wins after AI_GATEWAY_API_KEY). */
  apiKeyEnv: string[];
  /** Env keys for base URL override (after AI_GATEWAY_BASE_URL). */
  baseUrlEnv: string[];
  /** Optional default USD per 1K tokens for estimates (prompt / completion). */
  pricePromptPer1k?: number;
  priceCompletionPer1k?: number;
};

/**
 * Regional / third-party OpenAI-compatible chat proxies + 9Router upstream.
 * 9Router is an upstream Provider behind our Gateway — not the architecture.
 */
export const PROVIDER_PRESETS: Record<
  Exclude<GatewayProviderId, 'mock'>,
  ProviderPreset
> = {
  openai: {
    id: 'openai',
    defaultBaseUrl: 'https://api.openai.com/v1',
    modelCheap: 'gpt-4o-mini',
    modelPremium: 'gpt-4o',
    apiKeyEnv: ['OPENAI_API_KEY'],
    baseUrlEnv: ['OPENAI_BASE_URL'],
    pricePromptPer1k: 0.00015,
    priceCompletionPer1k: 0.0006,
  },
  gapgpt: {
    id: 'gapgpt',
    defaultBaseUrl: 'https://api.gapgpt.app/v1',
    modelCheap: 'gpt-4o-mini',
    modelPremium: 'gpt-4o',
    apiKeyEnv: ['GAPGPT_API_KEY', 'OPENAI_API_KEY'],
    baseUrlEnv: ['GAPGPT_BASE_URL', 'OPENAI_BASE_URL'],
  },
  boxapi: {
    id: 'boxapi',
    defaultBaseUrl: 'https://ai.boxapi.ir/api/v1',
    modelCheap: 'gpt-4o-mini',
    modelPremium: 'gpt-4o',
    apiKeyEnv: ['BOXAPI_AI_API_KEY', 'BOXAPI_API_KEY', 'OPENAI_API_KEY'],
    baseUrlEnv: ['BOXAPI_AI_BASE_URL', 'OPENAI_BASE_URL'],
  },
  liara: {
    id: 'liara',
    defaultBaseUrl: null,
    modelCheap: 'openai/gpt-4o-mini',
    modelPremium: 'openai/gpt-4o',
    apiKeyEnv: ['LIARA_API_KEY', 'OPENAI_API_KEY'],
    baseUrlEnv: ['LIARA_BASE_URL', 'OPENAI_BASE_URL'],
  },
  ninerouter: {
    id: 'ninerouter',
    defaultBaseUrl: 'http://127.0.0.1:20128/v1',
    modelCheap: 'gpt-4o-mini',
    modelPremium: 'gpt-4o',
    apiKeyEnv: ['NINEROUTER_API_KEY', 'AI_GATEWAY_API_KEY', 'OPENAI_API_KEY'],
    baseUrlEnv: ['NINEROUTER_BASE_URL', 'OPENAI_BASE_URL'],
  },
  custom: {
    id: 'custom',
    defaultBaseUrl: null,
    modelCheap: 'gpt-4o-mini',
    modelPremium: 'gpt-4o',
    apiKeyEnv: ['OPENAI_API_KEY'],
    baseUrlEnv: ['OPENAI_BASE_URL'],
  },
};

export function parseProviderId(raw: string | undefined): GatewayProviderId {
  const v = (raw ?? 'openai').trim().toLowerCase();
  if (v === 'mock') return 'mock';
  if (v in PROVIDER_PRESETS) return v as GatewayProviderId;
  return 'openai';
}

export type ResolvedProviderConfig = OpenAiCompatibleProviderConfig;

type EnvGetter = (key: string) => string | undefined;

export function resolveProviderConfig(
  get: EnvGetter,
  providerIdOverride?: GatewayProviderId,
): ResolvedProviderConfig | { missingReason: string } {
  const providerId = providerIdOverride ?? parseProviderId(get('AI_GATEWAY_PROVIDER'));
  if (providerId === 'mock') {
    return { missingReason: 'provider=mock has no live HTTP config' };
  }
  const preset = PROVIDER_PRESETS[providerId];

  const apiKey =
    firstNonEmpty(
      get('AI_GATEWAY_API_KEY'),
      ...preset.apiKeyEnv.map((k) => get(k)),
    ) ?? '';

  const baseUrl =
    firstNonEmpty(
      get('AI_GATEWAY_BASE_URL'),
      ...preset.baseUrlEnv.map((k) => get(k)),
      preset.defaultBaseUrl ?? undefined,
    ) ?? '';

  const modelCheap =
    firstNonEmpty(
      get('AI_GATEWAY_MODEL_CHEAP'),
      get('OPENAI_MODEL_CHEAP'),
      get('OPENAI_MODEL'),
      preset.modelCheap,
    ) ?? preset.modelCheap;

  const modelPremium =
    firstNonEmpty(
      get('AI_GATEWAY_MODEL_PREMIUM'),
      get('OPENAI_MODEL_PREMIUM'),
      preset.modelPremium,
    ) ?? preset.modelPremium;

  const timeoutRaw = Number(get('AI_GATEWAY_TIMEOUT_MS') ?? '20000');
  const timeoutMs =
    Number.isFinite(timeoutRaw) && timeoutRaw > 1000
      ? Math.min(timeoutRaw, 120_000)
      : 20_000;

  if (!apiKey && providerId !== 'ninerouter') {
    // 9Router may allow empty key depending on local dashboard config;
    // still prefer a key when present. Require key for all cloud presets.
    return {
      missingReason: `missing_api_key for provider=${providerId}`,
    };
  }
  // ninerouter: allow empty api key (local dashboard often issues one — prefer set)
  if (!apiKey && providerId === 'ninerouter') {
    // use placeholder; many local 9Router installs still expect Authorization
    // Prefer NINEROUTER_API_KEY; if missing, use "ninerouter" as non-secret label key
  }

  if (!baseUrl) {
    return {
      missingReason: `missing_base_url for provider=${providerId} (set AI_GATEWAY_BASE_URL or provider-specific URL)`,
    };
  }

  return {
    providerId,
    apiKey: apiKey || 'ninerouter',
    baseUrl: baseUrl.replace(/\/$/, ''),
    modelCheap,
    modelPremium,
    timeoutMs,
    pricePromptPer1k: preset.pricePromptPer1k,
    priceCompletionPer1k: preset.priceCompletionPer1k,
  };
}

export function parseFallbackProviderIds(raw: string | undefined): GatewayProviderId[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => parseProviderId(s.trim()))
    .filter((id, i, arr) => arr.indexOf(id) === i);
}

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | undefined {
  for (const v of values) {
    const t = v?.trim();
    if (t) return t;
  }
  return undefined;
}
