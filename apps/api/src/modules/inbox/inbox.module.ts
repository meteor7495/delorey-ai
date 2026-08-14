import { Module, forwardRef } from '@nestjs/common';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { HandoffService } from './handoff.service';
import { TelegramAdapterModule } from '../adapters/telegram/telegram.module';
import { BaleAdapterModule } from '../adapters/bale/bale.module';
import { InstagramSpikeModule } from '../adapters/instagram/instagram.module';

@Module({
  imports: [
    forwardRef(() => TelegramAdapterModule),
    forwardRef(() => BaleAdapterModule),
    forwardRef(() => InstagramSpikeModule),
  ],
  controllers: [InboxController],
  providers: [InboxService, HandoffService],
  exports: [HandoffService, InboxService],
})
export class InboxModule {}
