import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma.service';
import { DataStore } from '../../platform/data.store';
import { McpPlatformError } from './errors';
import type { McpClientKind, McpPermission, McpRequestContext, McpSurface } from './types';
import { v4 as uuid } from 'uuid';

const SENSITIVE_KEYS = /^(password|token|secret|cvv|cvc|card|authorization|api[_-]?key|merchant)/i;

@Injectable()
export class McpAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly store: DataStore,
  ) {}

  async authenticateBearer(
    authorization: string | undefined,
    opts?: { correlationId?: string; idempotencyKey?: string },
  ): Promise<McpRequestContext> {
    const header = authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) throw new McpPlatformError('unauthorized', 'Missing Bearer token');

    if (token.startsWith('mcp_')) {
      return this.authenticateMcpToken(token, opts);
    }
    return this.authenticateSession(token, opts);
  }

  /** Internal Runtime / Nest services — already trusted tenant binding */
  createInternalContext(input: {
    tenantId: string;
    userId?: string;
    employeeId?: string;
    clientId?: string;
    scopes?: McpPermission[];
    correlationId?: string;
  }): McpRequestContext {
    return {
      correlationId: input.correlationId ?? uuid(),
      tenantId: input.tenantId,
      userId: input.userId,
      employeeId: input.employeeId,
      clientId: input.clientId,
      clientKind: 'internal',
      surface: 'internal',
      scopes: input.scopes ?? ALL_INTERNAL_SCOPES,
      authVia: 'internal',
    };
  }

  async issueToken(input: {
    tenantId: string;
    clientId: string;
    name: string;
    scopes: McpPermission[];
    userId?: string;
    employeeId?: string;
    expiresAt?: Date;
  }): Promise<{ token: string; tokenId: string; prefix: string }> {
    const raw = `mcp_${randomBytes(32).toString('base64url')}`;
    const prefix = raw.slice(0, 12);
    const hash = hashToken(raw);
    const row = await this.prisma.mcpAccessToken.create({
      data: {
        id: uuid(),
        tenantId: input.tenantId,
        clientId: input.clientId,
        name: input.name,
        tokenPrefix: prefix,
        tokenHash: hash,
        scopes: input.scopes,
        userId: input.userId,
        employeeId: input.employeeId,
        expiresAt: input.expiresAt,
      },
    });
    return { token: raw, tokenId: row.id, prefix };
  }

  async revokeToken(tenantId: string, tokenId: string): Promise<void> {
    const row = await this.prisma.mcpAccessToken.findFirst({ where: { id: tokenId, tenantId } });
    if (!row) throw new McpPlatformError('not_found', 'Token not found');
    await this.prisma.mcpAccessToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }

  private async authenticateSession(
    token: string,
    opts?: { correlationId?: string; idempotencyKey?: string },
  ): Promise<McpRequestContext> {
    const session = await this.store.findSession(token);
    if (!session || new Date(session.expiresAt) < new Date()) {
      throw new McpPlatformError('unauthorized', 'Invalid session');
    }
    const user = await this.store.findUserById(session.userId);
    if (!user) throw new McpPlatformError('unauthorized', 'User missing');
    return {
      correlationId: opts?.correlationId ?? uuid(),
      tenantId: session.tenantId,
      userId: session.userId,
      email: user.email,
      clientKind: 'internal',
      surface: 'internal',
      scopes: ALL_INTERNAL_SCOPES,
      authVia: 'session',
      idempotencyKey: opts?.idempotencyKey,
    };
  }

  private async authenticateMcpToken(
    raw: string,
    opts?: { correlationId?: string; idempotencyKey?: string },
  ): Promise<McpRequestContext> {
    const hash = hashToken(raw);
    const row = await this.prisma.mcpAccessToken.findUnique({ where: { tokenHash: hash } });
    if (!row || row.revokedAt) throw new McpPlatformError('unauthorized', 'Invalid MCP token');
    if (row.expiresAt && row.expiresAt < new Date()) {
      throw new McpPlatformError('unauthorized', 'MCP token expired');
    }
    const client = await this.prisma.mcpClient.findFirst({
      where: { id: row.clientId, tenantId: row.tenantId, status: 'active' },
    });
    if (!client) throw new McpPlatformError('unauthorized', 'MCP client inactive');

    await this.prisma.mcpAccessToken.update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    });

    const scopes = Array.isArray(row.scopes) ? (row.scopes as McpPermission[]) : [];
    return {
      correlationId: opts?.correlationId ?? uuid(),
      tenantId: row.tenantId,
      userId: row.userId ?? undefined,
      employeeId: row.employeeId ?? undefined,
      clientId: row.clientId,
      clientKind: client.kind as McpClientKind,
      surface: (client.surface as McpSurface) || 'public',
      scopes,
      authVia: 'mcp_token',
      idempotencyKey: opts?.idempotencyKey,
    };
  }
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function safeEqualHash(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function sanitizeForAudit(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[truncated]';
  if (value == null) return value;
  if (typeof value === 'string') {
    if (value.length > 2000) return `${value.slice(0, 2000)}…`;
    return value;
  }
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => sanitizeForAudit(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.test(k)) {
      out[k] = '[redacted]';
    } else {
      out[k] = sanitizeForAudit(v, depth + 1);
    }
  }
  return out;
}

export function hashInput(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(sanitizeForAudit(value) ?? null)).digest('hex');
}

/** Session-authenticated Workspace operators get full internal scopes */
export const ALL_INTERNAL_SCOPES: McpPermission[] = [
  'products.read',
  'products.write',
  'inventory.read',
  'inventory.write',
  'orders.read',
  'orders.update',
  'orders.cancel',
  'orders.refund',
  'customers.read',
  'customers.write',
  'payments.read',
  'payments.write',
  'payments.refund',
  'marketing.read',
  'marketing.write',
  'marketing.send',
  'channels.read',
  'channels.write',
  'website.read',
  'website.write',
  'website.publish',
  'themes.read',
  'themes.write',
  'analytics.read',
  'agents.read',
  'agents.manage',
  'knowledge.read',
  'knowledge.write',
  'mcp.admin',
];
