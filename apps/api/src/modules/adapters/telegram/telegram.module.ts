import { Module, forwardRef } from '@nestjs/common';
import { TelegramAdapterController } from './telegram.controller';
import { TelegramAdapterService } from './telegram.service';
import { RuntimeModule } from '../../runtime/runtime.module';

@Module({
  imports: [forwardRef(() => RuntimeModule)],
  controllers: [TelegramAdapterController],
  providers: [TelegramAdapterService],
  exports: [TelegramAdapterService],
})
export class TelegramAdapterModule {}
