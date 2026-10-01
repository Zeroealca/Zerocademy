/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Jest asymmetric matchers are untyped. */
import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AppLoggerService } from '../logger/app-logger.service';
import { EffectivePermissionResolver } from './effective-permission-resolver.service';
import { PERMISSIONS } from './permission-catalog';
import {
  AUTHORIZATION_PERMISSION_ENFORCEMENT_EVENT,
  MembershipPermissionEnforcer,
} from './membership-permission-enforcer.service';

describe('MembershipPermissionEnforcer', () => {
  const teacher = {
    id: 'user-1',
    email: 'u@test',
    firstName: 'U',
    lastName: 'One',
    role: Role.TEACHER,
    profileId: 'teacher-1',
    institutionId: 'inst-a',
  };

  function createEnforcer(options?: {
    membership?: {
      id: string;
      permissionProfile: { key: string } | null;
    } | null;
    can?: boolean;
    canForMembership?: boolean | Error;
  }) {
    const prisma = {
      institutionMembership: {
        findFirst: jest.fn().mockResolvedValue(
          options?.membership === undefined
            ? {
                id: 'membership-a',
                permissionProfile: { key: 'TEACHER_BASELINE' },
              }
            : options.membership,
        ),
      },
    };
    const resolver = {
      can: jest.fn().mockReturnValue(options?.can ?? true),
      canForMembership: jest.fn().mockImplementation(() => {
        const value = options?.canForMembership ?? true;
        if (value instanceof Error) return Promise.reject(value);
        return Promise.resolve(value);
      }),
    };
    const logger = { log: jest.fn(), warn: jest.fn() };
    const enforcer = new MembershipPermissionEnforcer(
      prisma as never,
      resolver as unknown as EffectivePermissionResolver,
      logger as unknown as AppLoggerService,
    );
    return { enforcer, prisma, resolver, logger };
  }

  const baseInput = {
    actor: teacher,
    institutionId: 'inst-a',
    permission: PERMISSIONS.CLASS_SESSIONS.READ,
    domain: 'academic-execution',
    resourceType: 'teacherAssignment',
    resourceId: 'assignment-a',
  };

  it('allows baseline TEACHER with class_sessions.read', async () => {
    const { enforcer, logger, prisma } = createEnforcer();
    await expect(
      enforcer.requireMembershipPermission(baseInput),
    ).resolves.toMatchObject({
      decision: 'ALLOWED',
      profileAwareCapable: true,
    });
    expect(prisma.institutionMembership.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        institutionId: 'inst-a',
        isActive: true,
      },
      select: {
        id: true,
        permissionProfile: { select: { key: true } },
      },
    });
    expect(logger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: AUTHORIZATION_PERMISSION_ENFORCEMENT_EVENT,
        metadata: expect.objectContaining({
          decision: 'ALLOWED',
          permission: PERMISSIONS.CLASS_SESSIONS.READ,
        }),
      }),
    );
  });

  it('exposes the reusable institution-membership enforcement API', async () => {
    const { enforcer } = createEnforcer();

    await expect(
      enforcer.requireForInstitutionMembership(baseInput),
    ).resolves.toMatchObject({
      decision: 'ALLOWED',
      permission: PERMISSIONS.CLASS_SESSIONS.READ,
    });
  });

  it.each([
    PERMISSIONS.CLASS_SESSIONS.CREATE,
    PERMISSIONS.CLASS_SESSIONS.UPDATE,
    PERMISSIONS.ACADEMIC_PLANNING.CREATE,
    PERMISSIONS.ACADEMIC_PLANNING.UPDATE,
    PERMISSIONS.ACADEMIC_PLANNING.PUBLISH,
    PERMISSIONS.ACADEMIC_PLANNING.DELETE,
  ])('emits write-enforcement telemetry for %s', async (permission) => {
    const { enforcer, logger } = createEnforcer();

    await expect(
      enforcer.requireMembershipPermission({ ...baseInput, permission }),
    ).resolves.toMatchObject({ decision: 'ALLOWED', permission });
    expect(logger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: AUTHORIZATION_PERMISSION_ENFORCEMENT_EVENT,
        metadata: expect.objectContaining({
          decision: 'ALLOWED',
          permission,
        }),
      }),
    );
  });

  it('allows ADMIN baseline profile membership', async () => {
    const { enforcer } = createEnforcer({
      membership: {
        id: 'membership-admin',
        permissionProfile: { key: 'ADMIN_BASELINE' },
      },
    });
    await expect(
      enforcer.requireMembershipPermission({
        ...baseInput,
        actor: { ...teacher, id: 'admin-1', role: Role.ADMIN },
      }),
    ).resolves.toMatchObject({ decision: 'ALLOWED' });
  });

  it('allows null-profile membership via baseline fallback when resolver grants', async () => {
    const { enforcer } = createEnforcer({
      membership: { id: 'membership-null', permissionProfile: null },
      canForMembership: true,
    });
    await expect(
      enforcer.requireMembershipPermission(baseInput),
    ).resolves.toMatchObject({
      decision: 'ALLOWED',
      permissionProfileKey: null,
    });
  });

  it('denies when profile-aware capability lacks class_sessions.read', async () => {
    const { enforcer, logger } = createEnforcer({
      can: true,
      canForMembership: false,
    });
    await expect(
      enforcer.requireMembershipPermission(baseInput),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: AUTHORIZATION_PERMISSION_ENFORCEMENT_EVENT,
        metadata: expect.objectContaining({
          decision: 'DENIED',
          reason: 'PERMISSION_NOT_GRANTED',
          legacyCapable: true,
          profileAwareCapable: false,
        }),
      }),
    );
  });

  it('fails closed when profile-aware resolution errors', async () => {
    const { enforcer, logger } = createEnforcer({
      can: true,
      canForMembership: new Error(
        'Persisted permission profile role ADMIN is incompatible',
      ),
    });
    await expect(
      enforcer.requireMembershipPermission(baseInput),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          decision: 'ERROR',
          reason: 'PROFILE_AWARE_RESOLUTION_FAILED',
          errorMessage: expect.stringContaining('incompatible'),
        }),
      }),
    );
  });

  it('fails closed when required institution membership is missing', async () => {
    const { enforcer, logger } = createEnforcer({ membership: null });
    await expect(
      enforcer.requireMembershipPermission(baseInput),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          decision: 'ERROR',
          reason: 'MISSING_REQUIRED_MEMBERSHIP',
        }),
      }),
    );
  });

  it('fails closed when institution context is missing for ADMIN/TEACHER', async () => {
    const { enforcer, logger } = createEnforcer();
    await expect(
      enforcer.requireMembershipPermission({
        ...baseInput,
        institutionId: null,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          decision: 'ERROR',
          reason: 'MISSING_REQUIRED_INSTITUTION_CONTEXT',
        }),
      }),
    );
  });

  it('treats SUPER_ADMIN as NOT_APPLICABLE without membership lookup', async () => {
    const { enforcer, prisma, logger } = createEnforcer();
    await expect(
      enforcer.requireMembershipPermission({
        ...baseInput,
        actor: { ...teacher, role: Role.SUPER_ADMIN },
      }),
    ).resolves.toMatchObject({
      decision: 'NOT_APPLICABLE',
      reason: 'SUPER_ADMIN_NO_MEMBERSHIP',
    });
    expect(prisma.institutionMembership.findFirst).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ decision: 'NOT_APPLICABLE' }),
      }),
    );
  });

  it('selects membership for the resource institution only', async () => {
    const { enforcer, prisma } = createEnforcer();
    await enforcer.requireMembershipPermission({
      ...baseInput,
      institutionId: 'inst-b',
    });
    expect(prisma.institutionMembership.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          institutionId: 'inst-b',
          isActive: true,
        }),
      }),
    );
  });

  it('evaluates Institution A and B memberships independently', async () => {
    const prisma = {
      institutionMembership: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'membership-a',
            permissionProfile: { key: 'RESTRICTED_A' },
          })
          .mockResolvedValueOnce({
            id: 'membership-b',
            permissionProfile: { key: 'TEACHER_BASELINE' },
          }),
      },
    };
    const resolver = {
      can: jest.fn().mockReturnValue(true),
      canForMembership: jest
        .fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true),
    };
    const logger = { log: jest.fn(), warn: jest.fn() };
    const enforcer = new MembershipPermissionEnforcer(
      prisma as never,
      resolver as unknown as EffectivePermissionResolver,
      logger as unknown as AppLoggerService,
    );

    await expect(
      enforcer.requireMembershipPermission({
        ...baseInput,
        institutionId: 'inst-a',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      enforcer.requireMembershipPermission({
        ...baseInput,
        institutionId: 'inst-b',
      }),
    ).resolves.toMatchObject({ decision: 'ALLOWED' });

    expect(prisma.institutionMembership.findFirst).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({ institutionId: 'inst-a' }),
      }),
    );
    expect(prisma.institutionMembership.findFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({ institutionId: 'inst-b' }),
      }),
    );
    expect(resolver.canForMembership).toHaveBeenNthCalledWith(
      1,
      'membership-a',
      PERMISSIONS.CLASS_SESSIONS.READ,
    );
    expect(resolver.canForMembership).toHaveBeenNthCalledWith(
      2,
      'membership-b',
      PERMISSIONS.CLASS_SESSIONS.READ,
    );
  });

  it('does not expose profile internals in ForbiddenException messages', async () => {
    const { enforcer } = createEnforcer({ canForMembership: false });
    try {
      await enforcer.requireMembershipPermission(baseInput);
      fail('expected ForbiddenException');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).message).toBe('Access denied');
      expect((error as ForbiddenException).message).not.toContain(
        'TEACHER_BASELINE',
      );
      expect((error as ForbiddenException).message).not.toContain(
        'class_sessions.read',
      );
    }
  });
});
