import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AppLoggerService } from '../logger/app-logger.service';
import { RoleUtils } from '../rbac/role.utils';
import type { AuthenticatedUser } from '../../modules/auth/types/authenticated-user.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: AppLoggerService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    if (RoleUtils.hasRole(user.role, requiredRoles)) {
      return true;
    }

    this.logger.warn({
      context: 'RolesGuard',
      event: 'ROLE_DENIED',
      userId: user.id,
      email: user.email,
      message: `Role ${user.role} denied for endpoint requiring ${requiredRoles.join(', ')}`,
    });

    throw new ForbiddenException('Insufficient role permissions');
  }
}
