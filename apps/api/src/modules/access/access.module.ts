import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';

@Module({
  imports: [IdentityModule],
  controllers: [AccessController],
  providers: [AccessService],
})
export class AccessModule {}
