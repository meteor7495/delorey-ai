import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PlatformModule } from '../platform/platform.module';
import { AiOpsModule } from '../ai-ops/ai-ops.module';
import { BatchSyncProcessor } from './batch-sync.processor';
import { BatchSyncQueue } from './batch-sync.queue';
import { BATCH_SYNC_QUEUE } from './batch-sync.types';
import { AI_OPS_QUEUE } from './ai-ops.types';
import { AiOpsQueue } from './ai-ops.queue';
import { AiOpsProcessor } from './ai-ops.processor';

function redisConnection() {
  const url = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
  return { url, maxRetriesPerRequest: null as null };
}

@Module({
  imports: [
    PlatformModule,
    AiOpsModule,
    BullModule.forRoot({
      connection: redisConnection(),
    }),
    BullModule.registerQueue(
      {
        name: BATCH_SYNC_QUEUE,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      },
      {
        name: AI_OPS_QUEUE,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      },
    ),
  ],
  providers: [BatchSyncQueue, BatchSyncProcessor, AiOpsQueue, AiOpsProcessor],
  exports: [BatchSyncQueue, AiOpsQueue, BullModule],
})
export class JobsModule {}
