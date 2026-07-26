import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { CurrentAuth, SessionAuthGuard } from '../platform/auth.guard';
import type { AuthContext } from '../platform/auth.guard';
import { InboxService } from './inbox.service';
import type { EscalationReason } from '../platform/types';

class EscalateDto {
  @IsOptional()
  @IsIn([
    'customer_request',
    'blocked_topic',
    'low_confidence',
    'discount_cap',
    'sync_unhealthy',
    'skill_escalate',
    'operator_manual',
  ])
  reason?: EscalationReason;
}

class ReplyDto {
  @IsString()
  @MinLength(1)
  text!: string;
}

@Controller('inbox')
@UseGuards(SessionAuthGuard)
export class InboxController {
  constructor(private readonly inbox: InboxService) {}

  @Get('conversations')
  list(
    @CurrentAuth() auth: AuthContext,
    @Query('ownership') ownership?: 'ai_owned' | 'human_owned',
  ) {
    return this.inbox.list(auth.tenantId, ownership);
  }

  @Get('conversations/:id')
  get(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.inbox.getThread(auth.tenantId, id);
  }

  @Post('conversations/:id/escalate')
  escalate(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: EscalateDto,
  ) {
    return this.inbox.escalate(
      auth.tenantId,
      id,
      dto.reason ?? 'operator_manual',
    );
  }

  @Post('conversations/:id/takeover')
  takeover(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.inbox.takeover(auth.tenantId, id);
  }

  @Post('conversations/:id/release')
  release(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.inbox.release(auth.tenantId, id);
  }

  @Post('conversations/:id/messages')
  reply(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: ReplyDto,
  ) {
    return this.inbox.reply(auth.tenantId, id, dto.text);
  }
}
