import { SetMetadata } from '@nestjs/common';

export const STRICT_ROLES_KEY = 'strictRoles';

/**
 * When set on a route, SUPER_ADMIN does not bypass role checks.
 * Use for institution-operational endpoints (courses, assignments, transitions).
 */
export const StrictRoles = () => SetMetadata(STRICT_ROLES_KEY, true);
