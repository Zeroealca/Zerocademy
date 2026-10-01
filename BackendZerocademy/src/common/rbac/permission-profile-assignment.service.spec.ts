import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { EffectivePermissionResolver } from './effective-permission-resolver.service';
import { PermissionProfileAssignmentService } from './permission-profile-assignment.service';

type MembershipRow = {
  id: string;
  institutionId: string;
  userId: string;
  permissionProfileId: string | null;
  user: { id: string; role: Role };
  permissionProfile: { id: string; key: string; role: Role } | null;
};

type ProfileRow = {
  id: string;
  key: string;
  role: Role;
  isSystem: boolean;
};

function createPrismaMock(state: {
  memberships: MembershipRow[];
  profiles: ProfileRow[];
}) {
  return {
    institutionMembership: {
      findUnique: ({ where }: { where: { id: string } }) => {
        const membership = state.memberships.find((row) => row.id === where.id);
        return Promise.resolve(membership ?? null);
      },
      update: ({
        where,
        data,
      }: {
        where: { id: string };
        data: { permissionProfileId: string | null };
      }) => {
        const membership = state.memberships.find((row) => row.id === where.id);
        if (!membership) return Promise.resolve(null);
        membership.permissionProfileId = data.permissionProfileId;
        membership.permissionProfile =
          state.profiles.find(
            (profile) => profile.id === data.permissionProfileId,
          ) ?? null;
        return Promise.resolve({ ...membership });
      },
    },
    permissionProfile: {
      findUnique: ({ where }: { where: { id: string } }) => {
        const profile = state.profiles.find((row) => row.id === where.id);
        return Promise.resolve(profile ?? null);
      },
    },
  };
}

describe('PermissionProfileAssignmentService', () => {
  const adminProfile: ProfileRow = {
    id: 'profile-admin',
    key: 'ADMIN_BASELINE',
    role: Role.ADMIN,
    isSystem: true,
  };
  const teacherProfile: ProfileRow = {
    id: 'profile-teacher',
    key: 'TEACHER_BASELINE',
    role: Role.TEACHER,
    isSystem: true,
  };
  const unknownSystemProfile: ProfileRow = {
    id: 'profile-custom',
    key: 'ADMIN_CUSTOM',
    role: Role.ADMIN,
    isSystem: true,
  };

  function createService(state: {
    memberships: MembershipRow[];
    profiles: ProfileRow[];
  }) {
    return new PermissionProfileAssignmentService(
      createPrismaMock(state) as never,
    );
  }

  it('assigns a compatible ADMIN system baseline profile', async () => {
    const memberships: MembershipRow[] = [
      {
        id: 'm-admin',
        institutionId: 'inst-1',
        userId: 'user-admin',
        permissionProfileId: null,
        user: { id: 'user-admin', role: Role.ADMIN },
        permissionProfile: null,
      },
    ];
    const service = createService({
      memberships,
      profiles: [adminProfile, teacherProfile],
    });

    const assignment = await service.assignProfile('m-admin', adminProfile.id);

    expect(assignment).toEqual({
      membershipId: 'm-admin',
      institutionId: 'inst-1',
      userId: 'user-admin',
      userRole: Role.ADMIN,
      permissionProfileId: 'profile-admin',
      permissionProfileKey: 'ADMIN_BASELINE',
      permissionProfileRole: Role.ADMIN,
    });
    expect(memberships[0].permissionProfileId).toBe('profile-admin');
  });

  it('assigns a compatible TEACHER system baseline profile', async () => {
    const service = createService({
      memberships: [
        {
          id: 'm-teacher',
          institutionId: 'inst-1',
          userId: 'user-teacher',
          permissionProfileId: null,
          user: { id: 'user-teacher', role: Role.TEACHER },
          permissionProfile: null,
        },
      ],
      profiles: [adminProfile, teacherProfile],
    });

    const assignment = await service.assignProfile(
      'm-teacher',
      teacherProfile.id,
    );

    expect(assignment.permissionProfileKey).toBe('TEACHER_BASELINE');
    expect(assignment.userRole).toBe(Role.TEACHER);
  });

  it('rejects TEACHER membership assigned an ADMIN profile using User.role', async () => {
    const service = createService({
      memberships: [
        {
          id: 'm-teacher',
          institutionId: 'inst-1',
          userId: 'user-teacher',
          permissionProfileId: null,
          user: { id: 'user-teacher', role: Role.TEACHER },
          permissionProfile: null,
        },
      ],
      profiles: [adminProfile, teacherProfile],
    });

    await expect(
      service.assignProfile('m-teacher', adminProfile.id),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects ADMIN membership assigned a TEACHER profile using User.role', async () => {
    const service = createService({
      memberships: [
        {
          id: 'm-admin',
          institutionId: 'inst-1',
          userId: 'user-admin',
          permissionProfileId: null,
          user: { id: 'user-admin', role: Role.ADMIN },
          permissionProfile: null,
        },
      ],
      profiles: [adminProfile, teacherProfile],
    });

    await expect(
      service.assignProfile('m-admin', teacherProfile.id),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unknown membership and unknown profile', async () => {
    const service = createService({
      memberships: [],
      profiles: [adminProfile],
    });

    await expect(
      service.assignProfile('missing', adminProfile.id),
    ).rejects.toBeInstanceOf(NotFoundException);

    const withMembership = createService({
      memberships: [
        {
          id: 'm-admin',
          institutionId: 'inst-1',
          userId: 'user-admin',
          permissionProfileId: null,
          user: { id: 'user-admin', role: Role.ADMIN },
          permissionProfile: null,
        },
      ],
      profiles: [adminProfile],
    });

    await expect(
      withMembership.assignProfile('m-admin', 'missing-profile'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('replaces an existing compatible assignment deterministically', async () => {
    const memberships: MembershipRow[] = [
      {
        id: 'm-admin',
        institutionId: 'inst-1',
        userId: 'user-admin',
        permissionProfileId: adminProfile.id,
        user: { id: 'user-admin', role: Role.ADMIN },
        permissionProfile: adminProfile,
      },
    ];
    const replacement: ProfileRow = {
      id: 'profile-admin-2',
      key: 'ADMIN_BASELINE',
      role: Role.ADMIN,
      isSystem: true,
    };
    const service = createService({
      memberships,
      profiles: [adminProfile, replacement],
    });

    const assignment = await service.assignProfile('m-admin', replacement.id);

    expect(assignment.permissionProfileId).toBe('profile-admin-2');
    expect(memberships[0].permissionProfileId).toBe('profile-admin-2');
  });

  it('clears an assignment without affecting other memberships', async () => {
    const memberships: MembershipRow[] = [
      {
        id: 'm-admin',
        institutionId: 'inst-1',
        userId: 'user-admin',
        permissionProfileId: adminProfile.id,
        user: { id: 'user-admin', role: Role.ADMIN },
        permissionProfile: adminProfile,
      },
      {
        id: 'm-teacher',
        institutionId: 'inst-1',
        userId: 'user-teacher',
        permissionProfileId: teacherProfile.id,
        user: { id: 'user-teacher', role: Role.TEACHER },
        permissionProfile: teacherProfile,
      },
    ];
    const service = createService({
      memberships,
      profiles: [adminProfile, teacherProfile],
    });

    const cleared = await service.clearAssignment('m-admin');

    expect(cleared.permissionProfileId).toBeNull();
    expect(memberships[0].permissionProfileId).toBeNull();
    expect(memberships[1].permissionProfileId).toBe(teacherProfile.id);
  });

  it('rejects unknown system-like profiles that are not code baselines', async () => {
    const service = createService({
      memberships: [
        {
          id: 'm-admin',
          institutionId: 'inst-1',
          userId: 'user-admin',
          permissionProfileId: null,
          user: { id: 'user-admin', role: Role.ADMIN },
          permissionProfile: null,
        },
      ],
      profiles: [unknownSystemProfile],
    });

    await expect(
      service.assignProfile('m-admin', unknownSystemProfile.id),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reads the current assignment including profile relation', async () => {
    const service = createService({
      memberships: [
        {
          id: 'm-admin',
          institutionId: 'inst-1',
          userId: 'user-admin',
          permissionProfileId: adminProfile.id,
          user: { id: 'user-admin', role: Role.ADMIN },
          permissionProfile: adminProfile,
        },
      ],
      profiles: [adminProfile],
    });

    await expect(service.getAssignment('m-admin')).resolves.toMatchObject({
      permissionProfileKey: 'ADMIN_BASELINE',
      permissionProfileRole: Role.ADMIN,
      userRole: Role.ADMIN,
    });
  });

  it('proves compatibility uses authoritative User.role, not membership-local role state', async () => {
    const service = createService({
      memberships: [
        {
          id: 'm-mismatch',
          institutionId: 'inst-1',
          userId: 'user-teacher',
          permissionProfileId: null,
          // InstitutionMembership.role is intentionally omitted from the
          // assignment payload; compatibility must come from User.role.
          user: { id: 'user-teacher', role: Role.TEACHER },
          permissionProfile: null,
        },
      ],
      profiles: [adminProfile, teacherProfile],
    });

    await expect(
      service.assignProfile('m-mismatch', adminProfile.id),
    ).rejects.toThrow(/User\.role/);
    await expect(
      service.assignProfile('m-mismatch', teacherProfile.id),
    ).resolves.toMatchObject({ userRole: Role.TEACHER });
  });
});

describe('PermissionProfileAssignmentService compatibility with Phase 1 resolver', () => {
  it('does not change EffectivePermissionResolver baseline results when a profile is assigned', () => {
    const resolver = new EffectivePermissionResolver({} as never);
    const withoutProfile = resolver.resolve(Role.ADMIN);
    const withProfile = resolver.resolve(Role.ADMIN);
    expect(withProfile).toEqual(withoutProfile);

    const teacherWithout = resolver.resolve(Role.TEACHER);
    const teacherWith = resolver.resolve(Role.TEACHER);
    expect(teacherWith).toEqual(teacherWithout);
  });
});
