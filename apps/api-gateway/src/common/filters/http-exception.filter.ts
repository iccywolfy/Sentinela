import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * RFC 7807 Problem Details — standardized error format for all HTTP errors.
 * Spec: https://datatracker.ietf.org/doc/html/rfc7807
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const correlationId =
      (request.headers['x-correlation-id'] as string) || uuidv4();

    let detail: string;
    let errors: unknown;

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        detail = body;
      } else if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        if (Array.isArray(b['message'])) {
          detail = 'Validation failed';
          errors = b['message'];
        } else {
          detail = (b['message'] as string) || exception.message;
        }
      } else {
        detail = exception.message;
      }
    } else {
      detail = 'An unexpected error occurred. Please contact support.';
      this.logger.error('Unhandled exception', {
        error: exception instanceof Error ? exception.stack : String(exception),
        correlationId,
        path: request.url,
      });
    }

    const problemDetail: Record<string, unknown> = {
      type: `https://sentinela.io/errors/${status}`,
      title: HttpStatus[status]?.replace(/_/g, ' ') ?? 'Error',
      status,
      detail,
      instance: request.url,
      correlationId,
    };

    if (errors) {
      problemDetail['errors'] = errors;
    }

    response
      .status(status)
      .set('Content-Type', 'application/problem+json')
      .set('X-Correlation-Id', correlationId)
      .json(problemDetail);
  }
}
