import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
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
import { EmployeeService } from './employee.service';

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
  @IsObject()
  restrictedMutations?: {
    refund?: boolean;
    cancel?: boolean;
  };

  @IsOptional()
  @IsObject()
  escalationRules?: {
    onBlockedTopic?: boolean;
    onCustomerRequest?: boolean;
    onDiscountAboveCap?: boolean;
  };
}

@Controller('employee')
@UseGuards(SessionAuthGuard)
export class EmployeeController {
  constructor(private readonly employees: EmployeeService) {}

  @Get()
  get(@CurrentAuth() auth: AuthContext) {
    return this.employees.get(auth.tenantId);
  }

  @Put()
  update(@CurrentAuth() auth: AuthContext, @Body() dto: UpdateEmployeeDto) {
    return this.employees.update(auth.tenantId, dto);
  }

  @Put('guardrails')
  updateGuardrails(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: UpdateGuardrailsDto,
  ) {
    return this.employees.updateGuardrails(auth.tenantId, dto);
  }
}
