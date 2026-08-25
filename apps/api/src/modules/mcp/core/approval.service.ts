import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma.service';
import { McpPlatformError } from './errors';
import type { McpApprovalPolicy, McpRequestContext, McpRiskLevel, McpToolDefinition } from './types';
import { DEFAULT_RISK_POLICY } from './types';
import { sanitizeForAudit } from './auth.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class McpApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  async resolvePolicy(
    tenantId: string,
    tool: McpToolDefinition,
  ): Promise<McpApprovalPolicy> {
    const override = await this.prisma.mcpToolOverride.findUnique({
      where: { tenantId_toolName: { tenantId, toolName: tool.name } },
    });
    if (override?.approvalPolicy === 'auto' || override?.approvalPolicy === 'approval_required' || override?.approvalPolicy === 'disabled') {
      return override.approvalPolicy;
    }
    if (override && override.enabled === false) return 'disabled';
    return tool.approvalPolicy ?? DEFAULT_RISK_POLICY[tool.risk as McpRiskLevel];
  }

  async isToolEnabled(tenantId: string, toolName: string, defaultEnabled = true): Promise<boolean> {
    const override = await this.prisma.mcpToolOverride.findUnique({
      where: { tenantId_toolName: { tenantId, toolName } },
    });
    if (!override) return defaultEnabled;
    return override.enabled;
  }

  async requireOrPass(
    ctx: McpRequestContext,
    tool: McpToolDefinition,
    args: unknown,
  ): Promise<{ approvalId?: string }> {
    const policy = await this.resolvePolicy(ctx.tenantId, tool);
    if (policy === 'disabled') {
      throw new McpPlatformError('forbidden', `Tool ${tool.name} is disabled for this tenant`);
    }
    if (policy === 'auto') return {};

    const approval = await this.prisma.mcpApproval.create({
      data: {
        id: uuid(),
        tenantId: ctx.tenantId,
        clientId: ctx.clientId,
        toolName: tool.name,
        toolVersion: tool.version,
        riskLevel: tool.risk,
        status: 'pending',
        inputSanitized: sanitizeForAudit(args) as object,
        requestedByUserId: ctx.userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    throw new McpPlatformError('approval_required', 'Human approval required before execution', {
      approvalId: approval.id,
      tool: tool.name,
      risk: tool.risk,
    });
  }

  async decide(
    tenantId: string,
    approvalId: string,
    decision: 'approved' | 'rejected',
    actorUserId: string,
    reason?: string,
  ) {
    const row = await this.prisma.mcpApproval.findFirst({ where: { id: approvalId, tenantId } });
    if (!row) throw new McpPlatformError('not_found', 'Approval not found');
    if (row.status !== 'pending') throw new McpPlatformError('conflict', 'Approval already decided');
    return this.prisma.mcpApproval.update({
      where: { id: approvalId },
      data: {
        status: decision,
        decidedByUserId: actorUserId,
        decidedAt: new Date(),
        reason,
      },
    });
  }

  async list(tenantId: string, status = 'pending') {
    return this.prisma.mcpApproval.findMany({
      where: { tenantId, status },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
