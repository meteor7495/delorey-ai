import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CurrentAuth, SessionAuthGuard } from '../platform/auth.guard';
import type { AuthContext } from '../platform/auth.guard';
import { BillingService } from './billing.service';
import { UsageBillingService } from './usage.service';
import { AutoRechargeService } from './auto-recharge.service';

class PurchaseDto {
  @IsString()
  packId!: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

class AutoRechargeDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  thresholdAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  rechargeAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  monthlyLimit?: number;
}

class SpendingLimitDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyLimit?: number | null;
}

@Controller('billing')
@UseGuards(SessionAuthGuard)
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly usage: UsageBillingService,
    private readonly autoRecharge: AutoRechargeService,
  ) {}

  @Get('wallet')
  wallet(@CurrentAuth() auth: AuthContext) {
    return this.billing.walletDashboard(auth.tenantId, auth.email);
  }

  @Get('usage')
  usageSummary(@CurrentAuth() auth: AuthContext) {
    return this.usage.summarize(auth.tenantId);
  }

  @Get('transactions')
  transactions(
    @CurrentAuth() auth: AuthContext,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('type') type?: string,
  ) {
    return this.billing.transactions(auth.tenantId, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      type,
    });
  }

  @Post('credits/purchase')
  purchase(@CurrentAuth() auth: AuthContext, @Body() dto: PurchaseDto) {
    return this.billing.purchase(auth.tenantId, dto.packId, dto.idempotencyKey);
  }

  @Get('auto-recharge')
  async getAuto(@CurrentAuth() auth: AuthContext) {
    const row = await this.autoRecharge.getOrCreate(auth.tenantId);
    return {
      enabled: row.enabled,
      thresholdAmount: Number(row.thresholdAmount),
      rechargeAmount: Number(row.rechargeAmount),
      monthlyLimit: Number(row.monthlyLimit),
      pausedReason: row.pausedReason,
    };
  }

  @Put('auto-recharge')
  async putAuto(@CurrentAuth() auth: AuthContext, @Body() dto: AutoRechargeDto) {
    const row = await this.autoRecharge.update(auth.tenantId, dto);
    return {
      enabled: row.enabled,
      thresholdAmount: Number(row.thresholdAmount),
      rechargeAmount: Number(row.rechargeAmount),
      monthlyLimit: Number(row.monthlyLimit),
      pausedReason: row.pausedReason,
    };
  }

  @Get('spending-limit')
  spending(@CurrentAuth() auth: AuthContext) {
    return this.billing.getSpendingLimit(auth.tenantId);
  }

  @Put('spending-limit')
  putSpending(@CurrentAuth() auth: AuthContext, @Body() dto: SpendingLimitDto) {
    return this.billing.updateSpendingLimit(
      auth.tenantId,
      dto.monthlyLimit ?? null,
    );
  }
}
