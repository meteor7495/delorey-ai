import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { CurrentAuth, SessionAuthGuard } from '../../platform/auth.guard';
import type { AuthContext } from '../../platform/auth.guard';
import { BaleAdapterService } from './bale.service';
import type { BaleUpdate } from './bale.client';

class ConnectBaleDto {
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
export class BaleAdapterController {
  constructor(private readonly bale: BaleAdapterService) {}

  @Post('channels/bale/connect')
  @UseGuards(SessionAuthGuard)
  connect(@CurrentAuth() auth: AuthContext, @Body() dto: ConnectBaleDto) {
    return this.bale.connect(auth.tenantId, dto.botToken);
  }

  @Get('channels/bale')
  @UseGuards(SessionAuthGuard)
  status(@CurrentAuth() auth: AuthContext) {
    return this.bale.getStatus(auth.tenantId);
  }

  @Post('channels/bale/simulate')
  @UseGuards(SessionAuthGuard)
  simulate(@CurrentAuth() auth: AuthContext, @Body() dto: SimulateDto) {
    return this.bale.simulate(
      auth.tenantId,
      dto.text,
      dto.chatId ?? '20001',
      dto.updateId,
    );
  }

  @Post('webhooks/bale/:bindingId')
  webhook(
    @Param('bindingId') bindingId: string,
    @Headers('x-bale-bot-api-secret-token') baleSecret: string | undefined,
    @Headers('x-telegram-bot-api-secret-token') tgSecret: string | undefined,
    @Body() update: BaleUpdate,
  ) {
    return this.bale.handleWebhook(bindingId, baleSecret ?? tgSecret, update);
  }
}
