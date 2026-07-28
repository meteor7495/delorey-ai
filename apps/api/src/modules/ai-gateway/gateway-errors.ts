export type GatewayErrorCode =
  | 'timeout'
  | 'rate_limit'
  | 'content_filter'
  | 'unavailable'
  | 'invalid_response'
  | 'auth';

export class GatewayError extends Error {
  readonly code: GatewayErrorCode;
  readonly providerId: string;
  readonly retryable: boolean;

  constructor(
    code: GatewayErrorCode,
    message: string,
    opts: { providerId: string; retryable?: boolean; cause?: unknown } = {
      providerId: 'unknown',
    },
  ) {
    super(message, opts.cause !== undefined ? { cause: opts.cause } : undefined);
    this.name = 'GatewayError';
    this.code = code;
    this.providerId = opts.providerId;
    this.retryable =
      opts.retryable ??
      (code === 'timeout' || code === 'rate_limit' || code === 'unavailable');
  }
}
