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
    const order = await this.prisma.storefrontOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      res.status(404).type('html').send(this.wrapHtml('سفارش پیدا نشد', ''));
      return;
    }
    const okUrl = `/v1/payments/mock/${orderId}/complete?result=ok`;
    const failUrl = `/v1/payments/mock/${orderId}/complete?result=fail`;
    const html = this.wrapHtml(
      'پرداخت آزمایشی',
      `<p>شماره سفارش: <strong>${order.orderNumber}</strong></p>
       <p>مبلغ: ${Number(order.totalAmount).toLocaleString('fa-IR')} تومان</p>
       <p>این صفحه فقط برای محیط توسعه است (بدون Merchant ID زرین‌پال).</p>
       <p style="display:flex;gap:12px;margin-top:1.5rem">
         <a href="${okUrl}" style="background:#00a049;color:#fff;padding:.6rem 1rem;border-radius:8px;text-decoration:none">پرداخت موفق</a>
         <a href="${failUrl}" style="background:#c0392b;color:#fff;padding:.6rem 1rem;border-radius:8px;text-decoration:none">انصراف / ناموفق</a>
       </p>`,
    );
    res.type('html').send(html);
  }

  @Get('mock/:orderId/complete')
  async mockComplete(
    @Param('orderId') orderId: string,
    @Query('result') result: string,
    @Res() res: Response,
  ) {
    const outcome = result === 'fail' ? 'fail' : 'ok';
    await this.payments.confirmMock(orderId, outcome);
    const order = await this.prisma.storefrontOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      res.status(404).type('html').send(this.wrapHtml('سفارش پیدا نشد', ''));
      return;
    }
    const url = await this.payments.trackUrl(order, outcome);
    res.redirect(url);
  }

  @Get('zarinpal/callback')
  async zarinpalCallback(
    @Query('Authority') authority: string,
    @Query('Status') status: string,
    @Res() res: Response,
  ) {
    if (!authority) {
      res.status(400).type('html').send(this.wrapHtml('پارامتر درگاه ناقص است', ''));
      return;
    }
    const result = await this.payments.confirmZarinpal(authority, status);
    const order = await this.prisma.storefrontOrder.findUnique({
      where: { id: result.orderId },
    });
    if (!order) {
      res.type('html').send(this.wrapHtml(result.ok ? 'پرداخت تأیید شد' : 'پرداخت لغو شد', ''));
      return;
    }
    const url = await this.payments.trackUrl(order, result.ok ? 'ok' : 'fail');
    res.redirect(url);
  }

  private wrapHtml(title: string, body: string) {
    return `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <title>${title}</title>
      <body style="font-family:Tahoma,sans-serif;padding:2rem;max-width:32rem;margin:auto;line-height:1.8">
      <h1 style="font-size:1.25rem">${title}</h1>
      ${body}
      </body></html>`;
  }
}
