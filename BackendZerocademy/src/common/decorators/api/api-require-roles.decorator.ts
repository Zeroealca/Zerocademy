import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ApiErrorResponseDto } from '../../dto/swagger';
import { Roles } from '../roles.decorator';

/**
 * Applies RBAC metadata and OpenAPI auth documentation on a **route handler**.
 * Do not use at class level — use `@Roles()` + `@ApiBearerAuth()` on the controller instead.
 * SUPER_ADMIN is always permitted via RolesGuard + RoleUtils.
 */
export function ApiRequireRoles(...roles: Role[]) {
  return applyDecorators(
    Roles(...roles),
    ApiBearerAuth('access-token'),
    ApiUnauthorizedResponse({ type: ApiErrorResponseDto }),
    ApiForbiddenResponse({ type: ApiErrorResponseDto }),
  );
}
