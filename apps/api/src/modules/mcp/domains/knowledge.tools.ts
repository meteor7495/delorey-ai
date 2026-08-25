import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { McpRegistry } from '../core/registry';
import type { McpToolDefinition } from '../core/types';
import { KnowledgeService } from '../../knowledge/knowledge.service';

@Injectable()
export class KnowledgeToolsRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: McpRegistry,
    private readonly knowledge: KnowledgeService,
  ) {}

  onModuleInit() {
    const tools: McpToolDefinition[] = [
      {
        name: 'knowledge_list_docs',
        domain: 'knowledge',
        title: 'List knowledge docs',
        description: 'List FAQ/policy docs for the tenant.',
        version: '1.0.0',
        inputSchema: z.object({}),
        permissions: ['knowledge.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx) => ({ items: await this.knowledge.list(ctx.tenantId) }),
      },
      {
        name: 'knowledge_get_doc',
        domain: 'knowledge',
        title: 'Get knowledge doc',
        description: 'Fetch one knowledge document by id.',
        version: '1.0.0',
        inputSchema: z.object({ docId: z.string() }),
        permissions: ['knowledge.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx, input) => this.knowledge.get(ctx.tenantId, input.docId),
      },
      {
        name: 'knowledge_search',
        domain: 'knowledge',
        title: 'Search knowledge',
        description: 'Keyword search over knowledge chunks. Prefer for policy/FAQ grounding.',
        version: '1.0.0',
        inputSchema: z.object({ query: z.string().min(1) }),
        permissions: ['knowledge.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'public',
        timeoutMs: 15_000,
        idempotent: true,
        handler: async (ctx, input) => this.knowledge.search(ctx.tenantId, input.query),
      },
      {
        name: 'knowledge_create_doc',
        domain: 'knowledge',
        title: 'Create knowledge doc',
        description: 'Create FAQ or policy_override document.',
        version: '1.0.0',
        inputSchema: z.object({
          docType: z.enum(['faq', 'policy_override']),
          title: z.string().min(1),
          bodyText: z.string().min(1),
          sourceAttribution: z.string().min(1),
        }),
        permissions: ['knowledge.write'],
        risk: 'LOW',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 15_000,
        handler: async (ctx, input) => this.knowledge.create(ctx.tenantId, input),
      },
    ];
    for (const t of tools) this.registry.registerTool(t);
  }
}
