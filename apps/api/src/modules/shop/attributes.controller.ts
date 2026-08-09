import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { AuditService } from '../audit/audit.service';
import {
  CurrentAuth,
  SessionAuthGuard,
  type AuthContext,
} from '../platform/auth.guard';
import { AttributesService } from './attributes.service';
import { CommerceRuleFilter } from './commerce-rule.filter';

class AttributeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsIn(['text', 'number', 'select', 'multi_select', 'color', 'boolean'])
  type?: string;

  @IsOptional()
  @IsIn(['dropdown', 'swatch', 'chip', 'radio'])
  displayType?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

class AttributeValueDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  label?: string | null;

  @IsOptional()
  @IsString()
  colorHex?: string | null;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class ProductAttributesDto {
  @IsArray()
  @IsString({ each: true })
  attributeIds!: string[];
}

@Controller('shop')
@UseGuards(SessionAuthGuard)
@UseFilters(CommerceRuleFilter)
export class AttributesController {
  constructor(
    private readonly attributes: AttributesService,
    private readonly audit: AuditService,
  ) {}

  @Get('attributes')
  list(@CurrentAuth() auth: AuthContext, @Query('active') active?: string) {
    return this.attributes.list(auth.tenantId, {
      activeOnly: active === 'true',
    });
  }

  @Get('attributes/:id')
  get(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.attributes.get(auth.tenantId, id);
  }

  @Post('attributes')
  async create(@CurrentAuth() auth: AuthContext, @Body() dto: AttributeDto) {
    const row = await this.attributes.create(auth.tenantId, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.attribute.create',
      `ایجاد ویژگی ${row.name}`,
      { id: row.id },
    );
    return row;
  }

  @Patch('attributes/:id')
  async update(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: AttributeDto,
  ) {
    const row = await this.attributes.update(auth.tenantId, id, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.attribute.update',
      `ویرایش ویژگی ${row.name}`,
      { id },
    );
    return row;
  }

  @Delete('attributes/:id')
  async remove(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    const row = await this.attributes.remove(auth.tenantId, id);
    await this.audit.recordAdmin(auth, 'shop.attribute.delete', 'حذف ویژگی', {
      id,
    });
    return row;
  }

  @Post('attributes/:id/values')
  async addValue(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: AttributeValueDto,
  ) {
    const row = await this.attributes.addValue(auth.tenantId, id, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.attribute.value.create',
      `افزودن مقدار به ویژگی ${row.name}`,
      { attributeId: id, value: dto.value },
    );
    return row;
  }

  @Patch('attribute-values/:valueId')
  async updateValue(
    @CurrentAuth() auth: AuthContext,
    @Param('valueId') valueId: string,
    @Body() dto: AttributeValueDto,
  ) {
    const row = await this.attributes.updateValue(auth.tenantId, valueId, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.attribute.value.update',
      `ویرایش مقدار ویژگی ${row.name}`,
      { valueId },
    );
    return row;
  }

  @Delete('attribute-values/:valueId')
  async removeValue(
    @CurrentAuth() auth: AuthContext,
    @Param('valueId') valueId: string,
  ) {
    const row = await this.attributes.removeValue(auth.tenantId, valueId);
    await this.audit.recordAdmin(
      auth,
      'shop.attribute.value.delete',
      `حذف مقدار ویژگی ${row.name}`,
      { valueId },
    );
    return row;
  }

  @Get('products/:productId/attributes')
  listForProduct(
    @CurrentAuth() auth: AuthContext,
    @Param('productId') productId: string,
  ) {
    return this.attributes.listForProduct(auth.tenantId, productId);
  }

  @Put('products/:productId/attributes')
  async setForProduct(
    @CurrentAuth() auth: AuthContext,
    @Param('productId') productId: string,
    @Body() dto: ProductAttributesDto,
  ) {
    const rows = await this.attributes.setForProduct(
      auth.tenantId,
      productId,
      dto.attributeIds,
    );
    await this.audit.recordAdmin(
      auth,
      'shop.product.attributes.set',
      'به‌روزرسانی ویژگی‌های محصول',
      { productId, attributeIds: dto.attributeIds },
    );
    return rows;
  }
}
