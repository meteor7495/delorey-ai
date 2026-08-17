import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { TelegramAdapterController } from './telegram.controller';
import { TelegramAdapterService } from './telegram.service';
import { RuntimeModule } from '../../runtime/runtime.module';
import { ShopModule } from '../../shop/shop.module';

@Module({
  imports: [forwardRef(() => RuntimeModule), AuditModule, ShopModule],
  controllers: [TelegramAdapterController],
  providers: [TelegramAdapterService],
  exports: [TelegramAdapterService],
})
export class TelegramAdapterModule {}
