import { Module } from '@nestjs/common';
import { RuntimeService } from './runtime.service';
import { CommerceModule } from '../commerce/commerce.module';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';

@Module({
  imports: [CommerceModule, AiGatewayModule],
  providers: [RuntimeService],
  exports: [RuntimeService],
})
export class RuntimeModule {}
