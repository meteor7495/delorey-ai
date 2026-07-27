export const BATCH_SYNC_QUEUE = 'batch.sync';

export type BatchSyncJobType =
  | 'commerce.sync'
  | 'commerce.webhook'
  | 'commerce.webhooks.register';

export type BatchSyncJobData = {
  tenant_id: string;
  type: BatchSyncJobType;
  payload: Record<string, unknown>;
  idempotency_key?: string;
};
