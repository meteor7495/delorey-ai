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
  constructor(private readonly knowledge: KnowledgeService) {}

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
  create(@CurrentAuth() auth: AuthContext, @Body() dto: CreateKnowledgeDto) {
    return this.knowledge.create(auth.tenantId, dto);
  }

  @Patch('docs/:id')
  update(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeDto,
  ) {
    return this.knowledge.update(auth.tenantId, id, dto);
  }

  @Delete('docs/:id')
  remove(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.knowledge.remove(auth.tenantId, id);
  }

  @Post('docs/:id/reindex')
  reindex(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.knowledge.reindex(auth.tenantId, id);
  }
}
