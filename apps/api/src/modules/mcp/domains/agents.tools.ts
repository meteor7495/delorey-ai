import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { McpRegistry } from '../core/registry';
import type { McpToolDefinition } from '../core/types';
import { EmployeeService } from '../../employee/employee.service';

@Injectable()
export class AgentsToolsRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: McpRegistry,
    private readonly employee: EmployeeService,
  ) {}

  onModuleInit() {
    const tools: McpToolDefinition[] = [
      {
        name: 'agents_list_agents',
        domain: 'agents',
        title: 'List agents',
        description: 'Seloma uses one Sales Employee per tenant — returns that agent (no system prompts).',
        version: '1.0.0',
        inputSchema: z.object({}),
        permissions: ['agents.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx) => {
          const e = await this.employee.get(ctx.tenantId);
          return {
            items: [
              {
                id: e.id,
                name: e.name,
                status: e.status,
                language: e.language,
                tone: e.tone,
                skills: e.skills,
              },
            ],
          };
        },
      },
      {
        name: 'agents_get_agent',
        domain: 'agents',
        title: 'Get agent',
        description: 'Sales Employee config without secrets. Guardrails included; no hidden system prompts.',
        version: '1.0.0',
        inputSchema: z.object({}),
        permissions: ['agents.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx) => {
          const e = await this.employee.get(ctx.tenantId);
          return {
            id: e.id,
            name: e.name,
            status: e.status,
            language: e.language,
            tone: e.tone,
            skills: e.skills,
            guardrails: e.guardrails,
          };
        },
      },
      {
        name: 'agents_enable_agent',
        domain: 'agents',
        title: 'Enable agent',
        description: 'Set Sales Employee status to active.',
        version: '1.0.0',
        inputSchema: z.object({}),
        permissions: ['agents.manage'],
        risk: 'MEDIUM',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 10_000,
        handler: async (ctx) => this.employee.update(ctx.tenantId, { status: 'active' }),
      },
      {
        name: 'agents_disable_agent',
        domain: 'agents',
        title: 'Disable agent',
        description: 'Pause Sales Employee (status paused).',
        version: '1.0.0',
        inputSchema: z.object({}),
        permissions: ['agents.manage'],
        risk: 'MEDIUM',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 10_000,
        handler: async (ctx) => this.employee.update(ctx.tenantId, { status: 'paused' }),
      },
      {
        name: 'agents_update_agent',
        domain: 'agents',
        title: 'Update agent',
        description: 'Update name/tone/language/skills flags.',
        version: '1.0.0',
        inputSchema: z.object({
          name: z.string().optional(),
          tone: z.string().optional(),
          language: z.string().optional(),
          skills: z
            .object({
              product_search: z.boolean().optional(),
              recommend: z.boolean().optional(),
              order_status: z.boolean().optional(),
              escalate: z.boolean().optional(),
            })
            .optional(),
        }),
        permissions: ['agents.manage'],
        risk: 'MEDIUM',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 10_000,
        handler: async (ctx, input) => this.employee.update(ctx.tenantId, input),
      },
    ];
    for (const t of tools) this.registry.registerTool(t);
  }
}
