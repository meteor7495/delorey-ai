import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { CheckoutSessionService } from './checkout-session.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly sessions: CheckoutSessionService) {}

  @Get('sessions')
  hydrate(@Query('token') token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('token الزامی است');
    }
    return this.sessions.hydrate(token);
  }
}
