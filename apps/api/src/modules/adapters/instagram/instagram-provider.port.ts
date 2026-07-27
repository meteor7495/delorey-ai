/**
 * Replaceable Instagram transport port (Growth).
 * BoxAPI is the first candidate implementation — not the channel abstraction.
 * See docs/07-evaluations/boxapi-instagram-official-api/11-architecture-recommendation.md
 */

export type InstagramProviderCapabilities = {
  mediaInbound: boolean;
  mediaOutbound: boolean;
  typing: boolean;
  markSeen: boolean;
  comments: boolean;
  storyReply: boolean;
  productTemplate: boolean;
  webhookSignatures: boolean;
  /** Documented Meta-originated ceiling; provider may queue overages. */
  rateLimitPerPagePerHour: number | null;
};

export type InstagramPageSummary = {
  id: string;
  username: string;
  instagramUserId: string;
  profilePhoto?: string;
  isActive: boolean;
  expiresAt?: string;
};

export type SendTextInput = {
  accountId: string;
  recipientId: string;
  message: string;
  buttons?: Array<{
    type: 'postback' | 'web_url';
    title: string;
    payload?: string;
    url?: string;
  }>;
};

export type SendResult = {
  ok: boolean;
  mocked?: boolean;
  raw?: unknown;
  error?: string;
  statusCode?: number;
  latencyMs: number;
};

export type ReplyCommentInput = {
  accountId: string;
  commentId: string;
  message: string;
};

export interface InstagramProviderPort {
  readonly providerId: 'boxapi' | 'meta_direct' | string;
  capabilities(): InstagramProviderCapabilities;
  getServiceInfo(): Promise<{ ok: boolean; data?: unknown; error?: string; latencyMs: number }>;
  listPages(): Promise<{
    ok: boolean;
    pages?: InstagramPageSummary[];
    pagination?: unknown;
    error?: string;
    latencyMs: number;
  }>;
  disconnectPage(pageId: string): Promise<SendResult>;
  sendText(input: SendTextInput): Promise<SendResult>;
  replyComment(input: ReplyCommentInput): Promise<SendResult>;
  requestFollowStatus(accountId: string, customerId: string): Promise<SendResult>;
  requestListPosts(
    accountId: string,
    fields?: string[],
    limit?: number,
  ): Promise<SendResult>;
}
