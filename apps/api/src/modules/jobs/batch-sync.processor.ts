import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  BATCH_SYNC_QUEUE,
  type BatchSyncJobData,
} from './batch-sync.types';

/** External store sync disabled (Iran: native storefront only). */
@Processor(BATCH_SYNC_QUEUE, {
  concurrency: 1,
})
export class BatchSyncProcessor extends WorkerHost {
  private readonly log = new Logger(BatchSyncProcessor.name);

  async process(job: Job<BatchSyncJobData>): Promise<unknown> {
    this.log.warn(
      `batch.sync ignored (external connectors disabled) type=${job.data.type} job=${job.id}`,
    );
    return {
      ok: false,
      disabled: true,
      reason: 'Shopify/WooCommerce connectors are disabled',
    };
  }
}
