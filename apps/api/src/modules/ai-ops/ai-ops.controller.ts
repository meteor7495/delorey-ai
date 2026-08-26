import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { CurrentAuth, SessionAuthGuard } from '../platform/auth.guard';
import type { AuthContext } from '../platform/auth.guard';
import { AiEmployeeEntitlementGuard } from '../platform/ai-employee-entitlement.guard';
import { AuditService } from '../audit/audit.service';
import type { EmployeeRole } from '../platform/types';
import { EmployeeService } from '../employee/employee.service';
import { CommandCenterService } from './command-center.service';
import { OpportunityService } from './opportunity.service';
import { DecisionService } from './decision.service';
import { AiActivityService } from './ai-activity.service';
import { CartRecoveryService } from './cart-recovery.service';
import { CustomerMemoryService } from './customer-memory.service';
import { PrismaService } from '../platform/prisma.service';

class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  tone?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsIn(['inactive', 'active', 'paused'])
  status?: 'inactive' | 'active' | 'paused';

  @IsOptional()
  @IsIn(['copilot', 'assistant', 'autopilot'])
  operatingMode?: 'copilot' | 'assistant' | 'autopilot';

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  goals?: string[];

  @IsOptional()
  @IsObject()
  skills?: {
    product_search?: boolean;
    recommend?: boolean;
    order_status?: boolean;
    escalate?: boolean;
  };
}

class UpdateGuardrailsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedTopics?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountCapPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  cartAbandonHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  cartRecoveryMaxPerWeek?: number;

  @IsOptional()
  @IsObject()
  restrictedMutations?: { refund?: boolean; cancel?: boolean };

  @IsOptional()
  @IsObject()
  escalationRules?: {
    onBlockedTopic?: boolean;
    onCustomerRequest?: boolean;
    onDiscountAboveCap?: boolean;
  };
}

class DecideApprovalDto {
  @IsIn(['approved', 'rejected'])
  decision!: 'approved' | 'rejected';
}

const ROLES: EmployeeRole[] = [
  'sales',
  'support',
  'marketing',
  'analyst',
  'operations',
];

function parseRole(role: string): EmployeeRole | null {
  return ROLES.includes(role as EmployeeRole) ? (role as EmployeeRole) : null;
}

@Controller()
@UseGuards(SessionAuthGuard, AiEmployeeEntitlementGuard)
export class AiOpsController {
  constructor(
    private readonly employees: EmployeeService,
    private readonly commandCenter: CommandCenterService,
    private readonly opportunities: OpportunityService,
    private readonly decisions: DecisionService,
    private readonly activity: AiActivityService,
    private readonly cartRecovery: CartRecoveryService,
    private readonly memory: CustomerMemoryService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('command-center')
  getCommandCenter(@CurrentAuth() auth: AuthContext) {
    return this.commandCenter.get(auth.tenantId, auth.email);
  }

  @Get('employees')
  listEmployees(@CurrentAuth() auth: AuthContext) {
    return this.employees.list(auth.tenantId);
  }

  @Get('employees/:role')
  getEmployee(
    @CurrentAuth() auth: AuthContext,
    @Param('role') role: string,
  ) {
    const r = parseRole(role);
    if (!r) return { error: 'invalid_role' };
    return this.employees.getByRole(auth.tenantId, r);
  }

  @Put('employees/:role')
  async updateEmployee(
    @CurrentAuth() auth: AuthContext,
    @Param('role') role: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    const r = parseRole(role);
    if (!r) return { error: 'invalid_role' };
    const employee = await this.employees.updateByRole(auth.tenantId, r, dto);
    await this.audit.recordAdmin(auth, 'employee.update', 'به‌روزرسانی کارمند', {
      employeeId: employee.id,
      role: r,
      fields: Object.keys(dto),
    });
    return employee;
  }

  @Put('employees/:role/guardrails')
  async updateGuardrails(
    @CurrentAuth() auth: AuthContext,
    @Param('role') role: string,
    @Body() dto: UpdateGuardrailsDto,
  ) {
    const r = parseRole(role);
    if (!r) return { error: 'invalid_role' };
    const employee = await this.employees.updateGuardrailsByRole(
      auth.tenantId,
      r,
      dto,
    );
    await this.audit.recordAdmin(
      auth,
      'employee.guardrails',
      'به‌روزرسانی Guardrails',
      { employeeId: employee.id, role: r },
    );
    return employee;
  }

  @Get('employees/:role/activity')
  async employeeActivity(
    @CurrentAuth() auth: AuthContext,
    @Param('role') role: string,
  ) {
    const r = parseRole(role);
    if (!r) return { error: 'invalid_role' };
    const employee = await this.employees.getByRole(auth.tenantId, r);
    const [events, performance] = await Promise.all([
      this.activity.listForTenant(auth.tenantId, {
        employeeId: employee.id,
        limit: 50,
      }),
      this.activity.performanceForEmployee(auth.tenantId, employee.id),
    ]);
    return { employee, events, performance };
  }

  @Get('opportunities')
  async listOpportunities(
    @CurrentAuth() auth: AuthContext,
    @Query('status') status?: string,
  ) {
    await this.opportunities.scan(auth.tenantId);
    return this.opportunities.list(auth.tenantId, status || 'open');
  }

  @Post('opportunities/:id/execute')
  async executeOpportunity(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    const opp = await this.opportunities.get(auth.tenantId, id);
    if (!opp) return { error: 'not_found' };
    await this.opportunities.markStatus(auth.tenantId, id, 'in_progress');

    if (opp.type === 'abandoned_cart' && opp.relatedCartId) {
      const result = await this.cartRecovery.recoverCart(
        auth.tenantId,
        opp.relatedCartId,
      );
      if (result.status === 'executed') {
        await this.opportunities.markStatus(auth.tenantId, id, 'done');
      }
      return { opportunityId: id, result };
    }

    const decision = await this.decisions.decideAndExecute({
      tenantId: auth.tenantId,
      role: 'sales',
      userId: auth.userId,
      candidate: {
        action: opp.recommendedAction,
        title: opp.reason,
        kind: 'opportunity',
        risk: 'MEDIUM',
        auditClass: 'communication',
        opportunityId: opp.id,
        payload: {
          type: opp.type,
          relatedCustomerId: opp.relatedCustomerId,
          relatedOrderId: opp.relatedOrderId,
          relatedProductId: opp.relatedProductId,
        },
      },
    });
    return { opportunityId: id, result: decision };
  }

  @Post('opportunities/recover-carts')
  recoverAllCarts(@CurrentAuth() auth: AuthContext) {
    return this.cartRecovery.runTenantRecoveryScan(auth.tenantId);
  }

  @Get('approvals')
  listApprovals(
    @CurrentAuth() auth: AuthContext,
    @Query('status') status?: string,
  ) {
    return this.decisions.listApprovals(auth.tenantId, status || 'pending');
  }

  @Post('approvals/:id/decide')
  decideApproval(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: DecideApprovalDto,
  ) {
    return this.decisions.decideApproval(
      auth.tenantId,
      id,
      auth.userId,
      dto.decision,
    );
  }

  @Get('ai-activity')
  listActivity(
    @CurrentAuth() auth: AuthContext,
    @Query('limit') limit?: string,
  ) {
    return this.activity.listForTenant(auth.tenantId, {
      limit: limit ? Number(limit) : 50,
    });
  }

  @Get('customers/:id/memory')
  async customerMemory(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    const memory = await this.memory.recompute(auth.tenantId, id);
    return memory;
  }

  @Get('integrations')
  async integrations(@CurrentAuth() auth: AuthContext) {
    const [clients, overrides] = await Promise.all([
      this.prisma.mcpClient.findMany({
        where: { tenantId: auth.tenantId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.mcpToolOverride.findMany({
        where: { tenantId: auth.tenantId },
        take: 100,
      }),
    ]);
    return { clients, toolOverrides: overrides };
  }

  @Get('workflows')
  listWorkflows(@CurrentAuth() auth: AuthContext) {
    return this.prisma.workflowDefinition.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Get('experiments')
  listExperiments(@CurrentAuth() auth: AuthContext) {
    return this.prisma.experiment.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
