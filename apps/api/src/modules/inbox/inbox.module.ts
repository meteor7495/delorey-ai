import { Module } from '@nestjs/common';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { HandoffService } from './handoff.service';

@Module({
  controllers: [InboxController],
  providers: [InboxService, HandoffService],
  exports: [HandoffService, InboxService],
})
export class InboxModule {}
