import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  parseZarinpalRequestBody,
  parseZarinpalVerifyBody,
  zarinpalEndpoints,
  zarinpalPayUrl,
} from '../domain/payment';
import type {
  IPaymentProvider,
  PaymentRequestInput,
  PaymentRequestResult,
  PaymentVerifyInput,
  PaymentVerifyResult,
} from './payment-provider';

@Injectable()
export class ZarinpalPaymentProvider implements IPaymentProvider {
  readonly id = 'zarinpal' as const;

  constructor(private readonly config: ConfigService) {}

  async request(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    const urls = this.urls();
    const res = await fetch(urls.request, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        merchant_id: input.merchantId,
        amount: Math.round(input.amount),
        callback_url: input.callbackUrl,
        description: input.description.slice(0, 250),
        metadata: { order_id: input.orderId },
      }),
    });
    const json: unknown = await res.json();
    const parsed = parseZarinpalRequestBody(json);
    if (!parsed.ok) {
      throw new BadRequestException('درگاه پرداخت در دسترس نیست؛ بعداً تلاش کنید');
    }
    return {
      authority: parsed.authority,
      payUrl: zarinpalPayUrl(urls.start, parsed.authority),
      raw: json,
    };
  }

  async verify(input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
    const urls = this.urls();
    const res = await fetch(urls.verify, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        merchant_id: input.merchantId,
        amount: Math.round(input.amount),
        authority: input.authority,
      }),
    });
    const json: unknown = await res.json();
    const parsed = parseZarinpalVerifyBody(json);
    if (!parsed.ok) {
      return { ok: false, raw: json };
    }
    return {
      ok: true,
      alreadyVerified: parsed.alreadyVerified,
      reference: parsed.refId || input.authority,
      raw: json,
    };
  }

  private urls() {
    const flag = this.config.get<string>('ZARINPAL_SANDBOX')?.trim();
    return zarinpalEndpoints(flag === '1' || flag === 'true');
  }
}
