import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { CurrentAuth, SessionAuthGuard } from '../../platform/auth.guard';
import type { AuthContext } from '../../platform/auth.guard';
import { AuditService } from '../../audit/audit.service';
import { TelegramAdapterService } from './telegram.service';
import type { TelegramUpdate } from './telegram.client';

class ConnectTelegramDto {
  @IsString()
  @MinLength(20)
  botToken!: string;
}

class SimulateDto {
  @IsString()
  @MinLength(1)
  text!: string;

  @IsOptional()
  @IsString()
  chatId?: string;

  @IsOptional()
  @IsNumber()
  updateId?: number;
}

@Controller()
export class TelegramAdapterController {
  constructor(
    private readonly telegram: TelegramAdapterService,
    private readonly audit: AuditService,
  ) {}

  @Post('channels/telegram/connect')
  @UseGuards(SessionAuthGuard)
  async connect(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: ConnectTelegramDto,
  ) {
    const channel = await this.telegram.connect(auth.tenantId, dto.botToken);
    await this.audit.recordAdmin(
      auth,
      'channel.telegram.connect',
      'اتصال کانال Telegram',
      {
        channelId: channel.id,
        botUsername: channel.botUsername,
      },
    );
    return channel;
  }

  @Get('channels/telegram')
  @UseGuards(SessionAuthGuard)
  status(@CurrentAuth() auth: AuthContext) {
    return this.telegram.getStatus(auth.tenantId);
  }

  @Post('channels/telegram/simulate')
  @UseGuards(SessionAuthGuard)
  simulate(@CurrentAuth() auth: AuthContext, @Body() dto: SimulateDto) {
    return this.telegram.simulate(
      auth.tenantId,
      dto.text,
      dto.chatId ?? '10001',
      dto.updateId,
    );
  }

  @Post('webhooks/telegram/:bindingId')
  webhook(
    @Param('bindingId') bindingId: string,
    @Headers('x-telegram-bot-api-secret-token') secret: string | undefined,
    @Body() update: TelegramUpdate,
  ) {
    return this.telegram.handleWebhook(bindingId, secret, update);
  }
}
