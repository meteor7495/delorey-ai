import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { SessionAuthGuard, CurrentAuth, type AuthContext } from '../platform/auth.guard';
import { PrismaService } from '../platform/prisma.service';
import { McpRegistry } from './core/registry';
import { McpAuditService } from './core/audit.service';
import { McpApprovalService } from './core/approval.service';
import { McpAuthService, ALL_INTERNAL_SCOPES } from './core/auth.service';
import { McpExecutionService } from './core/execution.service';
import type { McpPermission } from './core/types';
import { v4 as uuid } from 'uuid';

class CreateClientDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsIn(['internal', 'external'])
  kind?: 'internal' | 'external';

  @IsOptional()
  @IsIn(['internal', 'public'])
  surface?: 'internal' | 'public';
}

class IssueTokenDto {
  @IsString()
  clientId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsArray()
  scopes?: McpPermission[];

  @IsOptional()
  @IsString()
  employeeId?: string;
}

class ToolOverrideDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsIn(['auto', 'approval_required', 'disabled'])
  approvalPolicy?: 'auto' | 'approval_required' | 'disabled';

  @IsOptional()
  @IsBoolean()
  publicEnabled?: boolean;
}

class ApprovalDecisionDto {
  @IsIn(['approved', 'rejected'])
  decision!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  reason?: string;
}

class InvokeToolDto {
  @IsString()
  tool!: string;

  @IsOptional()
  args?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

@Controller('mcp/admin')
@UseGuards(SessionAuthGuard)
export class McpAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: McpRegistry,
    private readonly audit: McpAuditService,
    private readonly approvals: McpApprovalService,
    private readonly auth: McpAuthService,
    private readonly execution: McpExecutionService,
  ) {}

  @Get('tools')
  listTools(@CurrentAuth() auth: AuthContext) {
    void auth;
    return {
      items: this.registry.listTools().map((t) => ({
        name: t.name,
        domain: t.domain,
        title: t.title,
        description: t.description,
        version: t.version,
        permissions: t.permissions,
        risk: t.risk,
        surface: t.surface,
        deprecated: !!t.deprecated,
        timeoutMs: t.timeoutMs,
      })),
    };
  }

  @Get('executions')
  listExecutions(
    @CurrentAuth() auth: AuthContext,
    @Query('tool') tool?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.audit.list(auth.tenantId, {
      toolName: tool,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get('approvals')
  listApprovals(@CurrentAuth() auth: AuthContext, @Query('status') status?: string) {
    return this.approvals.list(auth.tenantId, status ?? 'pending');
  }

  @Post('approvals/:id/decide')
  decideApproval(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() body: ApprovalDecisionDto,
  ) {
    return this.approvals.decide(auth.tenantId, id, body.decision, auth.userId, body.reason);
  }

  @Get('clients')
  async listClients(@CurrentAuth() auth: AuthContext) {
    const items = await this.prisma.mcpClient.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return { items };
  }

  @Post('clients')
  async createClient(@CurrentAuth() auth: AuthContext, @Body() body: CreateClientDto) {
    const row = await this.prisma.mcpClient.create({
      data: {
        id: uuid(),
        tenantId: auth.tenantId,
        name: body.name,
        kind: body.kind ?? 'external',
        surface: body.surface ?? 'public',
        status: 'active',
      },
    });
    return row;
  }

  @Post('tokens')
  async issueToken(@CurrentAuth() auth: AuthContext, @Body() body: IssueTokenDto) {
    const client = await this.prisma.mcpClient.findFirst({
      where: { id: body.clientId, tenantId: auth.tenantId },
    });
    if (!client) return { error: 'client_not_found' };
    const issued = await this.auth.issueToken({
      tenantId: auth.tenantId,
      clientId: body.clientId,
      name: body.name,
      scopes: body.scopes?.length ? body.scopes : ALL_INTERNAL_SCOPES.filter((s) => s.endsWith('.read')),
      userId: auth.userId,
      employeeId: body.employeeId,
    });
    return {
      tokenId: issued.tokenId,
      token: issued.token,
      prefix: issued.prefix,
      warning: 'Store this token once — it cannot be retrieved again',
    };
  }

  @Post('tokens/:id/revoke')
  revokeToken(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.auth.revokeToken(auth.tenantId, id);
  }

  @Patch('tools/:name')
  async overrideTool(
    @CurrentAuth() auth: AuthContext,
    @Param('name') name: string,
    @Body() body: ToolOverrideDto,
  ) {
    return this.prisma.mcpToolOverride.upsert({
      where: { tenantId_toolName: { tenantId: auth.tenantId, toolName: name } },
      create: {
        id: uuid(),
        tenantId: auth.tenantId,
        toolName: name,
        enabled: body.enabled ?? true,
        approvalPolicy: body.approvalPolicy,
        publicEnabled: body.publicEnabled,
      },
      update: {
        ...(body.enabled != null ? { enabled: body.enabled } : {}),
        ...(body.approvalPolicy != null ? { approvalPolicy: body.approvalPolicy } : {}),
        ...(body.publicEnabled != null ? { publicEnabled: body.publicEnabled } : {}),
      },
    });
  }

  /** Direct tool invoke for Workspace / internal agents without Streamable HTTP */
  @Post('invoke')
  async invoke(@CurrentAuth() auth: AuthContext, @Body() body: InvokeToolDto) {
    const ctx = this.auth.createInternalContext({
      tenantId: auth.tenantId,
      userId: auth.userId,
      scopes: ALL_INTERNAL_SCOPES,
      correlationId: uuid(),
    });
    if (body.idempotencyKey) ctx.idempotencyKey = body.idempotencyKey;
    return this.execution.execute(ctx, body.tool, body.args ?? {});
  }
}
