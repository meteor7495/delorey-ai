import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentAuth, SessionAuthGuard } from '../platform/auth.guard';
import type { AuthContext } from '../platform/auth.guard';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(SessionAuthGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get('turns')
  list(
    @CurrentAuth() auth: AuthContext,
    @Query('days') days?: string,
    @Query('decision') decision?: string,
    @Query('conversationId') conversationId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.audit.list(auth.tenantId, {
      days: days ? Number(days) : 7,
      decision,
      conversationId,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get('turns/:id')
  get(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.audit.get(auth.tenantId, id);
  }

  @Get('admin')
  listAdmin(
    @CurrentAuth() auth: AuthContext,
    @Query('days') days?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.audit.listAdmin(auth.tenantId, {
      days: days ? Number(days) : 7,
      action,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get('admin/:id')
  getAdmin(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.audit.getAdmin(auth.tenantId, id);
  }
}
