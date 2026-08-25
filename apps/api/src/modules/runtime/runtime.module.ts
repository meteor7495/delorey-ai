import { Module, forwardRef } from '@nestjs/common';
import { RuntimeService } from './runtime.service';
import { CommerceModule } from '../commerce/commerce.module';
import { ShopModule } from '../shop/shop.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { InboxModule } from '../inbox/inbox.module';
import { McpModule } from '../mcp/mcp.module';

@Module({
  imports: [
    CommerceModule,
    ShopModule,
    KnowledgeModule,
    AiGatewayModule,
    forwardRef(() => InboxModule),
    McpModule,
  ],
  providers: [RuntimeService],
  exports: [RuntimeService],
})
export class RuntimeModule {}
