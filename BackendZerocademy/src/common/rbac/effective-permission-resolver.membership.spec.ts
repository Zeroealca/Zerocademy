import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InstitutionMembershipRole, Role } from '@prisma/client';
import { EffectivePermissionResolver } from './effective-permission-resolver.service';
import { PERMISSIONS } from './permission-catalog';
import { ROLE_BASELINE_PERMISSIONS } from './role-permissions';

type MembershipState = {
  id: string;
  institutionId: string;
  role: InstitutionMembershipRole;
  isActive: boolean;
  user: { role: Role };
  permissionProfile: {
    id: string;
    key: string;
    role: Role;
    isSystem: boolean;
    permissions: { permission: { key: string } }[];
  } | null;
};

function createResolver(memberships: MembershipState[]) {
  const prisma = {
    institutionMembership: {
      findUnique: ({ where }: { where: { id: string } }) =>
        Promise.resolve(
          memberships.find((membership) => membership.id === where.id) ?? null,
        ),
    },
  };
  return new EffectivePermissionResolver(prisma as never);
}

function profilePermissions(
  keys: readonly string[],
): { permission: { key: string } }[] {
  return keys.map((key) => ({ permission: { key } }));
}

describe('EffectivePermissionResolver membership-aware resolution', () => {
  const adminBaseline = ROLE_BASELINE_PERMISSIONS[Role.ADMIN];
  const teacherBaseline = ROLE_BASELINE_PERMISSIONS[Role.TEACHER];

  it('falls back to ADMIN baseline when membership profile is null', async () => {
    const resolver = createResolver([
      {
        id: 'm-admin-null',
        institutionId: 'inst-1',
        role: InstitutionMembershipRole.ADMIN,
        isActive: true,
        user: { role: Role.ADMIN },
        permissionProfile: null,
      },
    ]);

    const effective = await resolver.resolveForMembership('m-admin-null');
    expect(effective).toEqual(resolver.resolve(Role.ADMIN));
    expect(effective).toEqual(adminBaseline);
  });

  it('falls back to TEACHER baseline when membership profile is null', async () => {
    const resolver = createResolver([
      {
        id: 'm-teacher-null',
        institutionId: 'inst-1',
        role: InstitutionMembershipRole.TEACHER,
        isActive: true,
        user: { role: Role.TEACHER },
        permissionProfile: null,
      },
    ]);

    const effective = await resolver.resolveForMembership('m-teacher-null');
    expect(effective).toEqual(resolver.resolve(Role.TEACHER));
    expect(effective).toEqual(teacherBaseline);
  });

  it('matches legacy baseline for ADMIN + ADMIN_BASELINE', async () => {
    const resolver = createResolver([
      {
        id: 'm-admin-baseline',
        institutionId: 'inst-1',
        role: InstitutionMembershipRole.ADMIN,
        isActive: true,
        user: { role: Role.ADMIN },
        permissionProfile: {
          id: 'p-admin',
          key: 'ADMIN_BASELINE',
          role: Role.ADMIN,
          isSystem: true,
          permissions: profilePermissions(adminBaseline),
        },
      },
    ]);

    const comparison =
      await resolver.compareMembershipResolution('m-admin-baseline');
    expect(comparison.matches).toBe(true);
    expect(comparison.profileAwareEffective).toEqual(
      comparison.legacyEffective,
    );
    expect(comparison.legacyEffective).toEqual(adminBaseline);
  });

  it('matches legacy baseline for TEACHER + TEACHER_BASELINE', async () => {
    const resolver = createResolver([
      {
        id: 'm-teacher-baseline',
        institutionId: 'inst-1',
        role: InstitutionMembershipRole.TEACHER,
        isActive: true,
        user: { role: Role.TEACHER },
        permissionProfile: {
          id: 'p-teacher',
          key: 'TEACHER_BASELINE',
          role: Role.TEACHER,
          isSystem: true,
          permissions: profilePermissions(teacherBaseline),
        },
      },
    ]);

    const comparison =
      await resolver.compareMembershipResolution('m-teacher-baseline');
    expect(comparison.matches).toBe(true);
    expect(comparison.profileAwareEffective).toEqual(
      comparison.legacyEffective,
    );
  });

  it('uses live profile composition on subsequent resolution', async () => {
    const membership: MembershipState = {
      id: 'm-teacher-live',
      institutionId: 'inst-1',
      role: InstitutionMembershipRole.TEACHER,
      isActive: true,
      user: { role: Role.TEACHER },
      permissionProfile: {
        id: 'p-teacher',
        key: 'TEACHER_BASELINE',
        role: Role.TEACHER,
        isSystem: true,
        permissions: profilePermissions([
          PERMISSIONS.ACADEMIC_PLANNING.READ,
          PERMISSIONS.ACADEMIC_PLANNING.UPDATE,
          PERMISSIONS.CLASS_SESSIONS.UPDATE,
        ]),
      },
    };
    const resolver = createResolver([membership]);

    await expect(
      resolver.resolveForMembership('m-teacher-live'),
    ).resolves.toEqual([
      PERMISSIONS.ACADEMIC_PLANNING.READ,
      PERMISSIONS.ACADEMIC_PLANNING.UPDATE,
      PERMISSIONS.CLASS_SESSIONS.UPDATE,
    ]);

    membership.permissionProfile = {
      id: 'p-teacher',
      key: 'TEACHER_BASELINE',
      role: Role.TEACHER,
      isSystem: true,
      permissions: profilePermissions([
        PERMISSIONS.ACADEMIC_PLANNING.READ,
        PERMISSIONS.CLASS_SESSIONS.UPDATE,
      ]),
    };

    await expect(
      resolver.resolveForMembership('m-teacher-live'),
    ).resolves.toEqual([
      PERMISSIONS.ACADEMIC_PLANNING.READ,
      PERMISSIONS.CLASS_SESSIONS.UPDATE,
    ]);
  });

  it('applies the code-defined Role ceiling against extra profile permissions', async () => {
    const resolver = createResolver([
      {
        id: 'm-teacher-ceiling',
        institutionId: 'inst-1',
        role: InstitutionMembershipRole.TEACHER,
        isActive: true,
        user: { role: Role.TEACHER },
        permissionProfile: {
          id: 'p-teacher',
          key: 'TEACHER_BASELINE',
          role: Role.TEACHER,
          isSystem: true,
          permissions: profilePermissions([
            PERMISSIONS.ACADEMIC_PLANNING.READ,
            PERMISSIONS.INSTITUTIONS.CREATE,
            'not.a.real.permission',
          ]),
        },
      },
    ]);

    const effective = await resolver.resolveForMembership('m-teacher-ceiling');
    expect(effective).toEqual([PERMISSIONS.ACADEMIC_PLANNING.READ]);
    expect(effective).not.toContain(PERMISSIONS.INSTITUTIONS.CREATE);
  });

  it('rejects incompatible persisted TEACHER membership + ADMIN profile', async () => {
    const resolver = createResolver([
      {
        id: 'm-mismatch',
        institutionId: 'inst-1',
        role: InstitutionMembershipRole.TEACHER,
        isActive: true,
        user: { role: Role.TEACHER },
        permissionProfile: {
          id: 'p-admin',
          key: 'ADMIN_BASELINE',
          role: Role.ADMIN,
          isSystem: true,
          permissions: profilePermissions(adminBaseline),
        },
      },
    ]);

    await expect(
      resolver.resolveForMembership('m-mismatch'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(resolver.resolveForMembership('m-mismatch')).rejects.toThrow(
      /User\.role/,
    );
  });

  it('rejects unknown membership instead of baseline fallback', async () => {
    const resolver = createResolver([]);
    await expect(
      resolver.resolveForMembership('missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('isolates profile resolution between memberships of the same Role', async () => {
    const resolver = createResolver([
      {
        id: 'm-teacher-a',
        institutionId: 'inst-1',
        role: InstitutionMembershipRole.TEACHER,
        isActive: true,
        user: { role: Role.TEACHER },
        permissionProfile: {
          id: 'p-a',
          key: 'TEACHER_BASELINE',
          role: Role.TEACHER,
          isSystem: true,
          permissions: profilePermissions([PERMISSIONS.ACADEMIC_PLANNING.READ]),
        },
      },
      {
        id: 'm-teacher-b',
        institutionId: 'inst-1',
        role: InstitutionMembershipRole.TEACHER,
        isActive: true,
        user: { role: Role.TEACHER },
        permissionProfile: {
          id: 'p-b',
          key: 'TEACHER_BASELINE',
          role: Role.TEACHER,
          isSystem: true,
          permissions: profilePermissions([
            PERMISSIONS.CLASS_SESSIONS.UPDATE,
            PERMISSIONS.GRADES.WRITE,
          ]),
        },
      },
    ]);

    await expect(resolver.resolveForMembership('m-teacher-a')).resolves.toEqual(
      [PERMISSIONS.ACADEMIC_PLANNING.READ],
    );
    await expect(resolver.resolveForMembership('m-teacher-b')).resolves.toEqual(
      [PERMISSIONS.CLASS_SESSIONS.UPDATE, PERMISSIONS.GRADES.WRITE],
    );
  });

  it('supports membership can / canAny helpers', async () => {
    const resolver = createResolver([
      {
        id: 'm-admin',
        institutionId: 'inst-1',
        role: InstitutionMembershipRole.ADMIN,
        isActive: true,
        user: { role: Role.ADMIN },
        permissionProfile: null,
      },
    ]);

    await expect(
      resolver.canForMembership('m-admin', PERMISSIONS.COURSES.CREATE),
    ).resolves.toBe(true);
    await expect(
      resolver.canAnyForMembership('m-admin', [
        PERMISSIONS.INSTITUTIONS.CREATE,
        PERMISSIONS.COURSES.CREATE,
      ]),
    ).resolves.toBe(true);
  });

  it('resolves inactive memberships for configuration inspection without inventing a new gate', async () => {
    const resolver = createResolver([
      {
        id: 'm-inactive',
        institutionId: 'inst-1',
        role: InstitutionMembershipRole.ADMIN,
        isActive: false,
        user: { role: Role.ADMIN },
        permissionProfile: null,
      },
    ]);

    const comparison = await resolver.compareMembershipResolution('m-inactive');
    expect(comparison.isActive).toBe(false);
    expect(comparison.profileAwareEffective).toEqual(adminBaseline);
  });

  it('rejects untrusted system-like profiles that are not code baselines', async () => {
    const resolver = createResolver([
      {
        id: 'm-admin-custom',
        institutionId: 'inst-1',
        role: InstitutionMembershipRole.ADMIN,
        isActive: true,
        user: { role: Role.ADMIN },
        permissionProfile: {
          id: 'p-custom',
          key: 'ADMIN_CUSTOM',
          role: Role.ADMIN,
          isSystem: true,
          permissions: profilePermissions([PERMISSIONS.COURSES.CREATE]),
        },
      },
    ]);

    await expect(
      resolver.resolveForMembership('m-admin-custom'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
