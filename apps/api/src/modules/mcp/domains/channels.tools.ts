import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { McpRegistry } from '../core/registry';
import { paginationInput, pageMeta } from '../core/schemas';
import { McpPlatformError } from '../core/errors';
import type { McpToolDefinition } from '../core/types';
import { InboxService } from '../../inbox/inbox.service';
import { DataStore } from '../../platform/data.store';

@Injectable()
export class ChannelsToolsRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: McpRegistry,
    private readonly inbox: InboxService,
    private readonly store: DataStore,
  ) {}

  onModuleInit() {
    const tools: McpToolDefinition[] = [
      {
        name: 'channels_get_channels',
        domain: 'channels',
        title: 'List channels',
        description: 'List channel bindings for the tenant (website/telegram/bale/instagram). No secrets.',
        version: '1.0.0',
        inputSchema: z.object({}),
        permissions: ['channels.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx) => {
          const [website, telegram, bale, instagram] = await Promise.all([
            this.store.websiteChannel(ctx.tenantId),
            this.store.telegramChannel(ctx.tenantId),
            this.store.baleChannel(ctx.tenantId),
            this.store.instagramChannel(ctx.tenantId),
          ]);
          const items = [website, telegram, bale, instagram]
            .filter(Boolean)
            .map((c) => ({
              id: c!.id,
              channel: c!.channel,
              status: c!.status,
              hasCredentials: Boolean(c!.credentialsCipher || c!.publicKey),
            }));
          return { items };
        },
      },
      {
        name: 'channels_search_conversations',
        domain: 'channels',
        title: 'Search conversations',
        description: 'List inbox conversations optionally filtered by ownership.',
        version: '1.0.0',
        inputSchema: z.object({
          ownership: z.enum(['ai_owned', 'human_owned']).optional(),
          ...paginationInput,
        }),
        permissions: ['channels.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 15_000,
        idempotent: true,
        handler: async (ctx, input) => {
          const rows = await this.inbox.list(ctx.tenantId, input.ownership);
          const total = rows.length;
          const items = rows.slice(input.offset, input.offset + input.limit).map((c) => ({
            id: c.id,
            channel: c.channel,
            ownership: c.ownership,
            customerId: c.customerId,
            updatedAt: c.updatedAt,
          }));
          return { items, meta: pageMeta(total, input.limit, input.offset) };
        },
      },
      {
        name: 'channels_get_conversation',
        domain: 'channels',
        title: 'Get conversation',
        description: 'Conversation thread with messages and shopping context.',
        version: '1.0.0',
        inputSchema: z.object({ conversationId: z.string() }),
        permissions: ['channels.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 15_000,
        idempotent: true,
        handler: async (ctx, input) => this.inbox.getThread(ctx.tenantId, input.conversationId),
      },
      {
        name: 'channels_send_message',
        domain: 'channels',
        title: 'Reply to customer',
        description: 'Operator reply on a conversation via inbox handoff delivery.',
        version: '1.0.0',
        inputSchema: z.object({
          conversationId: z.string(),
          text: z.string().min(1).max(4000),
        }),
        permissions: ['channels.write'],
        risk: 'MEDIUM',
        auditClass: 'communication',
        surface: 'internal',
        timeoutMs: 20_000,
        idempotent: true,
        handler: async (ctx, input) =>
          this.inbox.reply(ctx.tenantId, input.conversationId, input.text),
      },
      {
        name: 'channels_takeover_conversation',
        domain: 'channels',
        title: 'Take over conversation',
        description: 'Human takes ownership from AI.',
        version: '1.0.0',
        inputSchema: z.object({ conversationId: z.string() }),
        permissions: ['channels.write'],
        risk: 'LOW',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 10_000,
        handler: async (ctx, input) => this.inbox.takeover(ctx.tenantId, input.conversationId),
      },
      {
        name: 'channels_release_conversation',
        domain: 'channels',
        title: 'Release conversation',
        description: 'Return conversation to AI ownership.',
        version: '1.0.0',
        inputSchema: z.object({ conversationId: z.string() }),
        permissions: ['channels.write'],
        risk: 'LOW',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 10_000,
        handler: async (ctx, input) => this.inbox.release(ctx.tenantId, input.conversationId),
      },
      {
        name: 'channels_close_conversation',
        domain: 'channels',
        title: 'Close conversation',
        description: 'Not available — Seloma uses ownership handoff, not close/archive.',
        version: '1.0.0',
        inputSchema: z.object({ conversationId: z.string() }),
        permissions: ['channels.write'],
        risk: 'LOW',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 5_000,
        handler: async () => {
          throw new McpPlatformError('not_available', 'Conversation close is not modeled; use takeover/release');
        },
      },
    ];
    for (const t of tools) this.registry.registerTool(t);
  }
}
