import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { CurrentAuth, SessionAuthGuard } from '../../platform/auth.guard';
import type { AuthContext } from '../../platform/auth.guard';
import { AuditService } from '../../audit/audit.service';
import { WooCommerceAdapterService } from './woocommerce.service';

class WooConnectDto {
  @IsString()
  @MinLength(4)
  siteUrl!: string;

  @IsString()
  @MinLength(8)
  consumerKey!: string;

  @IsString()
  @MinLength(8)
  consumerSecret!: string;
}

@Controller()
export class WooCommerceAdapterController {
  constructor(
    private readonly woo: WooCommerceAdapterService,
    private readonly audit: AuditService,
  ) {}

  @Post('store/woocommerce/connect')
  @UseGuards(SessionAuthGuard)
  async connect(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: WooConnectDto,
  ) {
    const store = await this.woo.connectWithKeys(
      auth.tenantId,
      dto.siteUrl,
      dto.consumerKey,
      dto.consumerSecret,
    );
    await this.audit.recordAdmin(
      auth,
      'store.woocommerce.connect',
      'اتصال WooCommerce',
      {
        shopDomain: store.shopDomain,
        syncHealth: store.syncHealth,
        queued: store.queued,
      },
    );
    return store;
  }

  @Post('store/woocommerce/webhooks/register')
  @UseGuards(SessionAuthGuard)
  async registerWebhooks(@CurrentAuth() auth: AuthContext) {
    const result = await this.woo.ensureWebhooks(auth.tenantId);
    await this.audit.recordAdmin(
      auth,
      'store.woocommerce.webhooks',
      'ثبت webhookهای WooCommerce',
      { webhookUrl: result?.webhookUrl },
    );
    return result;
  }
}
