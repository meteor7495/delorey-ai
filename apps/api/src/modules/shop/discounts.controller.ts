import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { AuditService } from '../audit/audit.service';
import {
  CurrentAuth,
  SessionAuthGuard,
  type AuthContext,
} from '../platform/auth.guard';
import { CommerceRuleFilter } from './commerce-rule.filter';
import { DiscountsService } from './discounts.service';

class DiscountTargetDto {
  @IsIn(['all', 'product', 'category', 'variant'])
  targetType!: string;

  @IsOptional()
  @IsString()
  targetId?: string | null;
}

class DiscountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string | null;

  @IsOptional()
  @IsIn(['percentage', 'fixed'])
  type?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  startsAt?: string | null;

  @IsOptional()
  @IsString()
  endsAt?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  perCustomerLimit?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minCartAmount?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number | null;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  stackable?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiscountTargetDto)
  targets?: DiscountTargetDto[];
}

class ValidateCodeDto {
  @IsString()
  code!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  subtotal?: number;
}

class QuoteDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  code?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  subtotal?: number;
}

@Controller('shop/discounts')
@UseGuards(SessionAuthGuard)
@UseFilters(CommerceRuleFilter)
export class DiscountsController {
  constructor(
    private readonly discounts: DiscountsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(@CurrentAuth() auth: AuthContext) {
    return this.discounts.list(auth.tenantId);
  }

  @Post('validate')
  validate(@CurrentAuth() auth: AuthContext, @Body() dto: ValidateCodeDto) {
    return this.discounts.validateCode(
      auth.tenantId,
      dto.code,
      dto.subtotal ?? 0,
    );
  }

  /** Price preview — the merchant UI never computes discounts locally. */
  @Post('quote')
  quote(@CurrentAuth() auth: AuthContext, @Body() dto: QuoteDto) {
    return this.discounts.quote(auth.tenantId, dto);
  }

  @Get(':id')
  get(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.discounts.get(auth.tenantId, id);
  }

  @Post()
  async create(@CurrentAuth() auth: AuthContext, @Body() dto: DiscountDto) {
    const row = await this.discounts.create(auth.tenantId, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.discount.create',
      `ایجاد تخفیف ${row.name}`,
      { id: row.id, code: row.code },
    );
    return row;
  }

  @Patch(':id')
  async update(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: DiscountDto,
  ) {
    const row = await this.discounts.update(auth.tenantId, id, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.discount.update',
      `ویرایش تخفیف ${row.name}`,
      { id },
    );
    return row;
  }

  @Delete(':id')
  async remove(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    const row = await this.discounts.remove(auth.tenantId, id);
    await this.audit.recordAdmin(auth, 'shop.discount.delete', 'حذف تخفیف', {
      id,
    });
    return row;
  }
}
