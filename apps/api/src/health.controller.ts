import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { ok: true, service: 'delorey-api', slice: '01-grounded-chat' };
  }
}
