/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Jest asymmetric matchers are untyped. */
import { Role } from '@prisma/client';
import { AppLoggerService } from '../logger/app-logger.service';
import { EffectivePermissionResolver } from './effective-permission-resolver.service';
import { PERMISSIONS } from './permission-catalog';
import {
  AUTHORIZATION_DUAL_EVALUATION_EVENT,
  PermissionDualEvaluationObserver,
} from './permission-dual-evaluation.observer';

describe('PermissionDualEvaluationObserver', () => {
  const actor = {
    id: 'user-1',
    email: 'u@test',
    firstName: 'U',
    lastName: 'One',
    role: Role.TEACHER,
    profileId: 'teacher-1',
    institutionId: 'inst-a',
  };

  function createObserver(options?: {
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
    const observer = new PermissionDualEvaluationObserver(
      prisma as never,
      resolver as unknown as EffectivePermissionResolver,
      logger as unknown as AppLoggerService,
    );
    return { observer, prisma, resolver, logger };
  }

  it('records MATCH for baseline TEACHER capability parity', async () => {
    const { observer, logger, resolver, prisma } = createObserver();
    const result = await observer.observeMembershipCapability({
      actor,
      institutionId: 'inst-a',
      permission: PERMISSIONS.CLASS_SESSIONS.READ,
      domain: 'academic-execution',
      resourceType: 'teacherAssignment',
      resourceId: 'assignment-a',
    });

    expect(result.outcome).toBe('MATCH');
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
    expect(resolver.can).toHaveBeenCalledWith(
      Role.TEACHER,
      PERMISSIONS.CLASS_SESSIONS.READ,
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: AUTHORIZATION_DUAL_EVALUATION_EVENT,
        metadata: expect.objectContaining({
          outcome: 'MATCH',
          permission: PERMISSIONS.CLASS_SESSIONS.READ,
          legacyCapable: true,
          profileAwareCapable: true,
        }),
      }),
    );
  });

  it('records MATCH for ADMIN baseline capability parity', async () => {
    const { observer, logger } = createObserver({
      membership: {
        id: 'membership-admin',
        permissionProfile: { key: 'ADMIN_BASELINE' },
      },
    });
    const result = await observer.observeMembershipCapability({
      actor: { ...actor, id: 'admin-1', role: Role.ADMIN },
      institutionId: 'inst-a',
      permission: PERMISSIONS.CLASS_SESSIONS.READ,
      domain: 'academic-execution',
      resourceType: 'teacherAssignment',
      resourceId: 'assignment-a',
    });
    expect(result.outcome).toBe('MATCH');
    expect(logger.log).toHaveBeenCalled();
  });

  it('treats null profile membership resolution parity as MATCH when resolver agrees', async () => {
    const { observer } = createObserver({
      membership: { id: 'membership-null', permissionProfile: null },
      can: true,
      canForMembership: true,
    });
    await expect(
      observer.observeMembershipCapability({
        actor,
        institutionId: 'inst-a',
        permission: PERMISSIONS.CLASS_SESSIONS.READ,
        domain: 'academic-execution',
        resourceType: 'teacherAssignment',
      }),
    ).resolves.toMatchObject({
      outcome: 'MATCH',
      permissionProfileKey: null,
    });
  });

  it('records MISMATCH without throwing when profile-aware capability differs', async () => {
    const { observer, logger } = createObserver({
      can: true,
      canForMembership: false,
    });
    const result = await observer.observeMembershipCapability({
      actor,
      institutionId: 'inst-a',
      permission: PERMISSIONS.CLASS_SESSIONS.READ,
      domain: 'academic-execution',
      resourceType: 'teacherAssignment',
      resourceId: 'assignment-a',
    });
    expect(result.outcome).toBe('MISMATCH');
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: AUTHORIZATION_DUAL_EVALUATION_EVENT,
        metadata: expect.objectContaining({
          outcome: 'MISMATCH',
          legacyCapable: true,
          profileAwareCapable: false,
        }),
      }),
    );
  });

  it('isolates profile-aware resolver errors as ERROR', async () => {
    const { observer, logger } = createObserver({
      can: true,
      canForMembership: new Error(
        'Persisted permission profile role ADMIN is incompatible',
      ),
    });
    const result = await observer.observeMembershipCapability({
      actor,
      institutionId: 'inst-a',
      permission: PERMISSIONS.CLASS_SESSIONS.READ,
      domain: 'academic-execution',
      resourceType: 'teacherAssignment',
    });
    expect(result.outcome).toBe('ERROR');
    expect(result.reason).toBe('PROFILE_AWARE_RESOLUTION_FAILED');
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          outcome: 'ERROR',
          errorMessage: expect.stringContaining('incompatible'),
        }),
      }),
    );
  });

  it('marks SUPER_ADMIN as NOT_APPLICABLE without membership lookup', async () => {
    const { observer, prisma, logger } = createObserver();
    const result = await observer.observeMembershipCapability({
      actor: { ...actor, role: Role.SUPER_ADMIN },
      institutionId: 'inst-a',
      permission: PERMISSIONS.CLASS_SESSIONS.READ,
      domain: 'academic-execution',
      resourceType: 'teacherAssignment',
    });
    expect(result.outcome).toBe('NOT_APPLICABLE');
    expect(result.reason).toBe('SUPER_ADMIN_NO_MEMBERSHIP');
    expect(prisma.institutionMembership.findFirst).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalled();
  });

  it('selects the membership for the resource institution, not another institution', async () => {
    const { observer, prisma } = createObserver();
    await observer.observeMembershipCapability({
      actor,
      institutionId: 'inst-b',
      permission: PERMISSIONS.CLASS_SESSIONS.READ,
      domain: 'academic-execution',
      resourceType: 'teacherAssignment',
      resourceId: 'assignment-b',
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

  it('marks missing institution membership as NOT_APPLICABLE', async () => {
    const { observer } = createObserver({ membership: null });
    await expect(
      observer.observeMembershipCapability({
        actor,
        institutionId: 'inst-a',
        permission: PERMISSIONS.CLASS_SESSIONS.READ,
        domain: 'academic-execution',
        resourceType: 'teacherAssignment',
      }),
    ).resolves.toMatchObject({
      outcome: 'NOT_APPLICABLE',
      reason: 'NO_MEMBERSHIP_FOR_INSTITUTION',
    });
  });
});
