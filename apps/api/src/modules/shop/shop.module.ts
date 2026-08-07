import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PlatformModule } from '../platform/platform.module';
import { ShopCmsController } from './shop-cms.controller';
import { StorefrontController } from './storefront.controller';
import { ShopService } from './shop.service';

@Module({
  imports: [PlatformModule, AuditModule],
  controllers: [ShopCmsController, StorefrontController],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}
