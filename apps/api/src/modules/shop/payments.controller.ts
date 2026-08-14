import {
  Controller,
  Get,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../platform/prisma.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('mock/:orderId')
  async mockPay(@Param('orderId') orderId: string, @Res() res: Response) {
    const result = await this.payments.confirmMock(orderId);
    const order = await this.prisma.storefrontOrder.findUnique({
      where: { id: orderId },
    });
    const html = `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"/><body style="font-family:sans-serif;padding:2rem">
      <h1>${result.ok ? 'پرداخت با موفقیت ثبت شد' : 'پرداخت انجام نشد'}</h1>
      <p>شماره سفارش: ${order?.orderNumber ?? orderId}</p>
      <p>این صفحه برای محیط توسعه است (درگاه mock).</p>
    </body></html>`;
    res.type('html').send(html);
  }

  @Get('zarinpal/callback')
  async zarinpalCallback(
    @Query('Authority') authority: string,
    @Query('Status') status: string,
    @Res() res: Response,
  ) {
    const result = await this.payments.confirmZarinpal(authority, status);
    const html = `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"/><body style="font-family:sans-serif;padding:2rem">
      <h1>${result.ok ? 'پرداخت تأیید شد' : 'پرداخت لغو شد'}</h1>
      <p>می‌توانید این پنجره را ببندید و به گفتگو یا فروشگاه برگردید.</p>
    </body></html>`;
    res.type('html').send(html);
  }
}
