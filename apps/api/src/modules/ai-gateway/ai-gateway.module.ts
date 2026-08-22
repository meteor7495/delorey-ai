import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module';
import { AuditModule } from '../audit/audit.module';
import { BillingModule } from '../billing/billing.module';
import { AiGatewayService } from './ai-gateway.service';
import { AiGatewayController } from './ai-gateway.controller';
import { RouterService } from './application/router.service';
import { GatewayOpsService } from './application/gateway-ops.service';
import {
  PROVIDER_REGISTRY,
  ProviderFactory,
} from './infrastructure/provider.factory';
import { CircuitBreakerService } from './infrastructure/circuit-breaker.redis';
import { UsageLedgerService } from './infrastructure/persistence/usage-ledger.service';
import { TenantAiPolicyService } from './infrastructure/persistence/tenant-ai-policy.service';
import { ModelBindingService } from './infrastructure/persistence/model-binding.service';
import { ModelBindingBootstrap } from './infrastructure/persistence/model-binding.bootstrap';

@Module({
  imports: [PlatformModule, AuditModule, BillingModule],
  controllers: [AiGatewayController],
  providers: [
    ProviderFactory,
    {
      provide: PROVIDER_REGISTRY,
      useFactory: (factory: ProviderFactory) => factory.createRegistry(),
      inject: [ProviderFactory],
    },
    CircuitBreakerService,
    UsageLedgerService,
    TenantAiPolicyService,
    ModelBindingService,
    ModelBindingBootstrap,
    RouterService,
    GatewayOpsService,
    AiGatewayService,
  ],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}
