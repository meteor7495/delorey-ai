import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module';
import { AiGatewayService } from './ai-gateway.service';
import { RouterService } from './application/router.service';
import {
  PROVIDER_REGISTRY,
  ProviderFactory,
} from './infrastructure/provider.factory';
import { CircuitBreakerService } from './infrastructure/circuit-breaker.redis';
import { UsageLedgerService } from './infrastructure/persistence/usage-ledger.service';
import { TenantAiPolicyService } from './infrastructure/persistence/tenant-ai-policy.service';
import { ModelBindingService } from './infrastructure/persistence/model-binding.service';

@Module({
  imports: [PlatformModule],
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
    RouterService,
    AiGatewayService,
  ],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}
