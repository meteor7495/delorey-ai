import { Module, forwardRef } from '@nestjs/common';
import { RuntimeService } from './runtime.service';
import { CommerceModule } from '../commerce/commerce.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { InboxModule } from '../inbox/inbox.module';

@Module({
  imports: [
    CommerceModule,
    KnowledgeModule,
    AiGatewayModule,
    forwardRef(() => InboxModule),
  ],
  providers: [RuntimeService],
  exports: [RuntimeService],
})
export class RuntimeModule {}
