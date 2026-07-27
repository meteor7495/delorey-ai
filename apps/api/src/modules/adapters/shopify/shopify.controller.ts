import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { CurrentAuth, SessionAuthGuard } from '../../platform/auth.guard';
import type { AuthContext } from '../../platform/auth.guard';
import { AuditService } from '../../audit/audit.service';
import { ShopifyAdapterService } from './shopify.service';

class ShopifyTokenConnectDto {
  @IsString()
  @MinLength(3)
  shopDomain!: string;

  @IsString()
  @MinLength(10)
  accessToken!: string;
}

class ShopifyOAuthStartDto {
  @IsString()
  @MinLength(3)
  shopDomain!: string;
}

@Controller()
export class ShopifyAdapterController {
  constructor(
    private readonly shopify: ShopifyAdapterService,
    private readonly audit: AuditService,
  ) {}

  @Get('store/shopify/status')
  @UseGuards(SessionAuthGuard)
  status() {
    return this.shopify.oauthStatus();
  }

  @Post('store/shopify/connect')
  @UseGuards(SessionAuthGuard)
  async connectToken(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: ShopifyTokenConnectDto,
  ) {
    const store = await this.shopify.connectWithToken(
      auth.tenantId,
      dto.shopDomain,
      dto.accessToken,
    );
    await this.audit.recordAdmin(
      auth,
      'store.shopify.connect',
      'اتصال Shopify',
      {
        shopDomain: store.shopDomain,
        syncHealth: store.syncHealth,
        productCount: store.productCount,
      },
    );
    return store;
  }

  @Post('store/shopify/oauth/start')
  @UseGuards(SessionAuthGuard)
  oauthStart(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: ShopifyOAuthStartDto,
  ) {
    const authorizeUrl = this.shopify.buildOAuthStartUrl(
      auth.tenantId,
      dto.shopDomain,
    );
    return { authorizeUrl };
  }

  @Get('oauth/store/callback')
  async oauthCallback(
    @Query()
    query: {
      code?: string;
      shop?: string;
      state?: string;
      hmac?: string;
    },
    @Res() res: Response,
  ) {
    const redirectTo = await this.shopify.handleOAuthCallback(query);
    return res.redirect(redirectTo);
  }

  @Post('store/sync')
  @UseGuards(SessionAuthGuard)
  async sync(@CurrentAuth() auth: AuthContext) {
    const store = await this.shopify.syncNow(auth.tenantId);
    await this.shopify.ensureWebhooks(auth.tenantId);
    await this.audit.recordAdmin(
      auth,
      'store.sync',
      'همگام‌سازی مجدد فروشگاه',
      {
        platform: store.platform,
        syncHealth: store.syncHealth,
        productCount: store.productCount,
      },
    );
    return store;
  }

  @Post('store/shopify/webhooks/register')
  @UseGuards(SessionAuthGuard)
  async registerWebhooks(@CurrentAuth() auth: AuthContext) {
    const result = await this.shopify.ensureWebhooks(auth.tenantId);
    await this.audit.recordAdmin(
      auth,
      'store.shopify.webhooks',
      'ثبت webhookهای Shopify',
      { webhookUrl: result?.webhookUrl },
    );
    return result;
  }

  @Post('webhooks/store/:connectionId')
  webhook(
    @Param('connectionId') connectionId: string,
    @Headers('x-shopify-topic') topic: string | undefined,
    @Headers('x-shopify-hmac-sha256') hmac: string | undefined,
    @Headers('x-shopify-webhook-id') webhookId: string | undefined,
    @Headers('x-shopify-shop-domain') shopDomain: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('بدنه خام webhook در دسترس نیست.');
    }
    return this.shopify.handleWebhook({
      connectionId,
      topic,
      hmac,
      webhookId,
      shopDomain,
      rawBody,
    });
  }
}
