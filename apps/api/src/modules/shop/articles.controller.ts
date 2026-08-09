import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { AuditService } from '../audit/audit.service';
import {
  CurrentAuth,
  SessionAuthGuard,
  type AuthContext,
} from '../platform/auth.guard';
import { ArticlesService } from './articles.service';
import { CommerceRuleFilter } from './commerce-rule.filter';

class ArticleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  excerpt?: string | null;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  featuredImageUrl?: string | null;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string;

  @IsOptional()
  @IsString()
  seoTitle?: string | null;

  @IsOptional()
  @IsString()
  seoDescription?: string | null;
}

@Controller('shop/articles')
@UseGuards(SessionAuthGuard)
@UseFilters(CommerceRuleFilter)
export class ArticlesController {
  constructor(
    private readonly articles: ArticlesService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(
    @CurrentAuth() auth: AuthContext,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.articles.list(auth.tenantId, {
      q,
      status,
      categoryId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get(':id')
  get(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.articles.get(auth.tenantId, id);
  }

  @Post()
  async create(@CurrentAuth() auth: AuthContext, @Body() dto: ArticleDto) {
    const row = await this.articles.create(auth.tenantId, dto, auth.userId);
    await this.audit.recordAdmin(
      auth,
      'shop.article.create',
      `ایجاد مقاله ${row.title}`,
      { id: row.id },
    );
    return row;
  }

  @Patch(':id')
  async update(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: ArticleDto,
  ) {
    const row = await this.articles.update(auth.tenantId, id, dto);
    await this.audit.recordAdmin(
      auth,
      'shop.article.update',
      `ویرایش مقاله ${row.title}`,
      { id },
    );
    return row;
  }

  @Post(':id/publish')
  async publish(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    const row = await this.articles.publish(auth.tenantId, id);
    await this.audit.recordAdmin(
      auth,
      'shop.article.publish',
      `انتشار مقاله ${row.title}`,
      { id },
    );
    return row;
  }

  @Post(':id/unpublish')
  async unpublish(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    const row = await this.articles.unpublish(auth.tenantId, id);
    await this.audit.recordAdmin(
      auth,
      'shop.article.unpublish',
      `لغو انتشار مقاله ${row.title}`,
      { id },
    );
    return row;
  }

  @Delete(':id')
  async remove(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    const row = await this.articles.remove(auth.tenantId, id);
    await this.audit.recordAdmin(auth, 'shop.article.delete', 'حذف مقاله', {
      id,
    });
    return row;
  }
}
