import type { PaymentProviderId } from '../domain/payment';

export type PaymentRequestInput = {
  orderId: string;
  amount: number;
  description: string;
  merchantId: string;
  callbackUrl: string;
};

export type PaymentRequestResult = {
  authority: string;
  payUrl: string;
  raw?: unknown;
};

export type PaymentVerifyInput = {
  authority: string;
  amount: number;
  merchantId: string;
};

export type PaymentVerifyResult = {
  ok: boolean;
  alreadyVerified?: boolean;
  reference?: string;
  raw?: unknown;
};

export interface IPaymentProvider {
  readonly id: PaymentProviderId;
  request(input: PaymentRequestInput): Promise<PaymentRequestResult>;
  verify(input: PaymentVerifyInput): Promise<PaymentVerifyResult>;
}
