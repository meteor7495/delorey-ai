import type {
  InstagramPageSummary,
  InstagramProviderCapabilities,
  InstagramProviderPort,
  ReplyCommentInput,
  SendResult,
  SendTextInput,
} from './instagram-provider.port';
import type { BoxApiAccount, BoxApiEnvelope, BoxApiServiceInfo } from './boxapi.types';

/**
 * Thin HTTP client for BoxAPI Official Instagram Direct & Comment API.
 * Base URL is NOT documented stably — must come from env / vendor panel.
 */
export class BoxApiClient implements InstagramProviderPort {
  readonly providerId = 'boxapi' as const;

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly live: boolean,
  ) {}

  capabilities(): InstagramProviderCapabilities {
    // Conservative: only what Official docs clearly support.
    return {
      mediaInbound: false,
      mediaOutbound: false,
      typing: false,
      markSeen: false,
      comments: true,
      storyReply: false,
      productTemplate: false,
      webhookSignatures: false,
      rateLimitPerPagePerHour: 200,
    };
  }

  private root(): string {
    return this.baseUrl.replace(/\/$/, '');
  }

  private async request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<SendResult & { data?: unknown }> {
    const started = Date.now();
    if (!this.live) {
      return {
        ok: true,
        mocked: true,
        latencyMs: Date.now() - started,
        data: { mocked: true, method, path, body },
      };
    }
    if (!this.apiKey || !this.baseUrl) {
      return {
        ok: false,
        error: 'BOXAPI_API_KEY and BOXAPI_BASE_URL required when BOXAPI_LIVE=1',
        latencyMs: Date.now() - started,
      };
    }
    try {
      const res = await fetch(`${this.root()}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await res.text();
      let raw: unknown = text;
      try {
        raw = text ? JSON.parse(text) : null;
      } catch {
        /* keep text */
      }
      if (!res.ok) {
        return {
          ok: false,
          raw,
          statusCode: res.status,
          error: `HTTP ${res.status}`,
          latencyMs: Date.now() - started,
        };
      }
      return {
        ok: true,
        raw,
        statusCode: res.status,
        latencyMs: Date.now() - started,
        data: raw,
      };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'network',
        latencyMs: Date.now() - started,
      };
    }
  }

  async getServiceInfo() {
    if (!this.live) {
      const started = Date.now();
      return {
        ok: true,
        latencyMs: Date.now() - started,
        data: {
          success: true,
          data: {
            domain: 'https://example.seloma.local',
            instagram_oauth_url: 'https://example.invalid/oauth',
            login_redirect_url: 'https://example.seloma.local/v1/spike/boxapi/oauth/callback',
            plan: { name: 'mock', account_limit: 1 },
            accounts: [],
          },
        },
      };
    }
    const res = await this.request('GET', '/service/info');
    return {
      ok: res.ok,
      data: res.data ?? res.raw,
      error: res.error,
      latencyMs: res.latencyMs,
    };
  }

  async listPages() {
    if (!this.live) {
      return {
        ok: true,
        pages: [] as InstagramPageSummary[],
        pagination: { current_page: 0, total: 0 },
        latencyMs: 0,
      };
    }
    const res = await this.request('GET', '/service/accounts');
    if (!res.ok) {
      return { ok: false, error: res.error, latencyMs: res.latencyMs };
    }
    const envelope = res.data as BoxApiEnvelope<BoxApiAccount[]>;
    const pages = (envelope.data ?? []).map((a) => this.mapPage(a));
    return {
      ok: true,
      pages,
      pagination: envelope.pagination,
      latencyMs: res.latencyMs,
    };
  }

  async disconnectPage(pageId: string): Promise<SendResult> {
    return this.request('DELETE', `/service/accounts/${encodeURIComponent(pageId)}`);
  }

  async sendText(input: SendTextInput): Promise<SendResult> {
    if (!this.live) {
      return { ok: true, mocked: true, latencyMs: 1 };
    }
    return this.request('POST', '/service/actions/send_message', {
      account_id: input.accountId,
      recipient_id: input.recipientId,
      message: input.message,
      buttons: input.buttons,
    });
  }

  async replyComment(input: ReplyCommentInput): Promise<SendResult> {
    if (!this.live) {
      return { ok: true, mocked: true, latencyMs: 1 };
    }
    return this.request('POST', '/service/actions/reply_comment', {
      account_id: input.accountId,
      comment_id: input.commentId,
      message: input.message,
    });
  }

  async requestFollowStatus(accountId: string, customerId: string): Promise<SendResult> {
    if (!this.live) {
      return { ok: true, mocked: true, latencyMs: 1 };
    }
    return this.request('POST', '/service/actions/follow_status', {
      account_id: accountId,
      customer_id: customerId,
    });
  }

  async requestListPosts(
    accountId: string,
    fields?: string[],
    limit?: number,
  ): Promise<SendResult> {
    if (!this.live) {
      return { ok: true, mocked: true, latencyMs: 1 };
    }
    return this.request('POST', '/service/actions/list_posts', {
      account_id: accountId,
      fields: fields ?? [
        'id',
        'media_type',
        'media_url',
        'permalink',
        'caption',
        'timestamp',
      ],
      limit: limit ?? 10,
    });
  }

  /** Redact secrets from account payloads before returning to Workspace/spike UI. */
  mapPage(a: BoxApiAccount): InstagramPageSummary {
    return {
      id: a.id,
      username: a.username,
      instagramUserId: a.instagram_user_id,
      profilePhoto: a.profile_photo,
      isActive: a.is_active !== false,
      expiresAt: a.expires_at,
    };
  }

  redactServiceInfo(raw: unknown): unknown {
    if (!raw || typeof raw !== 'object') return raw;
    const clone = JSON.parse(JSON.stringify(raw)) as {
      data?: BoxApiServiceInfo & { token?: string; accounts?: BoxApiAccount[] };
    };
    if (clone.data?.token) clone.data.token = '[redacted]';
    if (Array.isArray(clone.data?.accounts)) {
      clone.data.accounts = clone.data.accounts.map((a) => ({
        ...a,
        internal_token: a.internal_token ? '[redacted]' : undefined,
      }));
    }
    return clone;
  }
}
