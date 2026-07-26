import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { BaleAdapterController } from './bale.controller';
import { BaleAdapterService } from './bale.service';
import { RuntimeModule } from '../../runtime/runtime.module';

@Module({
  imports: [forwardRef(() => RuntimeModule), AuditModule],
  controllers: [BaleAdapterController],
  providers: [BaleAdapterService],
  exports: [BaleAdapterService],
})
export class BaleAdapterModule {}
