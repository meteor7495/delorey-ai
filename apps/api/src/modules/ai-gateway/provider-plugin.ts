export type RouteHint = 'cheap' | 'premium' | 'classifier' | 'compress';

export type TaskClass =
  | 'chat.reply.cheap'
  | 'chat.reply.premium'
  | 'chat.classify'
  | 'chat.compress'
  | 'embed.knowledge'
  | 'embed.query';

export type CompletionRequest = {
  tenantId: string;
  system: string;
  user: string;
  taskClass: TaskClass;
  routeHint: RouteHint;
  maxTokens?: number;
  temperature?: number;
};

export type CompletionUsage = {
  tokensIn: number;
  tokensOut: number;
};

export type CompletionResponse = {
  text: string;
  finishReason: string;
  usage: CompletionUsage;
  providerId: string;
  modelId: string;
  latencyMs: number;
};

export interface ChatProviderPlugin {
  readonly id: string;
  complete(req: CompletionRequest): Promise<CompletionResponse>;
}
