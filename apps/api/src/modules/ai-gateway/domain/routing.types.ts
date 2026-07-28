export type RouteHint = 'cheap' | 'premium' | 'classifier' | 'compress';

export type TaskClass =
  | 'chat.reply.cheap'
  | 'chat.reply.premium'
  | 'chat.classify'
  | 'chat.compress'
  | 'embed.knowledge'
  | 'embed.query'
  | 'vision.describe';

export type RouteCandidate = {
  providerId: string;
  modelId: string;
};

export type RouteRejectReason =
  | 'budget_exceeded'
  | 'provider_blocked'
  | 'policy_deny'
  | 'no_healthy_provider'
  | 'mock_only';

export type RouteDecision = {
  primary: RouteCandidate;
  fallbacks: RouteCandidate[];
  allowStream: boolean;
  timeoutMs: number;
  rejectReason?: RouteRejectReason;
};
