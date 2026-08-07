import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlatformModule } from './modules/platform/platform.module';
import { IdentityModule } from './modules/identity/identity.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { CommerceModule } from './modules/commerce/commerce.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { WebsiteAdapterModule } from './modules/adapters/website/website.module';
import { RuntimeModule } from './modules/runtime/runtime.module';
import { AiGatewayModule } from './modules/ai-gateway/ai-gateway.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { TelegramAdapterModule } from './modules/adapters/telegram/telegram.module';
import { BaleAdapterModule } from './modules/adapters/bale/bale.module';
import { InstagramSpikeModule } from './modules/adapters/instagram/instagram.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditModule } from './modules/audit/audit.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ShopModule } from './modules/shop/shop.module';
import { AccessModule } from './modules/access/access.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    PlatformModule,
    JobsModule,
    IdentityModule,
    AccessModule,
    WorkspaceModule,
    EmployeeModule,
    CommerceModule,
    ShopModule,
    KnowledgeModule,
    AnalyticsModule,
    AuditModule,
    ConversationModule,
    WebsiteAdapterModule,
    RuntimeModule,
    AiGatewayModule,
    InboxModule,
    TelegramAdapterModule,
    BaleAdapterModule,
    InstagramSpikeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
