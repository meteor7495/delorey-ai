import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  BATCH_SYNC_QUEUE,
  type BatchSyncJobData,
  type BatchSyncJobType,
} from './batch-sync.types';

@Injectable()
export class BatchSyncQueue {
  private readonly log = new Logger(BatchSyncQueue.name);

  constructor(
    @InjectQueue(BATCH_SYNC_QUEUE) private readonly queue: Queue<BatchSyncJobData>,
  ) {}

  /**
   * Enqueue a tenant-scoped sync job. Falls back to null when Redis/queue fails
   * so callers can run inline (local DX).
   */
  async enqueue(input: {
    tenantId: string;
    type: BatchSyncJobType;
    payload?: Record<string, unknown>;
    idempotencyKey?: string;
    delayMs?: number;
  }): Promise<{ jobId: string; queued: true } | null> {
    if (process.env.SYNC_INLINE === '1') {
      this.log.warn('SYNC_INLINE=1 — skip enqueue');
      return null;
    }
    const data: BatchSyncJobData = {
      tenant_id: input.tenantId,
      type: input.type,
      payload: input.payload ?? {},
      idempotency_key: input.idempotencyKey,
    };
    try {
      const job = await this.queue.add(input.type, data, {
        jobId: input.idempotencyKey,
        delay: input.delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      });
      return { jobId: String(job.id), queued: true };
    } catch (e) {
      this.log.warn(
        `batch.sync enqueue failed: ${e instanceof Error ? e.message : e}`,
      );
      return null;
    }
  }
}
