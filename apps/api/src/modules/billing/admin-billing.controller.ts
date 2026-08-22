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
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CurrentAuth, SessionAuthGuard } from '../platform/auth.guard';
import type { AuthContext } from '../platform/auth.guard';
import { PlatformAdminGuard } from './platform-admin.guard';
import { AdminBillingService } from './admin-billing.service';
import { UsageBillingService } from './usage.service';

class ManualCreditDto {
  @IsString()
  tenantId!: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  idempotencyKey!: string;
}

class PricingDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  service!: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsString()
  unitType!: string;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsNumber()
  @Min(0)
  markup!: number;

  @IsOptional()
  @IsString()
  status?: string;
}

@Controller('admin/billing')
@UseGuards(SessionAuthGuard, PlatformAdminGuard)
export class AdminBillingController {
  constructor(
    private readonly admin: AdminBillingService,
    private readonly usage: UsageBillingService,
  ) {}

  @Get('tenants/:tenantId')
  tenant(@Param('tenantId') tenantId: string) {
    return this.admin.tenantOverview(tenantId);
  }

  @Get('usage')
  usageList(
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.usage.adminList({
      tenantId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('transactions')
  transactions(
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.admin.transactions({
      tenantId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('margins')
  margins(@Query('tenantId') tenantId?: string) {
    return this.admin.margins({ tenantId });
  }

  @Get('payments/failed')
  failed() {
    return this.admin.failedPayments();
  }

  @Get('pricing')
  pricing() {
    return this.admin.listPricing();
  }

  @Post('pricing')
  createPricing(@Body() dto: PricingDto) {
    return this.admin.upsertPricing({
      id: dto.id,
      service: dto.service,
      provider: dto.provider ?? '*',
      model: dto.model ?? '*',
      unitType: dto.unitType,
      unitPrice: dto.unitPrice,
      markup: dto.markup,
      status: dto.status,
    });
  }

  @Put('pricing/:id')
  updatePricing(@Param('id') id: string, @Body() dto: PricingDto) {
    return this.admin.upsertPricing({
      ...dto,
      id,
      provider: dto.provider ?? '*',
      model: dto.model ?? '*',
    });
  }

  @Post('credit')
  credit(@CurrentAuth() auth: AuthContext, @Body() dto: ManualCreditDto) {
    return this.admin.manualCredit({
      tenantId: dto.tenantId,
      amount: dto.amount,
      description: dto.description ?? 'اعتبار دستی',
      actorUserId: auth.userId,
      idempotencyKey: dto.idempotencyKey,
    });
  }

  @Post('refund')
  refund(@CurrentAuth() auth: AuthContext, @Body() dto: ManualCreditDto) {
    return this.admin.refund({
      tenantId: dto.tenantId,
      amount: dto.amount,
      description: dto.description ?? 'بازگشت وجه',
      actorUserId: auth.userId,
      idempotencyKey: dto.idempotencyKey,
    });
  }
}
