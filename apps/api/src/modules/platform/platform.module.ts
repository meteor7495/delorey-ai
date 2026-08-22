import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DataStore } from './data.store';
import { RedisLockService } from './redis-lock.service';
import { WebhookEventsService } from '../adapters/webhook-events.service';

@Global()
@Module({
  providers: [PrismaService, DataStore, RedisLockService, WebhookEventsService],
  exports: [PrismaService, DataStore, RedisLockService, WebhookEventsService],
})
export class PlatformModule {}
