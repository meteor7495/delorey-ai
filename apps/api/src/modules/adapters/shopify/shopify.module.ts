import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuditModule } from '../../audit/audit.module';
import { PlatformModule } from '../../platform/platform.module';
import { JobsModule } from '../../jobs/jobs.module';
import { BATCH_SYNC_QUEUE } from '../../jobs/batch-sync.types';
import { BatchSyncProcessor } from '../../jobs/batch-sync.processor';
import { ShopifyAdapterController } from './shopify.controller';
import { ShopifyAdapterService } from './shopify.service';

@Module({
  imports: [
    PlatformModule,
    AuditModule,
    JobsModule,
    BullModule.registerQueue({ name: BATCH_SYNC_QUEUE }),
  ],
  controllers: [ShopifyAdapterController],
  providers: [ShopifyAdapterService, BatchSyncProcessor],
  exports: [ShopifyAdapterService],
})
export class ShopifyAdapterModule {}
