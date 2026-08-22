import { HttpException, HttpStatus } from '@nestjs/common';
import {
  BILLING_UNAVAILABLE_MESSAGE,
  INSUFFICIENT_CREDIT_MESSAGE,
  SPENDING_LIMIT_MESSAGE,
} from './domain/billing.types';

export class InsufficientCreditError extends HttpException {
  readonly code = 'insufficient_credit' as const;

  constructor(message = INSUFFICIENT_CREDIT_MESSAGE) {
    super(
      { statusCode: 402, error: 'insufficient_credit', message },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}

export class SpendingLimitExceededError extends HttpException {
  readonly code = 'spending_limit' as const;

  constructor(message = SPENDING_LIMIT_MESSAGE) {
    super(
      { statusCode: 402, error: 'spending_limit', message },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}

export class BillingUnavailableError extends HttpException {
  readonly code = 'billing_unavailable' as const;

  constructor(message = BILLING_UNAVAILABLE_MESSAGE) {
    super(
      { statusCode: 503, error: 'billing_unavailable', message },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export function isBillingUserError(
  err: unknown,
): err is InsufficientCreditError | SpendingLimitExceededError {
  return (
    err instanceof InsufficientCreditError ||
    err instanceof SpendingLimitExceededError
  );
}
