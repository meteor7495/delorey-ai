/** Types inferred from BoxAPI Official Instagram API docs. Unknown fields stay loose. */

export type BoxApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  status_code?: number;
  data?: T;
  pagination?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    from?: number;
    to?: number;
  };
};

export type BoxApiAccount = {
  id: string;
  username: string;
  instagram_user_id: string;
  profile_photo?: string;
  internal_token?: string;
  is_active?: boolean;
  expires_at?: string;
};

export type BoxApiServiceInfo = {
  id?: string;
  domain?: string;
  token?: string;
  login_redirect_url?: string;
  instagram_oauth_url?: string;
  user?: unknown;
  plan?: {
    name?: string;
    slug?: string;
    description?: string;
    account_limit?: number;
    price?: number;
    duration_days?: number;
    items?: string[];
  };
  accounts?: BoxApiAccount[];
};

export type BoxApiSendMessageBody = {
  account_id: string;
  recipient_id: string;
  message: string;
  buttons?: Array<{
    type: 'postback' | 'web_url';
    title: string;
    payload?: string;
    url?: string;
  }>;
};

/** Outer automation-style envelope seen in Official API webhook sample. */
export type BoxApiWebhookDelivery = {
  headers?: Record<string, unknown>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: {
    event_id?: string;
    event_type?: string;
    account_id?: string;
    data?: unknown;
  };
  webhookUrl?: string;
  executionMode?: string;
};

export type CapturedWebhookEvent = {
  id: string;
  receivedAt: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  /** Raw parsed JSON (array or object). */
  payload: unknown;
  /** Best-effort extracted event ids for idempotency experiments. */
  extracted: {
    eventIds: string[];
    accountIds: string[];
    messageMids: string[];
    eventTypes: string[];
  };
};
