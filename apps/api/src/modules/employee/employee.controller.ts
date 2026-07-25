import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';
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
}
