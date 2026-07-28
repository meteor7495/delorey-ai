import { Module } from '@nestjs/common';
import { AiGatewayService } from './ai-gateway.service';
import { RouterService } from './application/router.service';
import {
  PROVIDER_REGISTRY,
  ProviderFactory,
} from './infrastructure/provider.factory';

@Module({
  providers: [
    ProviderFactory,
    {
      provide: PROVIDER_REGISTRY,
      useFactory: (factory: ProviderFactory) => factory.createRegistry(),
      inject: [ProviderFactory],
    },
    RouterService,
    AiGatewayService,
  ],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}
