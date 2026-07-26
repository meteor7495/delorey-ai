import { Module, forwardRef } from '@nestjs/common';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { HandoffService } from './handoff.service';
import { TelegramAdapterModule } from '../adapters/telegram/telegram.module';
import { BaleAdapterModule } from '../adapters/bale/bale.module';

@Module({
  imports: [
    forwardRef(() => TelegramAdapterModule),
    forwardRef(() => BaleAdapterModule),
  ],
  controllers: [InboxController],
  providers: [InboxService, HandoffService],
  exports: [HandoffService, InboxService],
})
export class InboxModule {}
