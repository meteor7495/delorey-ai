import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { BillingModule } from '../billing/billing.module';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';

@Module({
  imports: [IdentityModule, BillingModule],
  controllers: [AccessController],
  providers: [AccessService],
})
export class AccessModule {}
