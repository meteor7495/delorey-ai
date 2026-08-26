export const AI_OPS_QUEUE = 'ai.ops';

export type AiOpsJobName = 'scan_tenant' | 'recover_carts';

export type AiOpsJobData = {
  tenantId: string;
  cartId?: string;
};
