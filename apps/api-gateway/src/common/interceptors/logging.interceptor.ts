import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const correlationId =
      (request.headers['x-correlation-id'] as string) || uuidv4();
    request.headers['x-correlation-id'] = correlationId;
    response.setHeader('X-Correlation-Id', correlationId);

    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') ?? '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsed = Date.now() - startTime;
          this.logger.log(
            JSON.stringify({
              type: 'request',
              method,
              url,
              statusCode: response.statusCode,
              elapsed,
              ip,
              userAgent,
              correlationId,
            }),
          );
        },
        error: (err) => {
          const elapsed = Date.now() - startTime;
          this.logger.warn(
            JSON.stringify({
              type: 'request_error',
              method,
              url,
              error: err?.message,
              elapsed,
              ip,
              userAgent,
              correlationId,
            }),
          );
        },
      }),
    );
  }
}
