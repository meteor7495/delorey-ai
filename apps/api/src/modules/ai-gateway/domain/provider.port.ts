import type { RouteHint, TaskClass } from './routing.types';

export type ProviderCostTier = 'free' | 'cheap' | 'standard' | 'premium';

export type ProviderCapabilities = {
  generate: boolean;
  stream: boolean;
  embeddings: boolean;
  vision: boolean;
  toolCalling: boolean;
  jsonMode: boolean;
  usage: boolean;
  healthCheck: boolean;
  listModels: boolean;
  estimateCost: boolean;
  contextWindow: number;
  costTier: ProviderCostTier;
  latencyClass: 'interactive' | 'batch' | 'either';
  languageQuality?: 'fa_commerce_ok' | 'unknown';
};

export type ProviderHealth = {
  healthy: boolean;
  latencyMs?: number;
  checkedAt: string;
  detail?: string;
};

export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type CostEstimate = {
  currency: 'USD';
  amount: number;
  basis: 'tokens' | 'request' | 'unknown';
};

export type AiMessage =
  | { role: 'system' | 'user' | 'assistant'; content: string }
  | { role: 'tool'; toolCallId: string; content: string }
  | {
      role: 'assistant';
      content: string | null;
      toolCalls?: Array<{
        id: string;
        name: string;
        argumentsJson: string;
      }>;
    };

export type GenerateRequest = {
  tenantId: string;
  messages: AiMessage[];
  modelId: string;
  maxTokens?: number;
  temperature?: number;
  tools?: Array<{
    name: string;
    description?: string;
    parametersJsonSchema: unknown;
  }>;
  jsonMode?: boolean;
  timeoutMs: number;
  idempotencyKey?: string;
  taskClass?: TaskClass;
  routeHint?: RouteHint;
};

export type GenerateResponse = {
  text: string | null;
  toolCalls?: Array<{ id: string; name: string; argumentsJson: string }>;
  finishReason: string;
  usage: TokenUsage;
  providerId: string;
  modelId: string;
  latencyMs: number;
  rawCost?: CostEstimate;
};

export type StreamChunk =
  | { type: 'delta'; text: string }
  | {
      type: 'tool_call_delta';
      id: string;
      name?: string;
      argumentsJsonDelta?: string;
    }
  | { type: 'usage'; usage: TokenUsage }
  | { type: 'done'; finishReason: string; modelId: string };

export type EmbedRequest = {
  tenantId: string;
  texts: string[];
  modelId: string;
  timeoutMs: number;
};

export type EmbedResponse = {
  vectors: number[][];
  usage: TokenUsage;
  providerId: string;
  modelId: string;
  latencyMs: number;
};

export type VisionRequest = {
  tenantId: string;
  prompt: string;
  images: Array<{ mimeType: string; dataBase64?: string; url?: string }>;
  modelId: string;
  maxTokens?: number;
  timeoutMs: number;
};

export type ModelInfo = {
  id: string;
  displayName?: string;
  capabilities: Partial<ProviderCapabilities>;
};

/**
 * Every upstream provider adapter implements this port.
 * Optional capabilities throw GatewayError('unavailable') when unsupported.
 */
export interface AiProviderPort {
  readonly id: string;
  readonly capabilities: ProviderCapabilities;

  generate(req: GenerateRequest): Promise<GenerateResponse>;
  stream(req: GenerateRequest): AsyncIterable<StreamChunk>;
  embeddings(req: EmbedRequest): Promise<EmbedResponse>;
  vision(req: VisionRequest): Promise<GenerateResponse>;
  toolCalling(req: GenerateRequest): Promise<GenerateResponse>;
  jsonMode(req: GenerateRequest): Promise<GenerateResponse>;
  usage(raw: unknown): TokenUsage;
  healthCheck(): Promise<ProviderHealth>;
  listModels(): Promise<ModelInfo[]>;
  estimateCost(input: {
    modelId: string;
    promptTokens: number;
    completionTokens: number;
  }): Promise<CostEstimate>;
}
