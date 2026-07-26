import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentAuth, SessionAuthGuard } from '../platform/auth.guard';
import type { AuthContext } from '../platform/auth.guard';
import { AuditService } from '../audit/audit.service';
import { CommerceService } from './commerce.service';

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

  @Get('catalog/products')
  products(@CurrentAuth() auth: AuthContext) {
    return this.commerce.listProducts(auth.tenantId);
  }

  @Get('channels/website')
  websiteChannel(@CurrentAuth() auth: AuthContext) {
    return this.commerce.getWebsiteChannel(auth.tenantId);
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
