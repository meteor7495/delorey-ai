import { Module } from '@nestjs/common';
import { RuntimeService } from './runtime.service';
import { CommerceModule } from '../commerce/commerce.module';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { InboxModule } from '../inbox/inbox.module';

@Module({
  imports: [CommerceModule, AiGatewayModule, InboxModule],
  providers: [RuntimeService],
  exports: [RuntimeService],
})
export class RuntimeModule {}
