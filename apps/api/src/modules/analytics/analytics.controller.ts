import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentAuth, SessionAuthGuard } from '../platform/auth.guard';
import type { AuthContext } from '../platform/auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(SessionAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('summary')
  summary(@CurrentAuth() auth: AuthContext, @Query('days') days?: string) {
    const n = days ? Number(days) : 7;
    return this.analytics.summary(auth.tenantId, Number.isFinite(n) ? n : 7);
  }

  @Get('knowledge-gaps')
  gaps(@CurrentAuth() auth: AuthContext, @Query('days') days?: string) {
    const n = days ? Number(days) : 7;
    return this.analytics.knowledgeGaps(
      auth.tenantId,
      Number.isFinite(n) ? n : 7,
    );
  }

  @Get('revenue')
  revenue(@CurrentAuth() auth: AuthContext, @Query('days') days?: string) {
    const n = days ? Number(days) : 7;
    return this.analytics.revenue(auth.tenantId, Number.isFinite(n) ? n : 7);
  }

  @Get('channels')
  channels(@CurrentAuth() auth: AuthContext, @Query('days') days?: string) {
    const n = days ? Number(days) : 7;
    return this.analytics.channels(auth.tenantId, Number.isFinite(n) ? n : 7);
  }
}
