import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service-to-service authentication guard.
 * Internal microservices validate the X-Service-Token header set by api-gateway
 * after JWT validation. This ensures that only authorised internal callers
 * (api-gateway, other services) can invoke these endpoints directly.
 */
@Injectable()
export class ServiceAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-service-token'];
    const expected = this.config.get<string>('SERVICE_TOKEN');
    if (!expected || !token || token !== expected) {
      throw new UnauthorizedException('Missing or invalid service token');
    }
    return true;
  }
}
