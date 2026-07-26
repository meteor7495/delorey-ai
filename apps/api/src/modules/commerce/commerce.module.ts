import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CommerceController } from './commerce.controller';
import { CommerceService } from './commerce.service';

@Module({
  imports: [AuditModule],
  controllers: [CommerceController],
  providers: [CommerceService],
  exports: [CommerceService],
})
export class CommerceModule {}
