import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PlatformModule } from '../platform/platform.module';
import { ShopifyAdapterModule } from '../adapters/shopify/shopify.module';
import { WooCommerceAdapterModule } from '../adapters/woocommerce/woocommerce.module';
import { CommerceController } from './commerce.controller';
import { CommerceService } from './commerce.service';
import { StoreWebhookController } from './store-webhook.controller';

@Module({
  imports: [
    PlatformModule,
    AuditModule,
    forwardRef(() => ShopifyAdapterModule),
    forwardRef(() => WooCommerceAdapterModule),
  ],
  controllers: [CommerceController, StoreWebhookController],
  providers: [CommerceService],
  exports: [CommerceService],
})
export class CommerceModule {}
