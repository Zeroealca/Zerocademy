import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { LessonPlansService } from './lesson-plans.service';

const teacher: AuthenticatedUser = {
  id: 'teacher-user',
  email: 'teacher@example.test',
  firstName: 'Ada',
  lastName: 'Teacher',
  role: Role.TEACHER,
  profileId: 'teacher-profile',
  institutionId: 'institution-a',
};

const admin: AuthenticatedUser = {
  ...teacher,
  id: 'admin-user',
  role: Role.ADMIN,
  profileId: 'admin-profile',
};

const planContext = (overrides?: {
  institutionId?: string | null;
  teacherId?: string;
}) => ({
  teacherAssignment: {
    teacherId: overrides?.teacherId ?? 'teacher-profile',
    institutionId: overrides?.institutionId ?? 'institution-a',
  },
});

const aggregateLesson = {
  id: 'lesson-a',
  academicUnitId: 'unit-a',
  title: 'Introducción a fracciones',
  lessonDate: new Date('2026-09-01T00:00:00.000Z'),
  durationMinutes: 45,
  objectives: null,
  introduction: null,
  development: null,
  closure: null,
  resources: null,
  evaluationStrategy: null,
  notes: null,
  position: 1,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  academicUnit: { title: 'Números racionales' },
};

type PrismaMock = {
  academicPlan: { findUnique: jest.Mock };
  institutionMembership: { findFirst: jest.Mock };
  lessonPlan: { findMany: jest.Mock };
};

describe('LessonPlansService aggregate academic-plan read', () => {
  let service: LessonPlansService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = {
      academicPlan: { findUnique: jest.fn().mockResolvedValue(planContext()) },
      institutionMembership: { findFirst: jest.fn().mockResolvedValue(null) },
      lessonPlan: { findMany: jest.fn().mockResolvedValue([aggregateLesson]) },
    };
    service = new LessonPlansService(
      prisma as unknown as PrismaService,
      { log: jest.fn() } as unknown as AppLoggerService,
    );
  });

  it('returns only the requested plan lessons in unit then lesson position order for the owning teacher', async () => {
    await expect(
      service.listForAcademicPlan(teacher, 'plan-a'),
    ).resolves.toEqual([aggregateLesson]);
    expect(prisma.lessonPlan.findMany).toHaveBeenCalledWith({
      where: { academicUnit: { academicPlanId: 'plan-a' } },
      include: { academicUnit: { select: { title: true } } },
      orderBy: [
        { academicUnit: { position: 'asc' } },
        { position: 'asc' },
      ],
    });
  });

  it('does not let another teacher read the aggregate', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue(
      planContext({ teacherId: 'other-teacher-profile' }),
    );

    await expect(
      service.listForAcademicPlan(teacher, 'plan-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lessonPlan.findMany).not.toHaveBeenCalled();
  });

  it('lets an ADMIN read an academic plan in their institution', async () => {
    await expect(
      service.listForAcademicPlan(admin, 'plan-a'),
    ).resolves.toHaveLength(1);
  });

  it('does not let a cross-institution ADMIN read the aggregate', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue(
      planContext({ institutionId: 'institution-b' }),
    );

    await expect(
      service.listForAcademicPlan(admin, 'plan-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lessonPlan.findMany).not.toHaveBeenCalled();
  });

  it('lets a SUPER_ADMIN read the aggregate', async () => {
    await expect(
      service.listForAcademicPlan({ ...teacher, role: Role.SUPER_ADMIN }, 'plan-a'),
    ).resolves.toHaveLength(1);
  });

  it.each([Role.STUDENT, Role.REPRESENTATIVE])(
    'does not let %s read the aggregate',
    async (role) => {
      await expect(
        service.listForAcademicPlan({ ...teacher, role }, 'plan-a'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.lessonPlan.findMany).not.toHaveBeenCalled();
    },
  );

  it('keeps the aggregate readable for published and historical plans', async () => {
    await expect(
      service.listForAcademicPlan(teacher, 'published-plan'),
    ).resolves.toHaveLength(1);
    await expect(
      service.listForAcademicPlan(teacher, 'closed-period-plan'),
    ).resolves.toHaveLength(1);
  });

  it('does not expose lessons when the requested academic plan does not exist', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue(null);

    await expect(
      service.listForAcademicPlan(teacher, 'missing-plan'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lessonPlan.findMany).not.toHaveBeenCalled();
  });
});
