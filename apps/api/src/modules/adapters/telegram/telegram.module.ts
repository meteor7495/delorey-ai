import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { TelegramAdapterController } from './telegram.controller';
import { TelegramAdapterService } from './telegram.service';
import { RuntimeModule } from '../../runtime/runtime.module';

@Module({
  imports: [forwardRef(() => RuntimeModule), AuditModule],
  controllers: [TelegramAdapterController],
  providers: [TelegramAdapterService],
  exports: [TelegramAdapterService],
})
export class TelegramAdapterModule {}
