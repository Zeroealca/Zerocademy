import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
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
    classSession: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.teacherAssignment.findFirst.mockResolvedValue(assignment);
    prisma.institutionMembership.findFirst.mockResolvedValue(null);
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
      { log: jest.fn() } as unknown as AppLoggerService,
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
  it('lets the owning teacher update a correctly nested session', async () => {
    await expect(
      service.update(teacherA, 'assignment-a', 'session-a1', {}),
    ).resolves.toMatchObject({ id: 'session-a1' });
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
