/* eslint-disable @typescript-eslint/only-throw-error -- profile definition failures are deliberate configuration errors. */
import { Role } from '@prisma/client';
import { ALL_PERMISSIONS, type Permission } from './permission-catalog';
import {
  ROLE_ALLOWED_PERMISSIONS,
  ROLE_BASELINE_PERMISSIONS,
} from './role-permissions';

export type SystemPermissionProfileDefinition = Readonly<{
  key: string;
  name: string;
  role: Role;
  permissions: readonly Permission[];
}>;

/** The minimal configurable system profiles that preserve current role parity. */
export const SYSTEM_PERMISSION_PROFILES = Object.freeze([
  {
    key: 'ADMIN_BASELINE',
    name: 'Administrator baseline',
    role: Role.ADMIN,
    permissions: ROLE_BASELINE_PERMISSIONS[Role.ADMIN],
  },
  {
    key: 'TEACHER_BASELINE',
    name: 'Teacher baseline',
    role: Role.TEACHER,
    permissions: ROLE_BASELINE_PERMISSIONS[Role.TEACHER],
  },
] as const satisfies readonly SystemPermissionProfileDefinition[]);

export function assertSystemPermissionProfileCatalogIntegrity(): void {
  const catalog = new Set<Permission>(ALL_PERMISSIONS);
  const keys = new Set<string>();

  for (const profile of SYSTEM_PERMISSION_PROFILES) {
    if (keys.has(profile.key))
      throw new Error(`Duplicate system profile key: ${profile.key}`);
    keys.add(profile.key);

    const allowed = ROLE_ALLOWED_PERMISSIONS[profile.role];
    for (const permission of profile.permissions) {
      if (!catalog.has(permission))
        throw new Error(
          `Profile ${profile.key} contains an unknown permission: ${permission}`,
        );
      if (!allowed.includes(permission))
        throw new Error(
          `Profile ${profile.key} exceeds the ${profile.role} role boundary: ${permission}`,
        );
    }
  }
}
