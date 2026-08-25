import { Injectable } from '@nestjs/common';
import { McpPlatformError } from './errors';
import type { McpRequestContext } from './types';

type Bucket = { count: number; resetAt: number };

/**
 * In-memory sliding window rate limiter.
 * Keys: client | tenant | user | agent | tool — production can swap to Redis later.
 */
@Injectable()
export class McpRateLimitService {
  private readonly buckets = new Map<string, Bucket>();

  private readonly limits = {
    tenant: { max: 600, windowMs: 60_000 },
    client: { max: 300, windowMs: 60_000 },
    user: { max: 120, windowMs: 60_000 },
    agent: { max: 120, windowMs: 60_000 },
    tool: { max: 60, windowMs: 60_000 },
    toolExpensive: { max: 20, windowMs: 60_000 },
  };

  assertAllowed(ctx: McpRequestContext, toolName: string, expensive = false): void {
    this.hit(`tenant:${ctx.tenantId}`, this.limits.tenant);
    if (ctx.clientId) this.hit(`client:${ctx.clientId}`, this.limits.client);
    if (ctx.userId) this.hit(`user:${ctx.userId}`, this.limits.user);
    if (ctx.employeeId) this.hit(`agent:${ctx.employeeId}`, this.limits.agent);
    this.hit(
      `tool:${ctx.tenantId}:${toolName}`,
      expensive ? this.limits.toolExpensive : this.limits.tool,
    );
  }

  private hit(key: string, cfg: { max: number; windowMs: number }): void {
    const now = Date.now();
    const cur = this.buckets.get(key);
    if (!cur || cur.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + cfg.windowMs });
      return;
    }
    cur.count += 1;
    if (cur.count > cfg.max) {
      throw new McpPlatformError('rate_limited', `Rate limit exceeded (${key.split(':')[0]})`, {
        retryAfterMs: cur.resetAt - now,
      });
    }
  }
}
