import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ApiErrorResponseDto } from '../../dto/swagger';
import { Roles } from '../roles.decorator';
import { StrictRoles } from '../strict-roles.decorator';

/**
 * Applies RBAC metadata and OpenAPI auth documentation on a **route handler**.
 * Do not use at class level — use `@Roles()` + `@ApiBearerAuth()` on the controller instead.
 * SUPER_ADMIN bypasses role checks unless `strict` is true.
 */
export function ApiRequireRoles(...roles: Role[]) {
  return applyDecorators(
    Roles(...roles),
    ApiBearerAuth('access-token'),
    ApiUnauthorizedResponse({ type: ApiErrorResponseDto }),
    ApiForbiddenResponse({ type: ApiErrorResponseDto }),
  );
}

/** Institution-operational routes — SUPER_ADMIN is not granted implicit access. */
export function ApiRequireRolesStrict(...roles: Role[]) {
  return applyDecorators(
    StrictRoles(),
    Roles(...roles),
    ApiBearerAuth('access-token'),
    ApiUnauthorizedResponse({ type: ApiErrorResponseDto }),
    ApiForbiddenResponse({ type: ApiErrorResponseDto }),
  );
}
