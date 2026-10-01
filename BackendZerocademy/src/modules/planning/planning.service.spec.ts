/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AcademicPlanStatus, Role } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { PlanningService } from './planning.service';

const actor: AuthenticatedUser = {
  id: 'teacher-user',
  email: 'teacher@example.test',
  firstName: 'Ada',
  lastName: 'Teacher',
  role: Role.TEACHER,
  profileId: 'teacher-profile',
  institutionId: 'institution',
};

function plan(status: AcademicPlanStatus = AcademicPlanStatus.DRAFT) {
  return {
    id: 'plan',
    teacherAssignmentId: 'assignment',
    academicTermId: 'term',
    title: 'Plan',
    description: null,
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    endDate: new Date('2026-09-10T00:00:00.000Z'),
    objectives: 'Objective',
    contents: 'Contents',
    activities: 'Activities',
    resources: null,
    evaluationNotes: null,
    notes: null,
    status,
    createdByUserId: 'teacher-user',
    publishedAt: null,
    publishedByUserId: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    academicTerm: { id: 'term', name: 'Term', order: 1 },
    teacherAssignment: {
      id: 'assignment',
      teacherId: 'teacher-profile',
      institutionId: 'institution',
      courseId: 'course',
      subjectId: 'subject',
      academicPeriodId: 'period',
      academicPeriod: { id: 'period', name: 'Period', status: 'ACTIVE' },
      course: { id: 'course', name: 'Course', section: 'A' },
      subject: { id: 'subject', name: 'Math', code: 'MAT' },
      teacher: {
        id: 'teacher-profile',
        user: { firstName: 'Ada', lastName: 'Teacher' },
      },
    },
  };
}

describe('PlanningService', () => {
  let service: PlanningService;
  const permissionEnforcer = {
    requireForInstitutionMembership: jest.fn().mockResolvedValue({
      decision: 'ALLOWED',
      permission: 'academic_planning.read',
      legacyCapable: true,
      profileAwareCapable: true,
    }),
  };
  let prisma: {
    teacherAssignment: { findFirst: jest.Mock };
    institutionMembership: { findFirst: jest.Mock };
    academicTerm: { findUnique: jest.Mock };
    academicPlan: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    permissionEnforcer.requireForInstitutionMembership.mockResolvedValue({
      decision: 'ALLOWED',
      permission: 'academic_planning.read',
      legacyCapable: true,
      profileAwareCapable: true,
    });
    prisma = {
      teacherAssignment: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'assignment',
          teacherId: 'teacher-profile',
          institutionId: 'institution',
          academicPeriodId: 'period',
          academicPeriod: { status: 'ACTIVE' },
        }),
      },
      institutionMembership: { findFirst: jest.fn().mockResolvedValue(null) },
      academicTerm: {
        findUnique: jest.fn().mockResolvedValue({
          academicPeriodId: 'period',
          startDate: new Date('2026-09-01T00:00:00.000Z'),
          endDate: new Date('2026-09-30T00:00:00.000Z'),
        }),
      },
      academicPlan: {
        create: jest.fn().mockResolvedValue(plan()),
        findUnique: jest.fn().mockResolvedValue(plan()),
        update: jest.fn().mockResolvedValue(plan()),
        delete: jest.fn(),
      },
    };
    service = new PlanningService(
      prisma as unknown as PrismaService,
      { log: jest.fn() } as unknown as AppLoggerService,
      permissionEnforcer as never,
    );
  });

  it('creates an owned assignment plan as a draft', async () => {
    await service.create(actor, {
      teacherAssignmentId: 'assignment',
      academicTermId: 'term',
      title: ' Draft plan ',
    });
    expect(prisma.academicPlan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: AcademicPlanStatus.DRAFT,
          createdByUserId: actor.id,
          title: 'Draft plan',
        }),
      }),
    );
  });

  describe('Phase 15 AcademicPlan CREATE permission enforcement', () => {
    const createDto = {
      teacherAssignmentId: 'assignment',
      academicTermId: 'term',
      title: 'Plan',
    };

    it('requires academic_planning.create after teacher ownership establishes context', async () => {
      await expect(service.create(actor, createDto)).resolves.toMatchObject({
        id: 'plan',
      });

      expect(
        permissionEnforcer.requireForInstitutionMembership,
      ).toHaveBeenCalledWith({
        actor,
        institutionId: 'institution',
        permission: 'academic_planning.create',
        domain: 'academic-planning',
        resourceType: 'teacherAssignment',
        resourceId: 'assignment',
      });
    });

    it('denies a legacy-authorized teacher without create permission before persistence', async () => {
      permissionEnforcer.requireForInstitutionMembership.mockRejectedValue(
        new ForbiddenException('Access denied'),
      );

      await expect(service.create(actor, createDto)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.academicPlan.create).not.toHaveBeenCalled();
    });

    it('does not evaluate permission when assignment ownership fails', async () => {
      prisma.teacherAssignment.findFirst.mockResolvedValue(null);

      await expect(service.create(actor, createDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(
        permissionEnforcer.requireForInstitutionMembership,
      ).not.toHaveBeenCalled();
      expect(prisma.academicPlan.create).not.toHaveBeenCalled();
    });

    it.each([Role.ADMIN, Role.SUPER_ADMIN, Role.STUDENT, Role.REPRESENTATIVE])(
      'does not evaluate permission for legacy-denied %s',
      async (role) => {
        await expect(
          service.create({ ...actor, role }, createDto),
        ).rejects.toBeInstanceOf(NotFoundException);
        expect(
          permissionEnforcer.requireForInstitutionMembership,
        ).not.toHaveBeenCalled();
        expect(prisma.academicPlan.create).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['membership is missing', new ForbiddenException('Access denied')],
      ['permission resolution fails', new ForbiddenException('Access denied')],
    ])('fails closed before persistence when %s', async (_reason, error) => {
      permissionEnforcer.requireForInstitutionMembership.mockRejectedValue(
        error,
      );

      await expect(service.create(actor, createDto)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.academicPlan.create).not.toHaveBeenCalled();
    });

    it('retains the null permission-profile baseline fallback when enforcement allows', async () => {
      permissionEnforcer.requireForInstitutionMembership.mockResolvedValue({
        decision: 'ALLOWED',
        permission: 'academic_planning.create',
        legacyCapable: true,
        profileAwareCapable: true,
        permissionProfileKey: null,
      });

      await expect(service.create(actor, createDto)).resolves.toMatchObject({
        id: 'plan',
      });
      expect(prisma.academicPlan.create).toHaveBeenCalledTimes(1);
    });

    it('runs lifecycle validation only after authorization and still blocks closed periods', async () => {
      prisma.teacherAssignment.findFirst.mockResolvedValue({
        id: 'assignment',
        teacherId: 'teacher-profile',
        institutionId: 'institution',
        academicPeriodId: 'period',
        academicPeriod: { status: 'CLOSED' },
      });

      await expect(service.create(actor, createDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(
        permissionEnforcer.requireForInstitutionMembership,
      ).toHaveBeenCalledTimes(1);
      expect(prisma.academicPlan.create).not.toHaveBeenCalled();
    });
  });

  describe('Phase 16 AcademicPlan UPDATE permission enforcement', () => {
    const updateDto = { title: 'Updated plan' };

    it('requires academic_planning.update after teacher ownership establishes context', async () => {
      await expect(
        service.update(actor, 'plan', updateDto),
      ).resolves.toMatchObject({
        id: 'plan',
      });

      expect(
        permissionEnforcer.requireForInstitutionMembership,
      ).toHaveBeenCalledWith({
        actor,
        institutionId: 'institution',
        permission: 'academic_planning.update',
        domain: 'academic-planning',
        resourceType: 'academicPlan',
        resourceId: 'plan',
      });
    });

    it('denies a legacy-authorized teacher without update permission before persistence', async () => {
      permissionEnforcer.requireForInstitutionMembership.mockRejectedValue(
        new ForbiddenException('Access denied'),
      );

      await expect(
        service.update(actor, 'plan', updateDto),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.academicPlan.update).not.toHaveBeenCalled();
    });

    it('does not evaluate permission when another teacher fails legacy ownership', async () => {
      await expect(
        service.update(
          { ...actor, profileId: 'other-teacher' },
          'plan',
          updateDto,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(
        permissionEnforcer.requireForInstitutionMembership,
      ).not.toHaveBeenCalled();
      expect(prisma.academicPlan.update).not.toHaveBeenCalled();
    });

    it.each([Role.ADMIN, Role.SUPER_ADMIN, Role.STUDENT, Role.REPRESENTATIVE])(
      'does not evaluate permission for legacy-denied %s',
      async (role) => {
        await expect(
          service.update({ ...actor, role }, 'plan', updateDto),
        ).rejects.toBeInstanceOf(NotFoundException);
        expect(
          permissionEnforcer.requireForInstitutionMembership,
        ).not.toHaveBeenCalled();
        expect(prisma.academicPlan.update).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['membership is missing', new ForbiddenException('Access denied')],
      ['permission resolution fails', new ForbiddenException('Access denied')],
    ])('fails closed before persistence when %s', async (_reason, error) => {
      permissionEnforcer.requireForInstitutionMembership.mockRejectedValue(
        error,
      );

      await expect(
        service.update(actor, 'plan', updateDto),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.academicPlan.update).not.toHaveBeenCalled();
    });

    it('retains the null permission-profile baseline fallback when enforcement allows', async () => {
      permissionEnforcer.requireForInstitutionMembership.mockResolvedValue({
        decision: 'ALLOWED',
        permission: 'academic_planning.update',
        legacyCapable: true,
        profileAwareCapable: true,
        permissionProfileKey: null,
      });

      await expect(
        service.update(actor, 'plan', updateDto),
      ).resolves.toMatchObject({
        id: 'plan',
      });
      expect(prisma.academicPlan.update).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['published plans', AcademicPlanStatus.PUBLISHED, 'ACTIVE'],
      ['closed periods', AcademicPlanStatus.DRAFT, 'CLOSED'],
    ])(
      'preserves lifecycle immutability for %s',
      async (_reason, status, periodStatus) => {
        prisma.academicPlan.findUnique.mockResolvedValue({
          ...plan(status),
          teacherAssignment: {
            ...plan().teacherAssignment,
            academicPeriod: {
              id: 'period',
              name: 'Period',
              status: periodStatus,
            },
          },
        });

        await expect(
          service.update(actor, 'plan', updateDto),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(
          permissionEnforcer.requireForInstitutionMembership,
        ).toHaveBeenCalledTimes(1);
        expect(prisma.academicPlan.update).not.toHaveBeenCalled();
      },
    );

    it('preserves existing archived-period edit behavior', async () => {
      prisma.academicPlan.findUnique.mockResolvedValue({
        ...plan(),
        teacherAssignment: {
          ...plan().teacherAssignment,
          academicPeriod: {
            id: 'period',
            name: 'Period',
            status: 'ARCHIVED',
          },
        },
      });

      await expect(
        service.update(actor, 'plan', updateDto),
      ).resolves.toMatchObject({ id: 'plan' });
      expect(prisma.academicPlan.update).toHaveBeenCalledTimes(1);
    });

    it('uses the separate publish capability rather than update capability', async () => {
      await expect(service.publish(actor, 'plan')).resolves.toMatchObject({
        id: 'plan',
        status: AcademicPlanStatus.DRAFT,
      });
      expect(
        permissionEnforcer.requireForInstitutionMembership,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ permission: 'academic_planning.publish' }),
      );
      expect(prisma.academicPlan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: AcademicPlanStatus.PUBLISHED,
          }),
        }),
      );
    });
  });

  describe('Phase 17 AcademicPlan PUBLISH permission enforcement', () => {
    it('requires academic_planning.publish after teacher ownership establishes context', async () => {
      await expect(service.publish(actor, 'plan')).resolves.toMatchObject({
        id: 'plan',
      });

      expect(
        permissionEnforcer.requireForInstitutionMembership,
      ).toHaveBeenCalledWith({
        actor,
        institutionId: 'institution',
        permission: 'academic_planning.publish',
        domain: 'academic-planning',
        resourceType: 'academicPlan',
        resourceId: 'plan',
      });
    });

    it('denies a legacy-authorized teacher without publish permission before persistence', async () => {
      permissionEnforcer.requireForInstitutionMembership.mockRejectedValue(
        new ForbiddenException('Access denied'),
      );

      await expect(service.publish(actor, 'plan')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.academicPlan.update).not.toHaveBeenCalled();
    });

    it('does not evaluate permission when another teacher fails legacy ownership', async () => {
      await expect(
        service.publish({ ...actor, profileId: 'other-teacher' }, 'plan'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(
        permissionEnforcer.requireForInstitutionMembership,
      ).not.toHaveBeenCalled();
      expect(prisma.academicPlan.update).not.toHaveBeenCalled();
    });

    it.each([Role.ADMIN, Role.SUPER_ADMIN, Role.STUDENT, Role.REPRESENTATIVE])(
      'does not evaluate permission for legacy-denied %s',
      async (role) => {
        await expect(
          service.publish({ ...actor, role }, 'plan'),
        ).rejects.toBeInstanceOf(NotFoundException);
        expect(
          permissionEnforcer.requireForInstitutionMembership,
        ).not.toHaveBeenCalled();
        expect(prisma.academicPlan.update).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['membership is missing', new ForbiddenException('Access denied')],
      ['permission resolution fails', new ForbiddenException('Access denied')],
    ])('fails closed before persistence when %s', async (_reason, error) => {
      permissionEnforcer.requireForInstitutionMembership.mockRejectedValue(
        error,
      );

      await expect(service.publish(actor, 'plan')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.academicPlan.update).not.toHaveBeenCalled();
    });

    it('retains the null permission-profile baseline fallback when enforcement allows', async () => {
      permissionEnforcer.requireForInstitutionMembership.mockResolvedValue({
        decision: 'ALLOWED',
        permission: 'academic_planning.publish',
        legacyCapable: true,
        profileAwareCapable: true,
        permissionProfileKey: null,
      });

      await expect(service.publish(actor, 'plan')).resolves.toMatchObject({
        id: 'plan',
      });
      expect(prisma.academicPlan.update).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['published plans', AcademicPlanStatus.PUBLISHED, 'ACTIVE'],
      ['closed periods', AcademicPlanStatus.DRAFT, 'CLOSED'],
    ])(
      'preserves publication lifecycle rejection for %s',
      async (_reason, status, periodStatus) => {
        prisma.academicPlan.findUnique.mockResolvedValue({
          ...plan(status),
          teacherAssignment: {
            ...plan().teacherAssignment,
            academicPeriod: {
              id: 'period',
              name: 'Period',
              status: periodStatus,
            },
          },
        });

        await expect(service.publish(actor, 'plan')).rejects.toBeInstanceOf(
          BadRequestException,
        );
        expect(prisma.academicPlan.update).not.toHaveBeenCalled();
      },
    );

    it('preserves existing archived-period publication behavior', async () => {
      prisma.academicPlan.findUnique.mockResolvedValue({
        ...plan(),
        teacherAssignment: {
          ...plan().teacherAssignment,
          academicPeriod: {
            id: 'period',
            name: 'Period',
            status: 'ARCHIVED',
          },
        },
      });

      await expect(service.publish(actor, 'plan')).resolves.toMatchObject({
        id: 'plan',
      });
      expect(prisma.academicPlan.update).toHaveBeenCalledTimes(1);
    });

    it('does not let publish permission bypass completeness validation', async () => {
      prisma.academicPlan.findUnique.mockResolvedValue({
        ...plan(),
        activities: null,
      });

      await expect(service.publish(actor, 'plan')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.academicPlan.update).not.toHaveBeenCalled();
    });
  });

  describe('Phase 18 AcademicPlan DELETE permission enforcement', () => {
    it('requires academic_planning.delete after teacher ownership establishes context', async () => {
      await expect(service.remove(actor, 'plan')).resolves.toBeUndefined();

      expect(
        permissionEnforcer.requireForInstitutionMembership,
      ).toHaveBeenCalledWith({
        actor,
        institutionId: 'institution',
        permission: 'academic_planning.delete',
        domain: 'academic-planning',
        resourceType: 'academicPlan',
        resourceId: 'plan',
      });
      expect(prisma.academicPlan.delete).toHaveBeenCalledWith({
        where: { id: 'plan' },
      });
    });

    it('denies a legacy-authorized teacher without delete permission before persistence', async () => {
      permissionEnforcer.requireForInstitutionMembership.mockRejectedValue(
        new ForbiddenException('Access denied'),
      );

      await expect(service.remove(actor, 'plan')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.academicPlan.delete).not.toHaveBeenCalled();
    });

    it('does not evaluate permission when another teacher fails legacy ownership', async () => {
      await expect(
        service.remove({ ...actor, profileId: 'other-teacher' }, 'plan'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(
        permissionEnforcer.requireForInstitutionMembership,
      ).not.toHaveBeenCalled();
      expect(prisma.academicPlan.delete).not.toHaveBeenCalled();
    });

    it.each([Role.ADMIN, Role.SUPER_ADMIN, Role.STUDENT, Role.REPRESENTATIVE])(
      'does not evaluate permission for legacy-denied %s',
      async (role) => {
        await expect(
          service.remove({ ...actor, role }, 'plan'),
        ).rejects.toBeInstanceOf(NotFoundException);
        expect(
          permissionEnforcer.requireForInstitutionMembership,
        ).not.toHaveBeenCalled();
        expect(prisma.academicPlan.delete).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['membership is missing', new ForbiddenException('Access denied')],
      ['permission resolution fails', new ForbiddenException('Access denied')],
    ])('fails closed before persistence when %s', async (_reason, error) => {
      permissionEnforcer.requireForInstitutionMembership.mockRejectedValue(
        error,
      );

      await expect(service.remove(actor, 'plan')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.academicPlan.delete).not.toHaveBeenCalled();
    });

    it('retains the null permission-profile baseline fallback when enforcement allows', async () => {
      permissionEnforcer.requireForInstitutionMembership.mockResolvedValue({
        decision: 'ALLOWED',
        permission: 'academic_planning.delete',
        legacyCapable: true,
        profileAwareCapable: true,
        permissionProfileKey: null,
      });

      await expect(service.remove(actor, 'plan')).resolves.toBeUndefined();
      expect(prisma.academicPlan.delete).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['published plans', AcademicPlanStatus.PUBLISHED, 'ACTIVE'],
      ['closed periods', AcademicPlanStatus.DRAFT, 'CLOSED'],
    ])(
      'preserves deletion lifecycle rejection for %s',
      async (_reason, status, periodStatus) => {
        prisma.academicPlan.findUnique.mockResolvedValue({
          ...plan(status),
          teacherAssignment: {
            ...plan().teacherAssignment,
            academicPeriod: {
              id: 'period',
              name: 'Period',
              status: periodStatus,
            },
          },
        });

        await expect(service.remove(actor, 'plan')).rejects.toBeInstanceOf(
          BadRequestException,
        );
        expect(prisma.academicPlan.delete).not.toHaveBeenCalled();
      },
    );

    it('preserves existing archived-period deletion behavior', async () => {
      prisma.academicPlan.findUnique.mockResolvedValue({
        ...plan(),
        teacherAssignment: {
          ...plan().teacherAssignment,
          academicPeriod: {
            id: 'period',
            name: 'Period',
            status: 'ARCHIVED',
          },
        },
      });

      await expect(service.remove(actor, 'plan')).resolves.toBeUndefined();
      expect(prisma.academicPlan.delete).toHaveBeenCalledTimes(1);
    });
  });

  it('rejects creation for an assignment owned by another teacher', async () => {
    prisma.teacherAssignment.findFirst.mockResolvedValue(null);
    await expect(
      service.create(actor, {
        teacherAssignmentId: 'another-assignment',
        academicTermId: 'term',
        title: 'Plan',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.academicPlan.create).not.toHaveBeenCalled();
  });

  it('rejects publishing a draft without required content', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      ...plan(),
      objectives: null,
    });
    await expect(service.publish(actor, 'plan')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.academicPlan.update).not.toHaveBeenCalled();
  });

  it('does not delete published plans', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue(
      plan(AcademicPlanStatus.PUBLISHED),
    );
    await expect(service.remove(actor, 'plan')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.academicPlan.delete).not.toHaveBeenCalled();
  });

  it('keeps closed-period plans readable but blocks draft updates', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      ...plan(),
      teacherAssignment: {
        ...plan().teacherAssignment,
        academicPeriod: { id: 'period', name: 'Period', status: 'CLOSED' },
      },
    });
    await expect(service.findOne(actor, 'plan')).resolves.toMatchObject({
      id: 'plan',
    });
    await expect(
      service.update(actor, 'plan', { title: 'Updated' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.academicPlan.update).not.toHaveBeenCalled();
  });

  describe('Phase 12 AcademicPlan READ permission enforcement', () => {
    it('enforces academic_planning.read after legacy teacher ownership allows', async () => {
      await expect(service.findOne(actor, 'plan')).resolves.toMatchObject({
        id: 'plan',
      });

      expect(
        permissionEnforcer.requireForInstitutionMembership,
      ).toHaveBeenCalledWith({
        actor,
        institutionId: 'institution',
        permission: 'academic_planning.read',
        domain: 'academic-planning',
        resourceType: 'academicPlan',
        resourceId: 'plan',
      });
    });

    it('denies a legacy-authorized teacher when the permission is absent', async () => {
      permissionEnforcer.requireForInstitutionMembership.mockRejectedValue(
        new ForbiddenException('Access denied'),
      );

      await expect(service.findOne(actor, 'plan')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('does not evaluate permission when another teacher fails legacy ownership', async () => {
      await expect(
        service.findOne({ ...actor, profileId: 'other-teacher' }, 'plan'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(
        permissionEnforcer.requireForInstitutionMembership,
      ).not.toHaveBeenCalled();
    });

    it('enforces the same institution ADMIN permission after legacy scope allows', async () => {
      const admin = { ...actor, id: 'admin-user', role: Role.ADMIN };

      await expect(service.findOne(admin, 'plan')).resolves.toMatchObject({
        id: 'plan',
      });
      expect(
        permissionEnforcer.requireForInstitutionMembership,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          actor: admin,
          institutionId: 'institution',
          permission: 'academic_planning.read',
        }),
      );
    });

    it('does not evaluate permission for a cross-institution ADMIN', async () => {
      const admin = {
        ...actor,
        id: 'admin-user',
        role: Role.ADMIN,
        institutionId: 'other-institution',
      };

      await expect(service.findOne(admin, 'plan')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(
        permissionEnforcer.requireForInstitutionMembership,
      ).not.toHaveBeenCalled();
    });

    it('preserves SUPER_ADMIN as membership-enforcement not applicable', async () => {
      const superAdmin = { ...actor, role: Role.SUPER_ADMIN };
      permissionEnforcer.requireForInstitutionMembership.mockResolvedValue({
        decision: 'NOT_APPLICABLE',
        permission: 'academic_planning.read',
        legacyCapable: null,
        profileAwareCapable: null,
        reason: 'SUPER_ADMIN_NO_MEMBERSHIP',
      });

      await expect(service.findOne(superAdmin, 'plan')).resolves.toMatchObject({
        id: 'plan',
      });
    });

    it.each([Role.STUDENT, Role.REPRESENTATIVE])(
      'does not evaluate permission for legacy-denied %s',
      async (role) => {
        await expect(
          service.findOne({ ...actor, role }, 'plan'),
        ).rejects.toBeInstanceOf(NotFoundException);
        expect(
          permissionEnforcer.requireForInstitutionMembership,
        ).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['missing membership', new ForbiddenException('Access denied')],
      ['resolver error', new ForbiddenException('Access denied')],
    ])('fails closed for a teacher when %s', async (_reason, error) => {
      permissionEnforcer.requireForInstitutionMembership.mockRejectedValue(
        error,
      );

      await expect(service.findOne(actor, 'plan')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('retains the null-profile baseline path when enforcement allows', async () => {
      permissionEnforcer.requireForInstitutionMembership.mockResolvedValue({
        decision: 'ALLOWED',
        permission: 'academic_planning.read',
        legacyCapable: true,
        profileAwareCapable: true,
        permissionProfileKey: null,
      });

      await expect(service.findOne(actor, 'plan')).resolves.toMatchObject({
        id: 'plan',
      });
    });
  });
});
