import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataStore } from '../platform/data.store';
import { ShopifyAdapterService } from '../adapters/shopify/shopify.service';
import { WooCommerceAdapterService } from '../adapters/woocommerce/woocommerce.service';
import {
  BATCH_SYNC_QUEUE,
  type BatchSyncJobData,
} from './batch-sync.types';

@Processor(BATCH_SYNC_QUEUE, {
  concurrency: 2,
})
export class BatchSyncProcessor extends WorkerHost {
  private readonly log = new Logger(BatchSyncProcessor.name);

  constructor(
    private readonly store: DataStore,
    private readonly shopify: ShopifyAdapterService,
    private readonly woo: WooCommerceAdapterService,
  ) {
    super();
  }

  async process(job: Job<BatchSyncJobData>): Promise<unknown> {
    const { tenant_id, type, payload } = job.data;
    if (!tenant_id) {
      this.log.error(`Job ${job.id} missing tenant_id — discard`);
      throw new Error('tenant_id required');
    }

    this.log.log(`batch.sync ${type} tenant=${tenant_id} job=${job.id}`);
    const connection = await this.store.getStore(tenant_id);
    const platform =
      (payload.platform as string | undefined) || connection?.platform;

    switch (type) {
      case 'commerce.sync':
        if (platform === 'woocommerce') {
          return this.woo.runFullSync(tenant_id);
        }
        return this.shopify.runFullSync(tenant_id);
      case 'commerce.webhooks.register':
        if (platform === 'woocommerce') {
          return this.woo.ensureWebhooks(tenant_id);
        }
        return this.shopify.ensureWebhooks(tenant_id);
      case 'commerce.webhook': {
        const connectionId = String(payload.connectionId ?? '');
        const conn =
          (await this.store.getStoreById(connectionId)) ?? connection;
        if (conn?.platform === 'woocommerce') {
          return this.woo.processWebhookJob({
            connectionId,
            topic: payload.topic as string | undefined,
            bodyJson: String(payload.bodyJson ?? '{}'),
          });
        }
        return this.shopify.processWebhookJob({
          connectionId,
          topic: payload.topic as string | undefined,
          shopDomain: payload.shopDomain as string | undefined,
          webhookId: payload.webhookId as string | undefined,
          bodyJson: String(payload.bodyJson ?? '{}'),
        });
      }
      default:
        this.log.warn(`Unknown job type: ${type}`);
        return { ok: false, ignored: true };
    }
  }
}
