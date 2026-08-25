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
import { OrderWorkflowService } from './order-workflow.service';
import { CartService } from './cart.service';
import { CheckoutSessionService } from './checkout-session.service';
import { CheckoutController } from './checkout.controller';
import { ChannelMenuService } from './channel-menu.service';
import { CommerceEventsService } from './commerce-events.service';
import { NotificationService } from './notification.service';
import { PaymentLockService } from './payments/payment-lock.service';
import { MockPaymentProvider } from './payments/mock.payment-provider';
import { ZarinpalPaymentProvider } from './payments/zarinpal.payment-provider';
import { PaymentProviderResolver } from './payments/payment-provider-resolver.service';

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
    CheckoutController,
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
    OrderWorkflowService,
    CartService,
    CheckoutSessionService,
    ChannelMenuService,
    CommerceEventsService,
    NotificationService,
    PaymentLockService,
    MockPaymentProvider,
    ZarinpalPaymentProvider,
    PaymentProviderResolver,
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
    OrderWorkflowService,
    CartService,
    CheckoutSessionService,
    ChannelMenuService,
    CommerceEventsService,
    NotificationService,
    PaymentProviderResolver,
  ],
})
export class ShopModule {}
