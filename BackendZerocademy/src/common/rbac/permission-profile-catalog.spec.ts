import { Role } from '@prisma/client';
import {
  SYSTEM_PERMISSION_PROFILES,
  assertSystemPermissionProfileCatalogIntegrity,
} from './permission-profile-catalog';
import { ROLE_BASELINE_PERMISSIONS } from './role-permissions';

describe('system permission profile catalog', () => {
  it('has valid, unique role-bound profile definitions', () => {
    expect(assertSystemPermissionProfileCatalogIntegrity).not.toThrow();
    expect(
      new Set(SYSTEM_PERMISSION_PROFILES.map((profile) => profile.key)).size,
    ).toBe(SYSTEM_PERMISSION_PROFILES.length);
  });

  it('preserves ADMIN and TEACHER baseline parity', () => {
    expect(
      SYSTEM_PERMISSION_PROFILES.find((profile) => profile.role === Role.ADMIN)
        ?.permissions,
    ).toEqual(ROLE_BASELINE_PERMISSIONS[Role.ADMIN]);
    expect(
      SYSTEM_PERMISSION_PROFILES.find(
        (profile) => profile.role === Role.TEACHER,
      )?.permissions,
    ).toEqual(ROLE_BASELINE_PERMISSIONS[Role.TEACHER]);
  });
});
