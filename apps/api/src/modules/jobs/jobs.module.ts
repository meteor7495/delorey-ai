import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PlatformModule } from '../platform/platform.module';
import { BatchSyncProcessor } from './batch-sync.processor';
import { BatchSyncQueue } from './batch-sync.queue';
import { BATCH_SYNC_QUEUE } from './batch-sync.types';

function redisConnection() {
  const url = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
  return { url, maxRetriesPerRequest: null as null };
}

@Module({
  imports: [
    PlatformModule,
    BullModule.forRoot({
      connection: redisConnection(),
    }),
    BullModule.registerQueue({
      name: BATCH_SYNC_QUEUE,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    }),
  ],
  providers: [BatchSyncQueue, BatchSyncProcessor],
  exports: [BatchSyncQueue, BullModule],
})
export class JobsModule {}
