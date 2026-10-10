import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AcademicPeriodStatus,
  OfficialStudyPlanValuePolicy,
  Role,
} from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { TimetablesService } from './timetables.service';

jest.mock('../../common/rbac/academic-scope.util', () => ({
  assertActorCanAccessInstitution: jest.fn().mockResolvedValue(undefined),
}));

const admin: AuthenticatedUser = {
  id: 'admin-a',
  email: 'admin@example.test',
  firstName: 'Admin',
  lastName: 'A',
  role: Role.ADMIN,
  profileId: 'admin-profile',
  institutionId: 'institution-a',
};
const assignment = {
  id: 'assignment-a',
  institutionId: 'institution-a',
  academicPeriodId: 'period-a',
  courseId: 'course-a',
  subjectId: 'subject-a',
  teacherId: 'teacher-a',
  teachingLoad: null,
  course: {
    id: 'course-a',
    name: '8vo A',
    gradeLevelId: 'grade-a',
    gradeLevel: { code: 'EGB-8' },
  },
  subject: {
    id: 'subject-a',
    code: 'MATEMATICA',
    name: 'Matemática',
    institutionId: null,
  },
  teacher: { id: 'teacher-a', user: { firstName: 'Ana', lastName: 'Docente' } },
};
const plan = {
  id: 'adoption-a',
  institutionId: 'institution-a',
  academicPeriodId: 'period-a',
  officialStudyPlanId: 'plan-a',
  applicabilityKey: 'ORDINARY_EGB',
  officialStudyPlan: {
    id: 'plan-a',
    code: 'EC_ORDINARY_EGB',
    version: '2023-00008-A',
    sourceReference: 'MINEDUC-2023',
    sourceUrl: 'https://example.test/source',
    entries: [
      {
        gradeLevelId: 'grade-a',
        subjectId: 'subject-a',
        valuePolicy: OfficialStudyPlanValuePolicy.MINIMUM,
        defaultWeeklyPeriods: null,
        minimumWeeklyPeriods: 6,
      },
    ],
  },
};

describe('TimetablesService teaching-load configuration', () => {
  const prisma = {
    academicPeriod: { findUnique: jest.fn() },
    teacherAssignment: {
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    institutionStudyPlanAdoption: { findMany: jest.fn() },
    teachingLoad: { upsert: jest.fn() },
    course: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const logger = { log: jest.fn() };
  const permissionEnforcer = {
    requireForInstitutionMembership: jest.fn().mockResolvedValue(undefined),
  };
  let service: TimetablesService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.teacherAssignment.findUnique.mockResolvedValue(assignment);
    prisma.academicPeriod.findUnique.mockResolvedValue({
      institutionId: 'institution-a',
      status: AcademicPeriodStatus.PLANNED,
    });
    prisma.institutionStudyPlanAdoption.findMany.mockResolvedValue([plan]);
    prisma.teachingLoad.upsert.mockResolvedValue({
      id: 'load-a',
      teacherAssignmentId: 'assignment-a',
      weeklyPeriods: 6,
    });
    prisma.$transaction.mockResolvedValue({
      id: 'load-a',
      teacherAssignmentId: 'assignment-a',
      weeklyPeriods: 6,
    });
    service = new TimetablesService(
      prisma as unknown as PrismaService,
      logger as unknown as AppLoggerService,
      permissionEnforcer as never,
    );
  });

  it('allows an ADMIN to configure a valid official minimum without mutating reference data', async () => {
    await expect(
      service.configureTeachingLoad(admin, 'assignment-a', {
        weeklyPeriods: 6,
      }),
    ).resolves.toMatchObject({ weeklyPeriods: 6, validationStatus: 'VALID' });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.institutionStudyPlanAdoption.findMany).toHaveBeenCalled();
  });

  it('rejects a configured value below the official minimum', async () => {
    await expect(
      service.configureTeachingLoad(admin, 'assignment-a', {
        weeklyPeriods: 5,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.teachingLoad.upsert).not.toHaveBeenCalled();
  });

  it.each([Role.TEACHER, Role.STUDENT, Role.REPRESENTATIVE, Role.SUPER_ADMIN])(
    'does not allow %s to configure an institutional load',
    async (role) => {
      await expect(
        service.configureTeachingLoad({ ...admin, role }, 'assignment-a', {
          weeklyPeriods: 6,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );

  it.each([AcademicPeriodStatus.CLOSED, AcademicPeriodStatus.ARCHIVED])(
    'rejects %s period mutations',
    async (status) => {
      prisma.academicPeriod.findUnique.mockResolvedValue({
        institutionId: 'institution-a',
        status,
      });
      await expect(
        service.configureTeachingLoad(admin, 'assignment-a', {
          weeklyPeriods: 6,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it('reports unconfigured assignments and required subjects without staffing as readiness errors', async () => {
    prisma.teacherAssignment.findMany.mockResolvedValue([assignment]);
    prisma.course.findMany.mockResolvedValue([
      { id: 'course-a', gradeLevelId: 'grade-a' },
    ]);
    prisma.$transaction.mockResolvedValue([
      [assignment],
      [plan],
      [{ id: 'course-a', gradeLevelId: 'grade-a' }],
    ]);
    const result = await service.validateConfiguration(
      admin,
      'institution-a',
      'period-a',
    );
    expect(result.configurationReady).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'UNCONFIGURED' }),
      ]),
    );
  });

  it('allows a custom subject to be configured without an official entry', async () => {
    prisma.teacherAssignment.findUnique.mockResolvedValue({
      ...assignment,
      subject: { ...assignment.subject, institutionId: 'institution-a' },
    });
    prisma.institutionStudyPlanAdoption.findMany.mockResolvedValue([]);
    await expect(
      service.configureTeachingLoad(admin, 'assignment-a', {
        weeklyPeriods: 2,
      }),
    ).resolves.toMatchObject({ validationStatus: 'CUSTOM_SUBJECT' });
  });
});
