import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AI_OPS_QUEUE, type AiOpsJobData } from './ai-ops.types';

@Injectable()
export class AiOpsQueue {
  constructor(@InjectQueue(AI_OPS_QUEUE) private readonly queue: Queue) {}

  enqueueScan(tenantId: string) {
    return this.queue.add(
      'scan_tenant',
      { tenantId } satisfies AiOpsJobData,
      {
        jobId: `scan:${tenantId}:${Date.now()}`,
        removeOnComplete: 50,
      },
    );
  }

  enqueueRecoverCarts(tenantId: string) {
    return this.queue.add(
      'recover_carts',
      { tenantId } satisfies AiOpsJobData,
      {
        jobId: `recover:${tenantId}:${Date.now()}`,
        removeOnComplete: 50,
      },
    );
  }
}
