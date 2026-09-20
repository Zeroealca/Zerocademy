/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
  let prisma: {
    teacherAssignment: { findFirst: jest.Mock };
    academicTerm: { findUnique: jest.Mock };
    academicPlan: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
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
});
