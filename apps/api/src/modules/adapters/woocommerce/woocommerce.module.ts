import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { PlatformModule } from '../../platform/platform.module';
import { JobsModule } from '../../jobs/jobs.module';
import { WooCommerceAdapterController } from './woocommerce.controller';
import { WooCommerceAdapterService } from './woocommerce.service';

@Module({
  imports: [
    PlatformModule,
    AuditModule,
    forwardRef(() => JobsModule),
  ],
  controllers: [WooCommerceAdapterController],
  providers: [WooCommerceAdapterService],
  exports: [WooCommerceAdapterService],
})
export class WooCommerceAdapterModule {}
