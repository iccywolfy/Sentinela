import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

export type AppRole = 'admin' | 'director' | 'senior_analyst' | 'analyst' | 'viewer' | 'api_consumer';

const ROLE_HIERARCHY: Record<AppRole, number> = {
  admin: 100,
  director: 80,
  senior_analyst: 60,
  analyst: 40,
  viewer: 20,
  api_consumer: 10,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Access denied');

    const userLevel = ROLE_HIERARCHY[user.role as AppRole] ?? 0;
    const minRequired = Math.min(...requiredRoles.map((r) => ROLE_HIERARCHY[r] ?? 0));

    if (userLevel < minRequired) {
      throw new ForbiddenException(`Insufficient permissions. Required: ${requiredRoles.join(' or ')}`);
    }
    return true;
  }
}
