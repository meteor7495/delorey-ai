export type McpErrorCode =
  | 'validation_error'
  | 'unauthorized'
  | 'forbidden'
  | 'tenant_access_denied'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'approval_required'
  | 'business_rule_violation'
  | 'not_available'
  | 'external_service_error'
  | 'timeout'
  | 'internal_error';

export class McpPlatformError extends Error {
  readonly code: McpErrorCode;
  readonly details?: Record<string, unknown>;
  readonly httpHint: number;

  constructor(code: McpErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'McpPlatformError';
    this.code = code;
    this.details = details;
    this.httpHint = hintFor(code);
  }
}

function hintFor(code: McpErrorCode): number {
  switch (code) {
    case 'validation_error':
      return 400;
    case 'unauthorized':
      return 401;
    case 'forbidden':
    case 'tenant_access_denied':
      return 403;
    case 'not_found':
    case 'not_available':
      return 404;
    case 'conflict':
      return 409;
    case 'rate_limited':
      return 429;
    case 'approval_required':
      return 202;
    case 'business_rule_violation':
      return 422;
    case 'timeout':
      return 504;
    case 'external_service_error':
    case 'internal_error':
    default:
      return 500;
  }
}

/** Map Nest/domain errors to MCP codes without leaking internals */
export function mapUnknownError(err: unknown): McpPlatformError {
  if (err instanceof McpPlatformError) return err;
  if (err && typeof err === 'object') {
    const any = err as { status?: number; statusCode?: number; message?: string; name?: string };
    const status = any.status ?? any.statusCode;
    const message = typeof any.message === 'string' ? any.message : 'Request failed';
    if (status === 400) return new McpPlatformError('validation_error', message);
    if (status === 401) return new McpPlatformError('unauthorized', message);
    if (status === 403) return new McpPlatformError('forbidden', message);
    if (status === 404) return new McpPlatformError('not_found', message);
    if (status === 409) return new McpPlatformError('conflict', message);
    if (status === 429) return new McpPlatformError('rate_limited', message);
    if (any.name === 'CommerceRuleError') {
      return new McpPlatformError('business_rule_violation', message);
    }
  }
  return new McpPlatformError('internal_error', 'Internal error');
}

export function publicErrorPayload(err: McpPlatformError): {
  code: McpErrorCode;
  message: string;
  details?: Record<string, unknown>;
} {
  return {
    code: err.code,
    message: err.message,
    ...(err.details ? { details: err.details } : {}),
  };
}
