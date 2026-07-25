import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentAuth, SessionAuthGuard } from '../platform/auth.guard';
import type { AuthContext } from '../platform/auth.guard';
import { CommerceService } from './commerce.service';

@Controller()
@UseGuards(SessionAuthGuard)
export class CommerceController {
  constructor(private readonly commerce: CommerceService) {}

  @Get('store')
  store(@CurrentAuth() auth: AuthContext) {
    return this.commerce.getStore(auth.tenantId);
  }

  @Post('store/mock-connect')
  mockConnect(@CurrentAuth() auth: AuthContext) {
    return this.commerce.mockConnect(auth.tenantId);
  }

  @Get('catalog/products')
  products(@CurrentAuth() auth: AuthContext) {
    return this.commerce.listProducts(auth.tenantId);
  }

  @Get('channels/website')
  websiteChannel(@CurrentAuth() auth: AuthContext) {
    return this.commerce.getWebsiteChannel(auth.tenantId);
  }
}
