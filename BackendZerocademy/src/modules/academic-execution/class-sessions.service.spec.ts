import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClassSessionStatus, Role } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ClassSessionsFoundationService } from './class-sessions-foundation.service';

const teacherA: AuthenticatedUser = {
  id: 'a',
  email: 'a@test',
  firstName: 'A',
  lastName: 'A',
  role: Role.TEACHER,
  profileId: 'teacher-a',
  institutionId: 'inst-a',
};
const teacherB: AuthenticatedUser = {
  ...teacherA,
  id: 'b',
  role: Role.TEACHER,
  profileId: 'teacher-b',
};
const superAdmin: AuthenticatedUser = {
  ...teacherA,
  id: 'super',
  role: Role.SUPER_ADMIN,
  profileId: 'super',
};
const adminA: AuthenticatedUser = {
  ...teacherA,
  id: 'admin-a',
  role: Role.ADMIN,
  profileId: 'admin-profile',
};
const student: AuthenticatedUser = {
  ...teacherA,
  id: 'student',
  role: Role.STUDENT,
  profileId: 'student',
};
const representative: AuthenticatedUser = {
  ...teacherA,
  id: 'representative',
  role: Role.REPRESENTATIVE,
  profileId: 'representative',
};

describe('ClassSessionsFoundationService read contract', () => {
  let service: ClassSessionsFoundationService;
  const assignment = {
    id: 'assignment-a',
    teacherId: 'teacher-a',
    institutionId: 'inst-a',
    academicPeriod: {
      status: 'ACTIVE',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    },
  };
  const prisma = {
    teacherAssignment: { findFirst: jest.fn() },
    institutionMembership: { findFirst: jest.fn() },
    lessonPlan: { findFirst: jest.fn() },
    classSession: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const logger = { log: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.teacherAssignment.findFirst.mockResolvedValue(assignment);
    prisma.institutionMembership.findFirst.mockResolvedValue(null);
    prisma.lessonPlan.findFirst.mockResolvedValue({ id: 'lesson-plan-a' });
    prisma.classSession.findMany.mockResolvedValue([
      { id: 'session-a1', teacherAssignmentId: 'assignment-a' },
      { id: 'session-a2', teacherAssignmentId: 'assignment-a' },
    ]);
    prisma.classSession.findFirst.mockResolvedValue({
      id: 'session-a1',
      teacherAssignmentId: 'assignment-a',
      lessonPlanId: null,
      status: 'SCHEDULED',
      scheduledDate: new Date('2026-06-15'),
      occurredOn: null,
    });
    prisma.classSession.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'created', ...data }),
    );
    prisma.classSession.update.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'session-a1',
        teacherAssignmentId: 'assignment-a',
        ...data,
      }),
    );
    service = new ClassSessionsFoundationService(
      prisma as unknown as PrismaService,
      logger as unknown as AppLoggerService,
    );
  });

  it('lets the owning teacher list only the requested assignment sessions', async () => {
    await expect(service.list(teacherA, 'assignment-a')).resolves.toHaveLength(
      2,
    );
    expect(prisma.classSession.findMany).toHaveBeenCalledWith({
      where: { teacherAssignmentId: 'assignment-a' },
      orderBy: [
        { scheduledDate: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'asc' },
      ],
    });
  });
  it('lets the owning teacher read a correctly nested session', async () => {
    await expect(
      service.one(teacherA, 'assignment-a', 'session-a1'),
    ).resolves.toMatchObject({ id: 'session-a1' });
    expect(prisma.classSession.findFirst).toHaveBeenCalledWith({
      where: { id: 'session-a1', teacherAssignmentId: 'assignment-a' },
    });
  });
  it.each([
    ['list', () => service.list(teacherB, 'assignment-a')],
    ['detail', () => service.one(teacherB, 'assignment-a', 'session-a1')],
  ])('denies another teacher %s access', async (_name, invoke) => {
    await expect(invoke()).rejects.toBeInstanceOf(NotFoundException);
  });
  it('does not resolve a session through a different assignment for an otherwise authorized reader', async () => {
    prisma.teacherAssignment.findFirst.mockResolvedValue({
      ...assignment,
      id: 'assignment-b',
    });
    prisma.classSession.findFirst.mockResolvedValue(null);
    await expect(
      service.one(superAdmin, 'assignment-b', 'session-a1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.classSession.findFirst).toHaveBeenCalledWith({
      where: { id: 'session-a1', teacherAssignmentId: 'assignment-b' },
    });
  });
  it('lets an ADMIN list and read sessions in its JWT institution scope', async () => {
    await expect(service.list(adminA, 'assignment-a')).resolves.toHaveLength(2);
    await expect(
      service.one(adminA, 'assignment-a', 'session-a1'),
    ).resolves.toMatchObject({ id: 'session-a1' });
    expect(prisma.institutionMembership.findFirst).not.toHaveBeenCalled();
  });
  it.each(['list', 'detail'] as const)(
    'denies an ADMIN %s outside its institution scope',
    async (operation) => {
      prisma.teacherAssignment.findFirst.mockResolvedValue({
        ...assignment,
        id: 'assignment-b',
        institutionId: 'inst-b',
      });
      await expect(
        operation === 'list'
          ? service.list(adminA, 'assignment-b')
          : service.one(adminA, 'assignment-b', 'session-b'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.institutionMembership.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'admin-a',
          institutionId: 'inst-b',
          role: 'ADMIN',
          isActive: true,
        },
        select: { id: true },
      });
    },
  );
  it('lets SUPER_ADMIN list and read correctly nested sessions', async () => {
    await expect(
      service.list(superAdmin, 'assignment-a'),
    ).resolves.toHaveLength(2);
    await expect(
      service.one(superAdmin, 'assignment-a', 'session-a1'),
    ).resolves.toMatchObject({ id: 'session-a1' });
  });
  it.each([student, representative])('denies %s list access', async (actor) => {
    await expect(service.list(actor, 'assignment-a')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it.each([student, representative])(
    'denies %s detail access',
    async (actor) => {
      await expect(
        service.one(actor, 'assignment-a', 'session-a1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );
  it('scopes the list query to the requested teacher assignment', async () => {
    const sessions = await service.list(teacherA, 'assignment-a');
    expect(sessions.map((session) => session.teacherAssignmentId)).toEqual([
      'assignment-a',
      'assignment-a',
    ]);
    expect(prisma.classSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { teacherAssignmentId: 'assignment-a' },
      }),
    );
  });
  it('orders scheduled sessions chronologically, then by creation time, with undated sessions last', async () => {
    await service.list(teacherA, 'assignment-a');
    expect(prisma.classSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { scheduledDate: { sort: 'asc', nulls: 'last' } },
          { createdAt: 'asc' },
        ],
      }),
    );
  });
  it('lets the owning teacher create using the scoped assignment', async () => {
    await expect(
      service.create(teacherA, {
        teacherAssignmentId: 'assignment-a',
        scheduledDate: '2026-06-15',
      }),
    ).resolves.toMatchObject({ teacherAssignmentId: 'assignment-a' });
  });
  it('logs CLASS_SESSION_CREATED after a successful class session persistence', async () => {
    await service.create(teacherA, {
      teacherAssignmentId: 'assignment-a',
      scheduledDate: '2026-06-15',
    });

    expect(prisma.classSession.create.mock.invocationCallOrder[0]).toBeLessThan(
      logger.log.mock.invocationCallOrder[0],
    );
    expect(logger.log).toHaveBeenCalledWith({
      context: 'ClassSessionsFoundationService',
      event: 'CLASS_SESSION_CREATED',
      message: 'CLASS_SESSION_CREATED',
      userId: 'a',
      metadata: {
        classSessionId: 'created',
        teacherAssignmentId: 'assignment-a',
        status: ClassSessionStatus.SCHEDULED,
      },
    });
    expect(logger.log).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: 'CLASS_SESSION_UPDATED' }),
    );
  });
  it('does not log CLASS_SESSION_CREATED when class session persistence fails', async () => {
    prisma.classSession.create.mockRejectedValue(
      new Error('Class session persistence failed'),
    );

    await expect(
      service.create(teacherA, {
        teacherAssignmentId: 'assignment-a',
        scheduledDate: '2026-06-15',
      }),
    ).rejects.toThrow('Class session persistence failed');

    expect(logger.log).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: 'CLASS_SESSION_CREATED' }),
    );
  });
  it.each([teacherB, adminA, superAdmin, student, representative])(
    'denies %s create access',
    async (actor) => {
      await expect(
        service.create(actor, {
          teacherAssignmentId: 'assignment-a',
          scheduledDate: '2026-06-15',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );
  it('rejects class session creation during a closed academic period before persistence', async () => {
    prisma.teacherAssignment.findFirst.mockResolvedValue({
      ...assignment,
      academicPeriod: { ...assignment.academicPeriod, status: 'CLOSED' },
    });

    await expect(
      service.create(teacherA, {
        teacherAssignmentId: 'assignment-a',
        scheduledDate: '2026-06-15',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.classSession.create).not.toHaveBeenCalled();
  });
  it('rejects class session creation during an archived academic period before persistence', async () => {
    prisma.teacherAssignment.findFirst.mockResolvedValue({
      ...assignment,
      academicPeriod: { ...assignment.academicPeriod, status: 'ARCHIVED' },
    });

    await expect(
      service.create(teacherA, {
        teacherAssignmentId: 'assignment-a',
        scheduledDate: '2026-06-15',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.classSession.create).not.toHaveBeenCalled();
  });
  it('rejects class session creation with a scheduled date before the academic period', async () => {
    await expect(
      service.create(teacherA, {
        teacherAssignmentId: 'assignment-a',
        scheduledDate: '2025-12-31',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.classSession.create).not.toHaveBeenCalled();
  });
  it('lets the owning teacher update a correctly nested session', async () => {
    await expect(
      service.update(teacherA, 'assignment-a', 'session-a1', {}),
    ).resolves.toMatchObject({ id: 'session-a1' });
  });
  it('logs CLASS_SESSION_UPDATED after a successful class session persistence', async () => {
    await service.update(teacherA, 'assignment-a', 'session-a1', {});

    expect(prisma.classSession.update.mock.invocationCallOrder[0]).toBeLessThan(
      logger.log.mock.invocationCallOrder[0],
    );
    expect(logger.log).toHaveBeenCalledWith({
      context: 'ClassSessionsFoundationService',
      event: 'CLASS_SESSION_UPDATED',
      message: 'CLASS_SESSION_UPDATED',
      userId: 'a',
      metadata: {
        classSessionId: 'session-a1',
        teacherAssignmentId: 'assignment-a',
        status: ClassSessionStatus.SCHEDULED,
      },
    });
    expect(logger.log).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: 'CLASS_SESSION_CREATED' }),
    );
  });
  it('does not log CLASS_SESSION_UPDATED when class session persistence fails', async () => {
    prisma.classSession.update.mockRejectedValue(
      new Error('Class session persistence failed'),
    );

    await expect(
      service.update(teacherA, 'assignment-a', 'session-a1', {}),
    ).rejects.toThrow('Class session persistence failed');

    expect(logger.log).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: 'CLASS_SESSION_UPDATED' }),
    );
  });
  it('rejects a completed PATCH when the final merged state has no occurrence date', async () => {
    await expect(
      service.update(teacherA, 'assignment-a', 'session-a1', {
        status: ClassSessionStatus.COMPLETED,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.classSession.update).not.toHaveBeenCalled();
  });
  it('persists a completed PATCH when the final merged state has an occurrence date', async () => {
    await expect(
      service.update(teacherA, 'assignment-a', 'session-a1', {
        status: ClassSessionStatus.COMPLETED,
        occurredOn: '2026-06-16',
      }),
    ).resolves.toMatchObject({
      status: ClassSessionStatus.COMPLETED,
      occurredOn: new Date('2026-06-16T00:00:00.000Z'),
    });

    expect(prisma.classSession.update).toHaveBeenCalledWith({
      where: { id: 'session-a1' },
      data: {
        status: ClassSessionStatus.COMPLETED,
        scheduledDate: new Date('2026-06-15T00:00:00.000Z'),
        occurredOn: new Date('2026-06-16T00:00:00.000Z'),
        lessonPlanId: null,
      },
    });
  });
  it('preserves omitted fields when PATCH changes only the scheduled date', async () => {
    prisma.classSession.findFirst.mockResolvedValue({
      id: 'session-a1',
      teacherAssignmentId: 'assignment-a',
      lessonPlanId: 'lesson-plan-a',
      status: ClassSessionStatus.SCHEDULED,
      scheduledDate: new Date('2026-06-15T00:00:00.000Z'),
      occurredOn: null,
    });

    await service.update(teacherA, 'assignment-a', 'session-a1', {
      scheduledDate: '2026-06-16',
    });

    expect(prisma.classSession.update).toHaveBeenCalledWith({
      where: { id: 'session-a1' },
      data: {
        status: ClassSessionStatus.SCHEDULED,
        scheduledDate: new Date('2026-06-16T00:00:00.000Z'),
        occurredOn: null,
        lessonPlanId: 'lesson-plan-a',
      },
    });
  });
  it('preserves the lesson plan relation when lessonPlanId is omitted from PATCH', async () => {
    prisma.classSession.findFirst.mockResolvedValue({
      id: 'session-a1',
      teacherAssignmentId: 'assignment-a',
      lessonPlanId: 'lesson-plan-a',
      status: ClassSessionStatus.SCHEDULED,
      scheduledDate: new Date('2026-06-15T00:00:00.000Z'),
      occurredOn: null,
    });

    await service.update(teacherA, 'assignment-a', 'session-a1', {});

    expect(prisma.classSession.update).toHaveBeenCalledWith({
      where: { id: 'session-a1' },
      data: {
        status: ClassSessionStatus.SCHEDULED,
        scheduledDate: new Date('2026-06-15T00:00:00.000Z'),
        occurredOn: null,
        lessonPlanId: 'lesson-plan-a',
      },
    });
  });
  it('clears the lesson plan relation when lessonPlanId is explicitly null in PATCH', async () => {
    prisma.classSession.findFirst.mockResolvedValue({
      id: 'session-a1',
      teacherAssignmentId: 'assignment-a',
      lessonPlanId: 'lesson-plan-a',
      status: ClassSessionStatus.SCHEDULED,
      scheduledDate: new Date('2026-06-15T00:00:00.000Z'),
      occurredOn: null,
    });

    await service.update(teacherA, 'assignment-a', 'session-a1', {
      lessonPlanId: null,
    });

    expect(prisma.classSession.update).toHaveBeenCalledWith({
      where: { id: 'session-a1' },
      data: {
        status: ClassSessionStatus.SCHEDULED,
        scheduledDate: new Date('2026-06-15T00:00:00.000Z'),
        occurredOn: null,
        lessonPlanId: null,
      },
    });
  });
  it('replaces the lesson plan with one compatible with the class session teacher assignment', async () => {
    prisma.classSession.findFirst.mockResolvedValue({
      id: 'session-a1',
      teacherAssignmentId: 'assignment-a',
      lessonPlanId: 'lesson-plan-a1',
      status: ClassSessionStatus.SCHEDULED,
      scheduledDate: new Date('2026-06-15T00:00:00.000Z'),
      occurredOn: null,
    });
    prisma.lessonPlan.findFirst.mockResolvedValue({ id: 'lesson-plan-a2' });

    await expect(
      service.update(teacherA, 'assignment-a', 'session-a1', {
        lessonPlanId: 'lesson-plan-a2',
      }),
    ).resolves.toMatchObject({
      teacherAssignmentId: 'assignment-a',
      lessonPlanId: 'lesson-plan-a2',
    });

    expect(prisma.lessonPlan.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'lesson-plan-a2',
        academicUnit: {
          academicPlan: { teacherAssignmentId: 'assignment-a' },
        },
      },
      select: { id: true },
    });
    expect(prisma.classSession.update).toHaveBeenCalledWith({
      where: { id: 'session-a1' },
      data: {
        status: ClassSessionStatus.SCHEDULED,
        scheduledDate: new Date('2026-06-15T00:00:00.000Z'),
        occurredOn: null,
        lessonPlanId: 'lesson-plan-a2',
      },
    });
  });
  it('rejects a lesson plan replacement from another teacher assignment before persistence', async () => {
    prisma.classSession.findFirst.mockResolvedValue({
      id: 'session-a1',
      teacherAssignmentId: 'assignment-a',
      lessonPlanId: 'lesson-plan-a1',
      status: ClassSessionStatus.SCHEDULED,
      scheduledDate: new Date('2026-06-15T00:00:00.000Z'),
      occurredOn: null,
    });
    prisma.lessonPlan.findFirst.mockResolvedValue(null);

    await expect(
      service.update(teacherA, 'assignment-a', 'session-a1', {
        lessonPlanId: 'lesson-plan-b',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.lessonPlan.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'lesson-plan-b',
        academicUnit: {
          academicPlan: { teacherAssignmentId: 'assignment-a' },
        },
      },
      select: { id: true },
    });
    expect(prisma.classSession.update).not.toHaveBeenCalled();
  });
  it('does not resolve a class session through a different teacher assignment during PATCH', async () => {
    prisma.teacherAssignment.findFirst.mockResolvedValue({
      ...assignment,
      id: 'assignment-b',
      teacherId: 'teacher-a',
    });
    prisma.classSession.findFirst.mockResolvedValue(null);

    await expect(
      service.update(teacherA, 'assignment-b', 'session-a1', {}),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.classSession.findFirst).toHaveBeenCalledWith({
      where: { id: 'session-a1', teacherAssignmentId: 'assignment-b' },
    });
    expect(prisma.classSession.update).not.toHaveBeenCalled();
  });
  it.each([teacherB, adminA, superAdmin, student, representative])(
    'denies %s update access',
    async (actor) => {
      await expect(
        service.update(actor, 'assignment-a', 'session-a1', {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );
});
