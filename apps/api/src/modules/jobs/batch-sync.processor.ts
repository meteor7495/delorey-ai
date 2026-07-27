import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ShopifyAdapterService } from '../adapters/shopify/shopify.service';
import {
  BATCH_SYNC_QUEUE,
  type BatchSyncJobData,
} from './batch-sync.types';

@Processor(BATCH_SYNC_QUEUE, {
  concurrency: 2,
})
export class BatchSyncProcessor extends WorkerHost {
  private readonly log = new Logger(BatchSyncProcessor.name);

  constructor(private readonly shopify: ShopifyAdapterService) {
    super();
  }

  async process(job: Job<BatchSyncJobData>): Promise<unknown> {
    const { tenant_id, type, payload } = job.data;
    if (!tenant_id) {
      this.log.error(`Job ${job.id} missing tenant_id — discard`);
      throw new Error('tenant_id required');
    }

    this.log.log(`batch.sync ${type} tenant=${tenant_id} job=${job.id}`);

    switch (type) {
      case 'commerce.sync':
        return this.shopify.runFullSync(tenant_id);
      case 'commerce.webhooks.register':
        return this.shopify.ensureWebhooks(tenant_id);
      case 'commerce.webhook':
        return this.shopify.processWebhookJob({
          connectionId: String(payload.connectionId ?? ''),
          topic: payload.topic as string | undefined,
          shopDomain: payload.shopDomain as string | undefined,
          webhookId: payload.webhookId as string | undefined,
          bodyJson: String(payload.bodyJson ?? '{}'),
        });
      default:
        this.log.warn(`Unknown job type: ${type}`);
        return { ok: false, ignored: true };
    }
  }
}
