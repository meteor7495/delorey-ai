import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DataStore } from './data.store';
import { WebhookEventsService } from '../adapters/webhook-events.service';

@Global()
@Module({
  providers: [PrismaService, DataStore, WebhookEventsService],
  exports: [PrismaService, DataStore, WebhookEventsService],
})
export class PlatformModule {}
