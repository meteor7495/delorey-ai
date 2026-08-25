import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module';
import { ShopModule } from '../shop/shop.module';
import { InboxModule } from '../inbox/inbox.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { EmployeeModule } from '../employee/employee.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { McpRegistry } from './core/registry';
import { McpAuthService } from './core/auth.service';
import { McpAuditService } from './core/audit.service';
import { McpRateLimitService } from './core/rate-limit.service';
import { McpApprovalService } from './core/approval.service';
import { McpExecutionService } from './core/execution.service';
import { McpServerFactory } from './core/server.factory';
import { McpClientService } from './client/mcp-client.service';
import { McpController } from './mcp.controller';
import { McpAdminController } from './mcp-admin.controller';
import { CommerceToolsRegistrar } from './domains/commerce.tools';
import { InventoryToolsRegistrar } from './domains/inventory.tools';
import { OrdersToolsRegistrar } from './domains/orders.tools';
import { CustomersToolsRegistrar } from './domains/customers.tools';
import { PaymentsToolsRegistrar } from './domains/payments.tools';
import { ChannelsToolsRegistrar } from './domains/channels.tools';
import { WebsiteToolsRegistrar } from './domains/website.tools';
import { ThemesToolsRegistrar } from './domains/themes.tools';
import { AnalyticsToolsRegistrar } from './domains/analytics.tools';
import { AgentsToolsRegistrar } from './domains/agents.tools';
import { KnowledgeToolsRegistrar } from './domains/knowledge.tools';
import { MarketingToolsRegistrar } from './domains/marketing.tools';
import { McpResourcesRegistrar } from './resources/store.resources';
import { McpPromptsRegistrar } from './prompts/business.prompts';

@Module({
  imports: [
    PlatformModule,
    ShopModule,
    InboxModule,
    AnalyticsModule,
    EmployeeModule,
    KnowledgeModule,
  ],
  controllers: [McpController, McpAdminController],
  providers: [
    McpRegistry,
    McpAuthService,
    McpAuditService,
    McpRateLimitService,
    McpApprovalService,
    McpExecutionService,
    McpServerFactory,
    McpClientService,
    CommerceToolsRegistrar,
    InventoryToolsRegistrar,
    OrdersToolsRegistrar,
    CustomersToolsRegistrar,
    PaymentsToolsRegistrar,
    ChannelsToolsRegistrar,
    WebsiteToolsRegistrar,
    ThemesToolsRegistrar,
    AnalyticsToolsRegistrar,
    AgentsToolsRegistrar,
    KnowledgeToolsRegistrar,
    MarketingToolsRegistrar,
    McpResourcesRegistrar,
    McpPromptsRegistrar,
  ],
  exports: [McpClientService, McpRegistry, McpExecutionService, McpAuthService],
})
export class McpModule {}
