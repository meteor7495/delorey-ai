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
import { VariantsService } from './variants.service';

class AttributeSelectionDto {
  @IsString()
  attributeId!: string;

  @IsArray()
  @IsString({ each: true })
  valueIds!: string[];
}

class GenerateVariantsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeSelectionDto)
  selections!: AttributeSelectionDto[];

  /** Drop variants whose combination is no longer selected. */
  @IsOptional()
  @IsBoolean()
  removeMissing?: boolean;
}

class VariantDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  weightGrams?: number | null;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attributeValueIds?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  onHand?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;
}

class BulkVariantDto extends VariantDto {
  @IsString()
  id!: string;
}

class BulkVariantsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkVariantDto)
  variants!: BulkVariantDto[];
}

@Controller('shop')
@UseGuards(SessionAuthGuard)
@UseFilters(CommerceRuleFilter)
export class VariantsController {
  constructor(
    private readonly variants: VariantsService,
    private readonly audit: AuditService,
  ) {}

  @Get('products/:productId/variants')
  list(
    @CurrentAuth() auth: AuthContext,
    @Param('productId') productId: string,
  ) {
    return this.variants.listForProduct(auth.tenantId, productId);
  }

  @Post('products/:productId/variants/generate')
  async generate(
    @CurrentAuth() auth: AuthContext,
    @Param('productId') productId: string,
    @Body() dto: GenerateVariantsDto,
  ) {
    const result = await this.variants.generate(
      auth.tenantId,
      productId,
      dto.selections,
      { removeMissing: dto.removeMissing },
    );
    await this.audit.recordAdmin(
      auth,
      'shop.variant.generate',
      `تولید ${result.created} تنوع برای محصول`,
      {
        productId,
        created: result.created,
        removed: result.removed,
      },
    );
    return result;
  }

  @Post('products/:productId/variants')
  async create(
    @CurrentAuth() auth: AuthContext,
    @Param('productId') productId: string,
    @Body() dto: VariantDto,
  ) {
    const row = await this.variants.create(auth.tenantId, productId, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.variant.create',
      `ایجاد تنوع ${row.sku}`,
      { productId, variantId: row.id },
    );
    return row;
  }

  @Patch('products/:productId/variants/bulk')
  async bulk(
    @CurrentAuth() auth: AuthContext,
    @Param('productId') productId: string,
    @Body() dto: BulkVariantsDto,
  ) {
    const rows = await this.variants.bulkUpdate(
      auth.tenantId,
      productId,
      dto.variants,
    );
    await this.audit.recordAdmin(
      auth,
      'shop.variant.bulk',
      `به‌روزرسانی گروهی ${dto.variants.length} تنوع`,
      { productId, count: dto.variants.length },
    );
    return rows;
  }

  @Get('variants/:variantId')
  get(
    @CurrentAuth() auth: AuthContext,
    @Param('variantId') variantId: string,
  ) {
    return this.variants.get(auth.tenantId, variantId);
  }

  @Patch('variants/:variantId')
  async update(
    @CurrentAuth() auth: AuthContext,
    @Param('variantId') variantId: string,
    @Body() dto: VariantDto,
  ) {
    const row = await this.variants.update(auth.tenantId, variantId, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.variant.update',
      `ویرایش تنوع ${row.sku}`,
      { variantId },
    );
    return row;
  }

  @Delete('variants/:variantId')
  async remove(
    @CurrentAuth() auth: AuthContext,
    @Param('variantId') variantId: string,
  ) {
    const row = await this.variants.remove(auth.tenantId, variantId);
    await this.audit.recordAdmin(auth, 'shop.variant.delete', 'حذف تنوع', {
      variantId,
    });
    return row;
  }
}
