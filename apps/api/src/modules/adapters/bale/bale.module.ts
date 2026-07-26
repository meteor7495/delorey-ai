import { Module, forwardRef } from '@nestjs/common';
import { BaleAdapterController } from './bale.controller';
import { BaleAdapterService } from './bale.service';
import { RuntimeModule } from '../../runtime/runtime.module';

@Module({
  imports: [forwardRef(() => RuntimeModule)],
  controllers: [BaleAdapterController],
  providers: [BaleAdapterService],
  exports: [BaleAdapterService],
})
export class BaleAdapterModule {}
