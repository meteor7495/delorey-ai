import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DataStore } from './data.store';
import { RedisLockService } from './redis-lock.service';
import { WebhookEventsService } from '../adapters/webhook-events.service';
import { SessionAuthGuard } from './auth.guard';
import { AiEmployeeEntitlementGuard } from './ai-employee-entitlement.guard';

@Global()
@Module({
  providers: [
    PrismaService,
    DataStore,
    RedisLockService,
    WebhookEventsService,
    SessionAuthGuard,
    AiEmployeeEntitlementGuard,
  ],
  exports: [
    PrismaService,
    DataStore,
    RedisLockService,
    WebhookEventsService,
    SessionAuthGuard,
    AiEmployeeEntitlementGuard,
  ],
})
export class PlatformModule {}
