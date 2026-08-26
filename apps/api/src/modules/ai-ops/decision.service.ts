import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import { DataStore } from '../platform/data.store';
import type { Employee, EmployeeRole } from '../platform/types';
import { hasAiEmployeeEntitlement } from '../platform/entitlements';
import type { McpRiskLevel } from '../mcp/core/types';
import { EmployeePermissionService } from './employee-permission.service';
import { OperatingModeService } from './operating-mode.service';
import { AiActivityService } from './ai-activity.service';
import { McpClientService } from '../mcp/client/mcp-client.service';

export type DecisionCandidate = {
  action: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  risk: McpRiskLevel;
  auditClass?: string;
  title: string;
  description?: string;
  kind?: 'tool' | 'opportunity' | 'recovery' | 'campaign' | 'workflow';
  opportunityId?: string;
  payload?: Record<string, unknown>;
};

export type DecisionResult =
  | {
      status: 'executed';
      toolResult?: unknown;
      correlationId: string;
    }
  | {
      status: 'pending_approval';
      approvalId: string;
      correlationId: string;
    }
  | {
      status: 'rejected';
      reason: string;
      correlationId: string;
    }
  | {
      status: 'skipped';
      reason: string;
      correlationId: string;
    };

@Injectable()
export class DecisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly store: DataStore,
    private readonly permissions: EmployeePermissionService,
    private readonly modes: OperatingModeService,
    private readonly activity: AiActivityService,
    private readonly mcp: McpClientService,
  ) {}

  async decideAndExecute(params: {
    tenantId: string;
    role: EmployeeRole;
    candidate: DecisionCandidate;
    userId?: string;
    forceApprove?: boolean;
  }): Promise<DecisionResult> {
    const correlationId = uuid();
    const tenant = await this.store.findTenant(params.tenantId);
    if (!hasAiEmployeeEntitlement(tenant?.plan)) {
      return {
        status: 'rejected',
        reason: 'ai_employee_not_entitled',
        correlationId,
      };
    }
    const employee = await this.store.employeeForTenant(
      params.tenantId,
      params.role,
    );
    if (!employee) {
      return {
        status: 'rejected',
        reason: 'employee_not_found',
        correlationId,
      };
    }
    if (employee.status === 'paused' || employee.status === 'inactive') {
      await this.activity.record({
        tenantId: params.tenantId,
        employeeId: employee.id,
        actorType: 'policy',
        action: 'decision.skipped_inactive',
        result: 'skipped',
        correlationId,
      });
      return {
        status: 'skipped',
        reason: 'employee_inactive',
        correlationId,
      };
    }

    const scopes = this.permissions.resolveScopes(employee);
    const mcpCtx = this.mcp.createContext({
      tenantId: params.tenantId,
      employeeId: employee.id,
      userId: params.userId,
      scopes,
    });

    if (params.candidate.toolName) {
      const tools = this.mcp.discoverTools(mcpCtx);
      const tool = tools.find((t) => t.name === params.candidate.toolName);
      if (!tool) {
        return {
          status: 'rejected',
          reason: 'tool_not_found',
          correlationId,
        };
      }
      if (!this.permissions.canUseTool(employee, tool.permissions)) {
        await this.activity.record({
          tenantId: params.tenantId,
          employeeId: employee.id,
          actorType: 'policy',
          action: 'decision.permission_denied',
          tool: tool.name,
          result: 'error',
          correlationId,
        });
        return {
          status: 'rejected',
          reason: 'permission_denied',
          correlationId,
        };
      }
    }

    const needsApproval =
      !params.forceApprove &&
      this.modes.requiresApproval(
        employee.operatingMode,
        params.candidate.risk,
        params.candidate.auditClass,
      );

    if (needsApproval) {
      const approval = await this.prisma.aiApproval.create({
        data: {
          id: uuid(),
          tenantId: params.tenantId,
          employeeId: employee.id,
          kind: params.candidate.kind ?? 'tool',
          title: params.candidate.title,
          description: params.candidate.description ?? null,
          actionPayload: {
            action: params.candidate.action,
            toolName: params.candidate.toolName,
            toolArgs: params.candidate.toolArgs,
            payload: params.candidate.payload,
            role: params.role,
          } as Prisma.InputJsonValue,
          status: 'pending',
          opportunityId: params.candidate.opportunityId ?? null,
          riskLevel: params.candidate.risk,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      await this.activity.record({
        tenantId: params.tenantId,
        employeeId: employee.id,
        actorType: 'policy',
        action: 'decision.approval_required',
        tool: params.candidate.toolName,
        result: 'pending_approval',
        approvalId: approval.id,
        correlationId,
        inputSanitized: params.candidate.toolArgs ?? params.candidate.payload,
      });
      return {
        status: 'pending_approval',
        approvalId: approval.id,
        correlationId,
      };
    }

    return this.executeCandidate(
      params.tenantId,
      employee,
      params.candidate,
      correlationId,
    );
  }

  async executeCandidate(
    tenantId: string,
    employee: Employee,
    candidate: DecisionCandidate,
    correlationId: string,
  ): Promise<DecisionResult> {
    if (candidate.toolName) {
      try {
        const ctx = this.mcp.createContext({
          tenantId,
          employeeId: employee.id,
          scopes: this.permissions.resolveScopes(employee),
        });
        const toolResult = await this.mcp.callTool(
          ctx,
          candidate.toolName,
          candidate.toolArgs ?? {},
          { idempotencyKey: correlationId },
        );
        await this.activity.record({
          tenantId,
          employeeId: employee.id,
          actorType: 'employee',
          action: candidate.action,
          tool: candidate.toolName,
          result: 'success',
          correlationId,
          inputSanitized: candidate.toolArgs,
          outputSanitized: { ok: true },
        });
        return { status: 'executed', toolResult, correlationId };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'tool_error';
        await this.activity.record({
          tenantId,
          employeeId: employee.id,
          actorType: 'employee',
          action: candidate.action,
          tool: candidate.toolName,
          result: 'error',
          correlationId,
          outputSanitized: { error: message },
        });
        return { status: 'rejected', reason: message, correlationId };
      }
    }

    await this.activity.record({
      tenantId,
      employeeId: employee.id,
      actorType: 'employee',
      action: candidate.action,
      result: 'success',
      correlationId,
      inputSanitized: candidate.payload,
    });
    return { status: 'executed', correlationId };
  }

  async decideApproval(
    tenantId: string,
    approvalId: string,
    userId: string,
    decision: 'approved' | 'rejected',
  ) {
    const approval = await this.prisma.aiApproval.findFirst({
      where: { id: approvalId, tenantId },
    });
    if (!approval) return null;
    if (approval.status !== 'pending') return approval;

    const updated = await this.prisma.aiApproval.update({
      where: { id: approval.id },
      data: {
        status: decision === 'approved' ? 'approved' : 'rejected',
        decidedByUserId: userId,
        decidedAt: new Date(),
      },
    });

    await this.activity.record({
      tenantId,
      employeeId: approval.employeeId,
      actorType: 'user',
      action:
        decision === 'approved'
          ? 'approval.approved'
          : 'approval.rejected',
      result: decision === 'approved' ? 'success' : 'skipped',
      approvalId: approval.id,
    });

    if (decision === 'approved') {
      const payload = approval.actionPayload as {
        action?: string;
        toolName?: string;
        toolArgs?: Record<string, unknown>;
        payload?: Record<string, unknown>;
        role?: EmployeeRole;
      };
      const employee = approval.employeeId
        ? await this.prisma.employee.findFirst({
            where: { id: approval.employeeId, tenantId },
          })
        : null;
      if (employee && payload.toolName) {
        const mapped = await this.store.employeeForTenant(
          tenantId,
          (employee.role as EmployeeRole) || 'sales',
        );
        if (mapped) {
          const result = await this.executeCandidate(
            tenantId,
            mapped,
            {
              action: payload.action ?? 'approved_action',
              toolName: payload.toolName,
              toolArgs: payload.toolArgs,
              risk: (approval.riskLevel as McpRiskLevel) || 'MEDIUM',
              title: approval.title,
              payload: payload.payload,
            },
            uuid(),
          );
          if (result.status === 'executed') {
            await this.prisma.aiApproval.update({
              where: { id: approval.id },
              data: { status: 'executed' },
            });
          }
        }
      }
    }

    return updated;
  }

  async listApprovals(tenantId: string, status = 'pending') {
    return this.prisma.aiApproval.findMany({
      where: { tenantId, status },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
