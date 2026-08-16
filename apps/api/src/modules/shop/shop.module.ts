import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PlatformModule } from '../platform/platform.module';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { AttributesController } from './attributes.controller';
import { AttributesService } from './attributes.service';
import { CommerceRetrievalService } from './commerce-retrieval.service';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { ShopCmsController } from './shop-cms.controller';
import { ShopService } from './shop.service';
import { StorefrontController } from './storefront.controller';
import { VariantsController } from './variants.controller';
import { VariantsService } from './variants.service';
import { CustomersService } from './customers.service';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ChannelCheckoutService } from './channel-checkout.service';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [PlatformModule, AuditModule],
  controllers: [
    ShopCmsController,
    AttributesController,
    VariantsController,
    InventoryController,
    DiscountsController,
    ArticlesController,
    StorefrontController,
    PaymentsController,
    UploadsController,
  ],
  providers: [
    ShopService,
    AttributesService,
    VariantsService,
    InventoryService,
    DiscountsService,
    ArticlesService,
    CommerceRetrievalService,
    CustomersService,
    PaymentsService,
    ChannelCheckoutService,
  ],
  exports: [
    ShopService,
    AttributesService,
    VariantsService,
    InventoryService,
    DiscountsService,
    ArticlesService,
    CommerceRetrievalService,
    CustomersService,
    PaymentsService,
    ChannelCheckoutService,
  ],
})
export class ShopModule {}
