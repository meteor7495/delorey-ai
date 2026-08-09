import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { CommerceRuleError } from './domain';

/**
 * Domain rule violations are framework-free by design — translate them into the
 * same 400 shape the rest of the API uses instead of leaking a 500.
 */
@Catch(CommerceRuleError)
export class CommerceRuleFilter implements ExceptionFilter {
  catch(error: CommerceRuleError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const body = new BadRequestException({
      statusCode: 400,
      message: error.message,
      error: error.code,
    }).getResponse();
    response.status(400).json(body);
  }
}
