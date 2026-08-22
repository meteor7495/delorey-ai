import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../platform/prisma.service';
import { BillingPaymentService } from './billing-payment.service';
import { toIrt } from './domain/money';

@Controller('billing/payments')
export class BillingPaymentsController {
  constructor(
    private readonly payments: BillingPaymentService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('mock/:paymentId')
  async mockPay(@Param('paymentId') paymentId: string, @Res() res: Response) {
    const payment = await this.prisma.billingPayment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      res.status(404).type('html').send(this.wrap('پرداخت پیدا نشد', ''));
      return;
    }
    const okUrl = `/v1/billing/payments/mock/${paymentId}/complete?result=ok`;
    const failUrl = `/v1/billing/payments/mock/${paymentId}/complete?result=fail`;
    res.type('html').send(
      this.wrap(
        'شارژ اعتبار سلومـا',
        `<p>مبلغ: <strong>${toIrt(payment.amount).toLocaleString('fa-IR')} تومان</strong></p>
         <p>این صفحه فقط برای محیط توسعه است.</p>
         <p style="display:flex;gap:12px;margin-top:1.5rem">
           <a href="${okUrl}" style="background:#00a049;color:#fff;padding:.6rem 1rem;border-radius:8px;text-decoration:none">پرداخت موفق</a>
           <a href="${failUrl}" style="background:#c0392b;color:#fff;padding:.6rem 1rem;border-radius:8px;text-decoration:none">انصراف</a>
         </p>`,
      ),
    );
  }

  @Get('mock/:paymentId/complete')
  async mockComplete(
    @Param('paymentId') paymentId: string,
    @Query('result') result: string,
    @Res() res: Response,
  ) {
    const ok = await this.payments.confirmMock(
      paymentId,
      result === 'fail' ? 'fail' : 'ok',
    );
    res.redirect(this.payments.workspaceReturnUrl(ok));
  }

  @Get('zarinpal/callback')
  async zarinpalCallback(
    @Query('Authority') authority: string,
    @Query('Status') status: string,
    @Res() res: Response,
  ) {
    if (!authority) {
      res.status(400).type('html').send(this.wrap('پارامتر درگاه ناقص است', ''));
      return;
    }
    const result = await this.payments.confirmZarinpal(authority, status);
    res.redirect(this.payments.workspaceReturnUrl(result.ok));
  }

  private wrap(title: string, body: string) {
    return `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <title>${title}</title>
      <body style="font-family:Tahoma,sans-serif;padding:2rem;max-width:32rem;margin:auto;line-height:1.8">
      <h1 style="font-size:1.25rem">${title}</h1>
      ${body}
      </body></html>`;
  }
}
