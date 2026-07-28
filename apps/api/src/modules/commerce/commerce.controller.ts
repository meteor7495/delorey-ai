import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { CurrentAuth, SessionAuthGuard } from '../platform/auth.guard';
import type { AuthContext } from '../platform/auth.guard';
import { AuditService } from '../audit/audit.service';
import { CommerceService } from './commerce.service';

class UpdateWebsiteOriginsDto {
  @IsArray()
  @IsString({ each: true })
  origins!: string[];
}

@Controller()
@UseGuards(SessionAuthGuard)
export class CommerceController {
  constructor(
    private readonly commerce: CommerceService,
    private readonly audit: AuditService,
  ) {}

  @Get('store')
  store(@CurrentAuth() auth: AuthContext) {
    return this.commerce.getStore(auth.tenantId);
  }

  @Post('store/mock-connect')
  async mockConnect(@CurrentAuth() auth: AuthContext) {
    const store = await this.commerce.mockConnect(auth.tenantId);
    await this.audit.recordAdmin(
      auth,
      'store.mock_connect',
      'اتصال/همگام‌سازی mock فروشگاه',
      { syncHealth: store.syncHealth },
    );
    return store;
  }

  @Post('store/sync')
  async sync(@CurrentAuth() auth: AuthContext) {
    const store = await this.commerce.requestSync(auth.tenantId);
    await this.audit.recordAdmin(
      auth,
      'store.sync',
      store.queued
        ? 'همگام‌سازی در صف batch.sync'
        : 'همگام‌سازی فروشگاه (هم‌زمان)',
      {
        platform: store.platform,
        syncHealth: store.syncHealth,
        queued: store.queued,
        jobId: 'jobId' in store ? store.jobId : undefined,
      },
    );
    return store;
  }

  @Post('store/webhooks/register')
  async registerWebhooks(@CurrentAuth() auth: AuthContext) {
    const result = await this.commerce.registerWebhooks(auth.tenantId);
    await this.audit.recordAdmin(
      auth,
      'store.webhooks.register',
      'ثبت مجدد webhookهای فروشگاه',
      { webhookUrl: result?.webhookUrl },
    );
    return result;
  }

  @Get('catalog/products')
  products(@CurrentAuth() auth: AuthContext) {
    return this.commerce.listProducts(auth.tenantId);
  }

  @Get('channels/website')
  websiteChannel(@CurrentAuth() auth: AuthContext) {
    return this.commerce.getWebsiteChannel(auth.tenantId);
  }

  @Put('channels/website/origins')
  async updateWebsiteOrigins(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: UpdateWebsiteOriginsDto,
  ) {
    const channel = await this.commerce.updateWebsiteOrigins(
      auth.tenantId,
      dto.origins,
    );
    await this.audit.recordAdmin(
      auth,
      'channel.website.origins',
      'به‌روزرسانی دامنه‌های مجاز ویجت',
      { allowedOrigins: channel.allowedOrigins },
    );
    return channel;
  }

  @Get('orders')
  orders(@CurrentAuth() auth: AuthContext) {
    return this.commerce.listOrders(auth.tenantId).then((rows) =>
      rows.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        trackingCode: o.trackingCode,
        syncedAt: o.syncedAt,
        verifyHintPhoneLast4: o.customerPhoneLast4,
      })),
    );
  }
}
