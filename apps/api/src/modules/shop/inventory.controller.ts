import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { AuditService } from '../audit/audit.service';
import {
  CurrentAuth,
  SessionAuthGuard,
  type AuthContext,
} from '../platform/auth.guard';
import { CommerceRuleFilter } from './commerce-rule.filter';
import { INVENTORY_TRANSACTION_TYPES } from './domain';
import { InventoryService } from './inventory.service';

class AdjustInventoryDto {
  @IsOptional()
  @IsString()
  inventoryLevelId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  variantId?: string | null;

  @IsOptional()
  @IsInt()
  delta?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  setTo?: number;

  @IsOptional()
  @IsIn(INVENTORY_TRANSACTION_TYPES)
  type?: string;

  @IsOptional()
  @IsString()
  reason?: string | null;

  @IsOptional()
  @IsString()
  referenceType?: string | null;

  @IsOptional()
  @IsString()
  referenceId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;
}

class ThresholdDto {
  @IsInt()
  @Min(0)
  lowStockThreshold!: number;
}

@Controller('shop/inventory')
@UseGuards(SessionAuthGuard)
@UseFilters(CommerceRuleFilter)
export class InventoryController {
  constructor(
    private readonly inventory: InventoryService,
    private readonly audit: AuditService,
  ) {}

  @Get('summary')
  summary(@CurrentAuth() auth: AuthContext) {
    return this.inventory.summary(auth.tenantId);
  }

  @Get()
  list(
    @CurrentAuth() auth: AuthContext,
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('productId') productId?: string,
    @Query('state') state?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.inventory.list(auth.tenantId, {
      q,
      categoryId,
      productId,
      state,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('transactions')
  transactions(
    @CurrentAuth() auth: AuthContext,
    @Query('inventoryLevelId') inventoryLevelId?: string,
    @Query('productId') productId?: string,
    @Query('variantId') variantId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.inventory.transactions(auth.tenantId, {
      inventoryLevelId,
      productId,
      variantId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Post('adjust')
  async adjust(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: AdjustInventoryDto,
  ) {
    const row = await this.inventory.adjust(auth.tenantId, {
      ...dto,
      actorUserId: auth.userId,
    });
    await this.audit.recordAdmin(
      auth,
      'shop.inventory.adjust',
      `تغییر موجودی ${row.sku ?? row.productId} به ${row.onHand}`,
      {
        inventoryLevelId: row.id,
        productId: row.productId,
        variantId: row.variantId,
        onHand: row.onHand,
      },
    );
    return row;
  }

  @Patch(':id/threshold')
  async threshold(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: ThresholdDto,
  ) {
    const row = await this.inventory.setThreshold(
      auth.tenantId,
      id,
      dto.lowStockThreshold,
    );
    await this.audit.recordAdmin(
      auth,
      'shop.inventory.threshold',
      `تغییر آستانه موجودی کم به ${dto.lowStockThreshold}`,
      { inventoryLevelId: id },
    );
    return row;
  }
}
