import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { PlatformModule } from '../../platform/platform.module';
import { ShopifyAdapterController } from './shopify.controller';
import { ShopifyAdapterService } from './shopify.service';

@Module({
  imports: [PlatformModule, AuditModule],
  controllers: [ShopifyAdapterController],
  providers: [ShopifyAdapterService],
  exports: [ShopifyAdapterService],
})
export class ShopifyAdapterModule {}
