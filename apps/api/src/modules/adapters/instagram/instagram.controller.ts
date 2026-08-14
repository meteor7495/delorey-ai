import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { CurrentAuth, SessionAuthGuard } from '../../platform/auth.guard';
import type { AuthContext } from '../../platform/auth.guard';
import { AuditService } from '../../audit/audit.service';
import { InstagramAdapterService } from './instagram.service';

class ConnectInstagramDto {
  @IsOptional()
  @IsString()
  pageLabel?: string;
}

class SimulateDto {
  @IsString()
  @MinLength(1)
  text!: string;

  @IsOptional()
  @IsString()
  threadId?: string;
}

@Controller()
export class InstagramAdapterController {
  constructor(
    private readonly instagram: InstagramAdapterService,
    private readonly audit: AuditService,
  ) {}

  @Post('channels/instagram/connect')
  @UseGuards(SessionAuthGuard)
  async connect(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: ConnectInstagramDto,
  ) {
    const channel = await this.instagram.connect(auth.tenantId, dto.pageLabel);
    await this.audit.recordAdmin(
      auth,
      'channel.instagram.connect',
      'اتصال کانال Instagram',
      { channelId: channel.id },
    );
    return channel;
  }

  @Get('channels/instagram')
  @UseGuards(SessionAuthGuard)
  status(@CurrentAuth() auth: AuthContext) {
    return this.instagram.getStatus(auth.tenantId);
  }

  @Post('channels/instagram/simulate')
  @UseGuards(SessionAuthGuard)
  simulate(@CurrentAuth() auth: AuthContext, @Body() dto: SimulateDto) {
    return this.instagram.simulate(
      auth.tenantId,
      dto.text,
      dto.threadId ?? 'ig-user-1',
    );
  }

  @Post('webhooks/instagram/:bindingId')
  webhook(
    @Param('bindingId') bindingId: string,
    @Headers('x-webhook-secret') secret: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.instagram.handleWebhook(bindingId, secret, body ?? {});
  }
}
