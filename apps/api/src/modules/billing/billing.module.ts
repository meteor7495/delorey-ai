import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MockPaymentProvider } from '../shop/payments/mock.payment-provider';
import { ZarinpalPaymentProvider } from '../shop/payments/zarinpal.payment-provider';
import { AdminBillingController } from './admin-billing.controller';
import { AdminBillingService } from './admin-billing.service';
import { AutoRechargeService } from './auto-recharge.service';
import { BillingAlertService } from './billing-alerts.service';
import { BillingBootstrap } from './billing.bootstrap';
import { BillingController } from './billing.controller';
import { BillingPaymentService } from './billing-payment.service';
import { BillingPaymentsController } from './billing-payments.controller';
import { BillingService } from './billing.service';
import { PlatformAdminGuard } from './platform-admin.guard';
import { PricingEngine } from './pricing.engine';
import { ReservationService } from './reservation.service';
import { UsageBillingService } from './usage.service';
import { WalletService } from './wallet.service';

@Module({
  imports: [AuditModule],
  controllers: [
    BillingController,
    BillingPaymentsController,
    AdminBillingController,
  ],
  providers: [
    WalletService,
    PricingEngine,
    UsageBillingService,
    ReservationService,
    BillingAlertService,
    BillingPaymentService,
    AutoRechargeService,
    BillingService,
    AdminBillingService,
    BillingBootstrap,
    PlatformAdminGuard,
    MockPaymentProvider,
    ZarinpalPaymentProvider,
  ],
  exports: [
    WalletService,
    UsageBillingService,
    ReservationService,
    BillingService,
    PricingEngine,
    AutoRechargeService,
  ],
})
export class BillingModule {}
