import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BoxApiClient } from './boxapi.client';
import type { CapturedWebhookEvent } from './boxapi.types';
import type { InstagramProviderPort } from './instagram-provider.port';

const CAPTURE_LIMIT = 200;

@Injectable()
export class InstagramSpikeService {
  private readonly captures: CapturedWebhookEvent[] = [];
  private readonly seenEventIds = new Set<string>();
  private readonly oauthCallbacks: Array<{
    id: string;
    receivedAt: string;
    query: Record<string, string>;
  }> = [];

  isEnabled(): boolean {
    return (process.env.BOXAPI_SPIKE_ENABLED ?? '0') === '1';
  }

  assertEnabled() {
    if (!this.isEnabled()) {
      throw new ForbiddenException(
        'BoxAPI Instagram spike disabled. Set BOXAPI_SPIKE_ENABLED=1',
      );
    }
  }

  private client(): BoxApiClient {
    return new BoxApiClient(
      process.env.BOXAPI_API_KEY ?? '',
      process.env.BOXAPI_BASE_URL ?? '',
      (process.env.BOXAPI_LIVE ?? '0') === '1',
    );
  }

  provider(): InstagramProviderPort {
    return this.client();
  }

  status() {
    this.assertEnabled();
    const live = (process.env.BOXAPI_LIVE ?? '0') === '1';
    const hasKey = Boolean(process.env.BOXAPI_API_KEY);
    const hasBase = Boolean(process.env.BOXAPI_BASE_URL);
    const caps = this.client().capabilities();
    return {
      spike: true,
      channel: 'instagram',
      provider: 'boxapi',
      live,
      configured: hasKey && hasBase,
      hasApiKey: hasKey,
      hasBaseUrl: hasBase,
      webhookPathHint: '/v1/webhooks/instagram/boxapi/:webhookSecret',
      publicApiBaseUrl: process.env.PUBLIC_API_BASE_URL ?? null,
      capabilities: caps,
      captureCount: this.captures.length,
      note: 'Spike only — does not call Runtime, Commerce, or Handoff.',
    };
  }

  async serviceInfo() {
    this.assertEnabled();
    const client = this.client();
    const res = await client.getServiceInfo();
    return {
      ...res,
      data: res.data ? client.redactServiceInfo(res.data) : res.data,
    };
  }

  async listAccounts() {
    this.assertEnabled();
    return this.client().listPages();
  }

  async sendMessage(body: {
    accountId: string;
    recipientId: string;
    message: string;
    buttons?: Array<{
      type: 'postback' | 'web_url';
      title: string;
      payload?: string;
      url?: string;
    }>;
  }) {
    this.assertEnabled();
    return this.client().sendText(body);
  }

  async replyComment(body: {
    accountId: string;
    commentId: string;
    message: string;
  }) {
    this.assertEnabled();
    return this.client().replyComment(body);
  }

  async followStatus(accountId: string, customerId: string) {
    this.assertEnabled();
    return this.client().requestFollowStatus(accountId, customerId);
  }

  async listPosts(accountId: string, fields?: string[], limit?: number) {
    this.assertEnabled();
    return this.client().requestListPosts(accountId, fields, limit);
  }

  async deleteAccount(id: string) {
    this.assertEnabled();
    return this.client().disconnectPage(id);
  }

  verifyWebhookSecret(secret: string | undefined) {
    const expected = process.env.BOXAPI_WEBHOOK_SECRET ?? '';
    if (!expected || !secret || secret !== expected) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
  }

  captureWebhook(input: {
    method: string;
    path: string;
    headers: Record<string, string | string[] | undefined>;
    payload: unknown;
  }): { accepted: boolean; duplicate: boolean; captureId: string; extracted: CapturedWebhookEvent['extracted'] } {
    this.assertEnabled();
    const flatHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(input.headers)) {
      if (v === undefined) continue;
      const lower = k.toLowerCase();
      // Never retain authorization-like headers in capture buffer.
      if (lower.includes('authorization') || lower.includes('api-key')) continue;
      flatHeaders[k] = Array.isArray(v) ? v.join(',') : v;
    }

    const extracted = extractWebhookIds(input.payload);
    const duplicate = extracted.eventIds.some((id) => this.seenEventIds.has(id));
    for (const id of extracted.eventIds) this.seenEventIds.add(id);

    const event: CapturedWebhookEvent = {
      id: randomUUID(),
      receivedAt: new Date().toISOString(),
      method: input.method,
      path: input.path,
      headers: flatHeaders,
      payload: input.payload,
      extracted,
    };
    this.captures.unshift(event);
    if (this.captures.length > CAPTURE_LIMIT) this.captures.length = CAPTURE_LIMIT;

    return {
      accepted: true,
      duplicate,
      captureId: event.id,
      extracted,
    };
  }

  listCaptures(limit = 50) {
    this.assertEnabled();
    return {
      count: this.captures.length,
      items: this.captures.slice(0, Math.min(limit, CAPTURE_LIMIT)),
    };
  }

  clearCaptures() {
    this.assertEnabled();
    this.captures.length = 0;
    this.seenEventIds.clear();
    return { cleared: true };
  }

  recordOauthCallback(query: Record<string, string>) {
    this.assertEnabled();
    const row = {
      id: randomUUID(),
      receivedAt: new Date().toISOString(),
      query,
    };
    this.oauthCallbacks.unshift(row);
    if (this.oauthCallbacks.length > 50) this.oauthCallbacks.length = 50;
    return row;
  }

  listOauthCallbacks() {
    this.assertEnabled();
    return { items: this.oauthCallbacks };
  }
}

function extractWebhookIds(payload: unknown): CapturedWebhookEvent['extracted'] {
  const eventIds: string[] = [];
  const accountIds: string[] = [];
  const messageMids: string[] = [];
  const eventTypes: string[] = [];

  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    const obj = node as Record<string, unknown>;
    if (typeof obj.event_id === 'string') eventIds.push(obj.event_id);
    if (typeof obj.event_type === 'string') eventTypes.push(obj.event_type);
    if (typeof obj.account_id === 'string') accountIds.push(obj.account_id);
    if (obj.message && typeof obj.message === 'object') {
      const mid = (obj.message as { mid?: string }).mid;
      if (typeof mid === 'string') messageMids.push(mid);
    }
    if (obj.body) visit(obj.body);
    if (obj.data) visit(obj.data);
    if (obj.messaging) visit(obj.messaging);
  };

  visit(payload);
  return {
    eventIds: [...new Set(eventIds)],
    accountIds: [...new Set(accountIds)],
    messageMids: [...new Set(messageMids)],
    eventTypes: [...new Set(eventTypes)],
  };
}
