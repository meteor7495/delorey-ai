import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mockPayUrl } from '../domain/payment';
import type {
  IPaymentProvider,
  PaymentRequestInput,
  PaymentRequestResult,
  PaymentVerifyInput,
  PaymentVerifyResult,
} from './payment-provider';

@Injectable()
export class MockPaymentProvider implements IPaymentProvider {
  readonly id = 'mock' as const;

  constructor(private readonly config: ConfigService) {}

  async request(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    const authority = `MOCK-${input.orderId}-${randomBytes(6).toString('hex')}`;
    return {
      authority,
      payUrl: mockPayUrl(this.publicBase(), input.orderId),
    };
  }

  async verify(input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
    return {
      ok: true,
      reference: input.authority,
    };
  }

  private publicBase() {
    return (
      this.config.get<string>('PUBLIC_API_BASE_URL') ??
      `http://localhost:${this.config.get('API_PORT') ?? 3001}`
    );
  }
}
