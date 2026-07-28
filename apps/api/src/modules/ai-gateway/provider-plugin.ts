/** @deprecated Import from `./domain/provider.port` or `./domain/routing.types`. */
export type {
  RouteHint,
  TaskClass,
} from './domain/routing.types';

export type {
  GenerateRequest as CompletionRequest,
  GenerateResponse as CompletionResponse,
  TokenUsage as CompletionUsage,
} from './domain/provider.port';

import type { AiProviderPort } from './domain/provider.port';
import type { GenerateRequest, GenerateResponse } from './domain/provider.port';

/** @deprecated Use AiProviderPort.generate */
export interface ChatProviderPlugin {
  readonly id: string;
  complete(req: GenerateRequest): Promise<GenerateResponse>;
}

export type { AiProviderPort };
