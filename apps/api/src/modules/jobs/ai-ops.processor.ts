import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AI_OPS_QUEUE, type AiOpsJobData } from './ai-ops.types';
import { CartRecoveryService } from '../ai-ops/cart-recovery.service';
import { OpportunityService } from '../ai-ops/opportunity.service';

@Processor(AI_OPS_QUEUE)
export class AiOpsProcessor extends WorkerHost {
  private readonly logger = new Logger(AiOpsProcessor.name);

  constructor(
    private readonly recovery: CartRecoveryService,
    private readonly opportunities: OpportunityService,
  ) {
    super();
  }

  async process(job: Job<AiOpsJobData>) {
    const { tenantId } = job.data;
    this.logger.log(`ai.ops ${job.name} tenant=${tenantId}`);
    if (job.name === 'scan_tenant') {
      await this.recovery.markAbandonedCarts(tenantId);
      return this.opportunities.scan(tenantId);
    }
    if (job.name === 'recover_carts') {
      return this.recovery.runTenantRecoveryScan(tenantId);
    }
    return { skipped: true };
  }
}
