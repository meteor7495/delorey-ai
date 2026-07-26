import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { CurrentAuth, SessionAuthGuard } from '../platform/auth.guard';
import type { AuthContext } from '../platform/auth.guard';
import { AuditService } from '../audit/audit.service';
import { KnowledgeService } from './knowledge.service';

class CreateKnowledgeDto {
  @IsIn(['faq', 'policy_override'])
  docType!: 'faq' | 'policy_override';

  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(4)
  bodyText!: string;

  @IsString()
  @MinLength(2)
  sourceAttribution!: string;
}

class UpdateKnowledgeDto {
  @IsOptional()
  @IsIn(['faq', 'policy_override'])
  docType?: 'faq' | 'policy_override';

  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  bodyText?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  sourceAttribution?: string;
}

@Controller('knowledge')
@UseGuards(SessionAuthGuard)
export class KnowledgeController {
  constructor(
    private readonly knowledge: KnowledgeService,
    private readonly audit: AuditService,
  ) {}

  @Get('docs')
  list(@CurrentAuth() auth: AuthContext) {
    return this.knowledge.list(auth.tenantId);
  }

  @Get('index-status')
  indexStatus(@CurrentAuth() auth: AuthContext) {
    return this.knowledge.indexStatus(auth.tenantId);
  }

  @Get('docs/:id')
  get(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.knowledge.get(auth.tenantId, id);
  }

  @Post('docs')
  async create(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateKnowledgeDto,
  ) {
    const doc = await this.knowledge.create(auth.tenantId, dto);
    await this.audit.recordAdmin(auth, 'knowledge.create', `ایجاد: ${doc.title}`, {
      docId: doc.id,
      docType: doc.docType,
    });
    return doc;
  }

  @Patch('docs/:id')
  async update(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeDto,
  ) {
    const doc = await this.knowledge.update(auth.tenantId, id, dto);
    await this.audit.recordAdmin(
      auth,
      'knowledge.update',
      `ویرایش: ${doc.title}`,
      { docId: doc.id, fields: Object.keys(dto) },
    );
    return doc;
  }

  @Delete('docs/:id')
  async remove(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    await this.knowledge.remove(auth.tenantId, id);
    await this.audit.recordAdmin(auth, 'knowledge.delete', 'حذف سند دانش', {
      docId: id,
    });
    return { ok: true };
  }

  @Post('docs/:id/reindex')
  async reindex(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    const doc = await this.knowledge.reindex(auth.tenantId, id);
    await this.audit.recordAdmin(auth, 'knowledge.reindex', `بازشاخص: ${doc.title}`, {
      docId: doc.id,
    });
    return doc;
  }
}
