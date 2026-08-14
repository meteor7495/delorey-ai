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
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { AuditService } from '../audit/audit.service';
import {
  CurrentAuth,
  SessionAuthGuard,
  type AuthContext,
} from '../platform/auth.guard';
import { CommerceRuleFilter } from './commerce-rule.filter';
import { ShopService } from './shop.service';

class ProductDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  compareAtPrice?: number | null;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';

  @IsOptional()
  @IsString()
  shortDescription?: string | null;

  @IsOptional()
  @IsString()
  brand?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number | null;

  @IsOptional()
  @IsString()
  barcode?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  seoTitle?: string | null;

  @IsOptional()
  @IsString()
  seoDescription?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoKeywords?: string[];

  @IsOptional()
  @IsInt()
  onHand?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;
}

class BulkProductsDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];

  @IsIn(['publish', 'draft', 'delete', 'category'])
  action!: 'publish' | 'draft' | 'delete' | 'category';

  @IsOptional()
  @IsString()
  categoryId?: string | null;
}

class CategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  seoTitle?: string | null;

  @IsOptional()
  @IsString()
  seoDescription?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

class SettingsDto {
  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  storeSlug?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  themeId?: string;

  @IsOptional()
  @IsString()
  tagline?: string | null;

  @IsOptional()
  @IsBoolean()
  codEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  onlinePaymentEnabled?: boolean;

  @IsOptional()
  @IsString()
  zarinpalMerchantId?: string | null;

  @IsOptional()
  @IsString()
  supportPhone?: string | null;

  @IsOptional()
  @IsString()
  defaultCurrency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsBoolean()
  allowNegativeInventory?: boolean;

  @IsOptional()
  @IsIn(['draft', 'published'])
  defaultProductStatus?: string;
}

class BannerDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string | null;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  href?: string | null;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

class OrderStatusDto {
  @IsString()
  status!: string;
}

@Controller('shop')
@UseGuards(SessionAuthGuard)
@UseFilters(CommerceRuleFilter)
export class ShopCmsController {
  constructor(
    private readonly shop: ShopService,
    private readonly audit: AuditService,
  ) {}

  @Get('overview')
  overview(@CurrentAuth() auth: AuthContext) {
    return this.shop.getOverview(auth.tenantId);
  }

  @Get('settings')
  settings(@CurrentAuth() auth: AuthContext) {
    return this.shop.getSettings(auth.tenantId);
  }

  @Get('themes')
  themes() {
    return this.shop.listThemes();
  }

  @Put('settings')
  async updateSettings(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: SettingsDto,
  ) {
    const row = await this.shop.updateSettings(auth.tenantId, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.settings.update',
      'به‌روزرسانی تنظیمات فروشگاه بومی',
      { storeSlug: row.storeSlug },
    );
    return row;
  }

  @Get('categories')
  categories(@CurrentAuth() auth: AuthContext) {
    return this.shop.listCategories(auth.tenantId);
  }

  @Post('categories')
  async createCategory(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CategoryDto,
  ) {
    const row = await this.shop.createCategory(auth.tenantId, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.category.create',
      `ایجاد دسته ${row.name}`,
      { id: row.id },
    );
    return row;
  }

  @Patch('categories/:id')
  async updateCategory(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: CategoryDto,
  ) {
    const row = await this.shop.updateCategory(auth.tenantId, id, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.category.update',
      `ویرایش دسته ${row.name}`,
      { id },
    );
    return row;
  }

  @Delete('categories/:id')
  async deleteCategory(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    const row = await this.shop.deleteCategory(auth.tenantId, id);
    await this.audit.recordAdmin(
      auth,
      'shop.category.delete',
      'حذف دسته',
      { id },
    );
    return row;
  }

  @Get('products')
  products(
    @CurrentAuth() auth: AuthContext,
    @Query('source') source?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('stock') stock?: string,
    @Query('hasVariants') hasVariants?: string,
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.shop.listCmsProducts(auth.tenantId, {
      source,
      q,
      status,
      categoryId,
      stock,
      hasVariants:
        hasVariants === undefined ? undefined : hasVariants === 'true',
      sort,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('products/:id')
  product(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.shop.getCmsProduct(auth.tenantId, id);
  }

  @Post('products/bulk')
  async bulkProducts(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: BulkProductsDto,
  ) {
    const result = await this.shop.bulkProducts(auth.tenantId, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.product.bulk',
      `عملیات گروهی «${dto.action}» روی ${result.affected} محصول`,
      { action: dto.action, ids: dto.ids, affected: result.affected },
    );
    return result;
  }

  @Post('products')
  async createProduct(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: ProductDto,
  ) {
    const row = await this.shop.createNativeProduct(auth.tenantId, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.product.create',
      `ایجاد محصول ${row.title}`,
      { id: row.id, sku: row.sku },
    );
    return row;
  }

  @Patch('products/:id')
  async updateProduct(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: ProductDto,
  ) {
    const row = await this.shop.updateNativeProduct(auth.tenantId, id, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.product.update',
      `ویرایش محصول ${row.title}`,
      { id },
    );
    return row;
  }

  @Delete('products/:id')
  async deleteProduct(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    const row = await this.shop.deleteNativeProduct(auth.tenantId, id);
    await this.audit.recordAdmin(
      auth,
      'shop.product.delete',
      'حذف محصول بومی',
      { id },
    );
    return row;
  }

  @Get('banners')
  banners(@CurrentAuth() auth: AuthContext) {
    return this.shop.listBanners(auth.tenantId);
  }

  @Post('banners')
  async createBanner(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: BannerDto,
  ) {
    const row = await this.shop.createBanner(auth.tenantId, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.banner.create',
      `ایجاد بنر ${row.title}`,
      { id: row.id },
    );
    return row;
  }

  @Patch('banners/:id')
  async updateBanner(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: BannerDto,
  ) {
    const row = await this.shop.updateBanner(auth.tenantId, id, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.banner.update',
      `ویرایش بنر ${row.title}`,
      { id },
    );
    return row;
  }

  @Delete('banners/:id')
  async deleteBanner(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    const row = await this.shop.deleteBanner(auth.tenantId, id);
    await this.audit.recordAdmin(
      auth,
      'shop.banner.delete',
      'حذف بنر',
      { id },
    );
    return row;
  }

  @Get('orders')
  orders(@CurrentAuth() auth: AuthContext) {
    return this.shop.listStorefrontOrders(auth.tenantId);
  }

  @Patch('orders/:id')
  async updateOrder(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: OrderStatusDto,
  ) {
    const row = await this.shop.updateStorefrontOrderStatus(
      auth.tenantId,
      id,
      dto.status,
    );
    await this.audit.recordAdmin(
      auth,
      'shop.order.status',
      `تغییر وضعیت سفارش ${row.orderNumber} به ${row.status}`,
      { id, status: row.status },
    );
    return row;
  }
}
