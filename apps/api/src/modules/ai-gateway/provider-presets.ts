import type { OpenAiCompatiblePluginConfig } from './plugins/openai-compatible.plugin';

export type GatewayProviderId =
  | 'openai'
  | 'gapgpt'
  | 'liara'
  | 'boxapi'
  | 'custom';

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
};

/**
 * Regional / third-party OpenAI-compatible chat proxies.
 * Docs notes:
 * - GapGPT: https://api.gapgpt.app/v1
 * - BoxAPI ChatGPT: https://ai.boxapi.ir/api/v1
 * - Liara: workspace-specific base URL from panel (required)
 */
export const PROVIDER_PRESETS: Record<GatewayProviderId, ProviderPreset> = {
  openai: {
    id: 'openai',
    defaultBaseUrl: 'https://api.openai.com/v1',
    modelCheap: 'gpt-4o-mini',
    modelPremium: 'gpt-4o',
    apiKeyEnv: ['OPENAI_API_KEY'],
    baseUrlEnv: ['OPENAI_BASE_URL'],
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
    // BOXAPI_API_KEY also used by Instagram spike — ok to reuse panel token
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
  if (v in PROVIDER_PRESETS) return v as GatewayProviderId;
  return 'openai';
}

export type ResolvedProviderConfig = OpenAiCompatiblePluginConfig;

type EnvGetter = (key: string) => string | undefined;

export function resolveProviderConfig(
  get: EnvGetter,
): ResolvedProviderConfig | { missingReason: string } {
  const providerId = parseProviderId(get('AI_GATEWAY_PROVIDER'));
  const preset = PROVIDER_PRESETS[providerId];

  const apiKey =
    firstNonEmpty(get('AI_GATEWAY_API_KEY'), ...preset.apiKeyEnv.map((k) => get(k))) ??
    '';

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

  if (!apiKey) {
    return {
      missingReason: `missing_api_key for provider=${providerId}`,
    };
  }
  if (!baseUrl) {
    return {
      missingReason: `missing_base_url for provider=${providerId} (set AI_GATEWAY_BASE_URL or LIARA_BASE_URL)`,
    };
  }

  return {
    providerId,
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ''),
    modelCheap,
    modelPremium,
    timeoutMs,
  };
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
