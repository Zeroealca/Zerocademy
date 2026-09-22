import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AcademicPlanStatus, Role } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { LessonPlansService } from './lesson-plans.service';

const teacher: AuthenticatedUser = {
  id: 'teacher-a-user',
  email: 'teacher-a@example.test',
  firstName: 'Ada',
  lastName: 'Teacher',
  role: Role.TEACHER,
  profileId: 'teacher-a-profile',
  institutionId: 'institution-a',
};
const admin: AuthenticatedUser = {
  ...teacher,
  id: 'admin-user',
  role: Role.ADMIN,
  profileId: 'admin-profile',
};
const student: AuthenticatedUser = {
  ...teacher,
  id: 'student-user',
  role: Role.STUDENT,
  profileId: 'student-profile',
};
const representative: AuthenticatedUser = {
  ...teacher,
  id: 'representative-user',
  role: Role.REPRESENTATIVE,
  profileId: 'representative-profile',
};
const superAdmin: AuthenticatedUser = {
  ...teacher,
  id: 'super-admin-user',
  role: Role.SUPER_ADMIN,
  profileId: 'super-admin-profile',
  institutionId: 'other-institution',
};

type PrismaMock = {
  academicUnit: { findFirst: jest.Mock };
  lessonPlan: {
    aggregate: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
  $transaction: jest.Mock;
};
type TransactionOperation = (transaction: PrismaMock) => Promise<unknown>;

function unitContext(
  planId = 'plan-a',
  unitId = 'unit-a',
  teacherId = 'teacher-a-profile',
  status = AcademicPlanStatus.DRAFT,
  periodStatus = 'ACTIVE',
) {
  return {
    id: unitId,
    academicPlanId: planId,
    startDate: null,
    endDate: null,
    academicPlan: {
      status,
      teacherAssignment: {
        teacherId,
        institutionId: 'institution-a',
        academicPeriod: { status: periodStatus },
      },
    },
  };
}

describe('LessonPlansService', () => {
  let service: LessonPlansService;
  let prisma: PrismaMock;
  let logger: { log: jest.Mock };

  beforeEach(() => {
    prisma = {
      academicUnit: { findFirst: jest.fn().mockResolvedValue(unitContext()) },
      lessonPlan: {
        aggregate: jest.fn().mockResolvedValue({ _max: { position: null } }),
        create: jest.fn().mockResolvedValue({
          id: 'lesson-c',
          academicUnitId: 'unit-a',
          position: 1,
          title: 'Practice lesson',
        }),
        delete: jest.fn(),
        findFirst: jest.fn().mockResolvedValue({
          id: 'lesson-a',
          academicUnitId: 'unit-a',
          position: 1,
          title: 'Opening lesson',
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'lesson-b',
            academicUnitId: 'unit-a',
            position: 1,
            title: 'Second lesson',
          },
          {
            id: 'lesson-a',
            academicUnitId: 'unit-a',
            position: 2,
            title: 'Opening lesson',
          },
        ]),
        update: jest.fn().mockResolvedValue({
          id: 'lesson-a',
          academicUnitId: 'unit-a',
          position: 1,
          title: 'Updated lesson',
        }),
      },
      $transaction: jest.fn((operation: TransactionOperation) =>
        operation(prisma),
      ),
    };
    logger = { log: jest.fn() };
    service = new LessonPlansService(
      prisma as unknown as PrismaService,
      logger as unknown as AppLoggerService,
    );
  });

  it('lists ordered lesson plans for an authorized teacher in their own unit', async () => {
    await expect(service.list(teacher, 'plan-a', 'unit-a')).resolves.toEqual([
      {
        id: 'lesson-b',
        academicUnitId: 'unit-a',
        position: 1,
        title: 'Second lesson',
      },
      {
        id: 'lesson-a',
        academicUnitId: 'unit-a',
        position: 2,
        title: 'Opening lesson',
      },
    ]);
    expect(prisma.lessonPlan.findMany).toHaveBeenCalledWith({
      where: { academicUnitId: 'unit-a' },
      orderBy: { position: 'asc' },
    });
  });

  it('reads a lesson plan within the teacher owned plan and unit', async () => {
    await expect(
      service.one(teacher, 'plan-a', 'unit-a', 'lesson-a'),
    ).resolves.toMatchObject({
      id: 'lesson-a',
      academicUnitId: 'unit-a',
      title: 'Opening lesson',
    });
    expect(prisma.lessonPlan.findFirst).toHaveBeenCalledWith({
      where: { id: 'lesson-a', academicUnitId: 'unit-a' },
    });
  });

  it('does not let another teacher read lesson plans', async () => {
    prisma.academicUnit.findFirst.mockResolvedValue(
      unitContext('plan-a', 'unit-a', 'teacher-b-profile'),
    );

    await expect(
      service.list(teacher, 'plan-a', 'unit-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lessonPlan.findMany).not.toHaveBeenCalled();
  });

  it('does not resolve a unit through the wrong academic plan', async () => {
    prisma.academicUnit.findFirst.mockResolvedValue(null);

    await expect(
      service.one(teacher, 'plan-a', 'unit-b', 'lesson-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.academicUnit.findFirst).toHaveBeenCalledWith({
      where: { id: 'unit-b', academicPlanId: 'plan-a' },
      include: {
        academicPlan: {
          include: { teacherAssignment: { include: { academicPeriod: true } } },
        },
      },
    });
    expect(prisma.lessonPlan.findFirst).not.toHaveBeenCalled();
  });

  it('does not resolve a lesson plan through a different academic unit', async () => {
    prisma.academicUnit.findFirst.mockResolvedValue(
      unitContext('plan-a', 'unit-b'),
    );
    prisma.lessonPlan.findFirst.mockResolvedValue(null);

    await expect(
      service.one(teacher, 'plan-a', 'unit-b', 'lesson-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lessonPlan.findFirst).toHaveBeenCalledWith({
      where: { id: 'lesson-a', academicUnitId: 'unit-b' },
    });
  });

  it('lets an ADMIN read lesson plans in the authorized institution', async () => {
    await expect(service.list(admin, 'plan-a', 'unit-a')).resolves.toHaveLength(
      2,
    );
  });

  it('does not let a STUDENT read lesson plans', async () => {
    await expect(
      service.list(student, 'plan-a', 'unit-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lessonPlan.findMany).not.toHaveBeenCalled();
  });

  it('does not let a REPRESENTATIVE read lesson plans', async () => {
    await expect(
      service.list(representative, 'plan-a', 'unit-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lessonPlan.findMany).not.toHaveBeenCalled();
  });

  it('keeps lessons readable on published plans and closed academic periods', async () => {
    prisma.academicUnit.findFirst
      .mockResolvedValueOnce(
        unitContext(
          'plan-a',
          'unit-a',
          'teacher-a-profile',
          AcademicPlanStatus.PUBLISHED,
        ),
      )
      .mockResolvedValueOnce(
        unitContext(
          'plan-a',
          'unit-a',
          'teacher-a-profile',
          AcademicPlanStatus.DRAFT,
          'CLOSED',
        ),
      );

    await expect(
      service.list(teacher, 'plan-a', 'unit-a'),
    ).resolves.toHaveLength(2);
    await expect(
      service.list(teacher, 'plan-a', 'unit-a'),
    ).resolves.toHaveLength(2);
  });

  it('creates a lesson in a teacher owned unit with a contained calendar date', async () => {
    prisma.academicUnit.findFirst.mockResolvedValue({
      ...unitContext(),
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-09-30T00:00:00.000Z'),
    });

    await expect(
      service.create(teacher, 'plan-a', 'unit-a', {
        title: ' Practice lesson ',
        lessonDate: '2026-09-15',
        durationMinutes: 45,
        objectives: ' Practice objective ',
      }),
    ).resolves.toMatchObject({
      id: 'lesson-c',
      academicUnitId: 'unit-a',
      position: 1,
    });
    expect(prisma.lessonPlan.create).toHaveBeenCalledWith({
      data: {
        academicUnitId: 'unit-a',
        title: 'Practice lesson',
        lessonDate: new Date('2026-09-15T00:00:00.000Z'),
        durationMinutes: 45,
        position: 1,
        objectives: 'Practice objective',
      },
    });
    expect(logger.log).toHaveBeenCalledWith({
      context: 'LessonPlansService',
      event: 'LESSON_PLAN_CREATED',
      message: 'LESSON_PLAN_CREATED',
      userId: teacher.id,
      metadata: { academicUnitId: 'unit-a', lessonPlanId: 'lesson-c' },
    });
  });

  it('appends a created lesson after the current highest position', async () => {
    prisma.lessonPlan.aggregate.mockResolvedValue({ _max: { position: 3 } });
    prisma.lessonPlan.create.mockResolvedValue({
      id: 'lesson-d',
      academicUnitId: 'unit-a',
      position: 4,
      title: 'Fourth lesson',
    });

    await service.create(teacher, 'plan-a', 'unit-a', {
      title: 'Fourth lesson',
      lessonDate: '2026-09-15',
    });

    expect(prisma.lessonPlan.create).toHaveBeenCalledWith({
      data: {
        academicUnitId: 'unit-a',
        title: 'Fourth lesson',
        lessonDate: new Date('2026-09-15T00:00:00.000Z'),
        durationMinutes: undefined,
        position: 4,
      },
    });
  });

  it('does not create a lesson in another teacher’s planning context', async () => {
    prisma.academicUnit.findFirst.mockResolvedValue(
      unitContext('plan-a', 'unit-a', 'teacher-b-profile'),
    );

    await expect(
      service.create(teacher, 'plan-a', 'unit-a', {
        title: 'Practice lesson',
        lessonDate: '2026-09-15',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lessonPlan.create).not.toHaveBeenCalled();
    expect(logger.log).not.toHaveBeenCalled();
  });

  it.each([
    ['published plan', AcademicPlanStatus.PUBLISHED, 'ACTIVE'],
    ['closed academic period', AcademicPlanStatus.DRAFT, 'CLOSED'],
  ])(
    'does not create a lesson for a %s',
    async (_scenario, status, periodStatus) => {
      prisma.academicUnit.findFirst.mockResolvedValue(
        unitContext(
          'plan-a',
          'unit-a',
          'teacher-a-profile',
          status,
          periodStatus,
        ),
      );

      await expect(
        service.create(teacher, 'plan-a', 'unit-a', {
          title: 'Practice lesson',
          lessonDate: '2026-09-15',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.lessonPlan.create).not.toHaveBeenCalled();
    },
  );

  it('updates editable lesson content without changing its parent or position', async () => {
    await expect(
      service.update(teacher, 'plan-a', 'unit-a', 'lesson-a', {
        title: ' Updated lesson ',
        durationMinutes: 60,
        development: ' Guided practice ',
      }),
    ).resolves.toMatchObject({ id: 'lesson-a', academicUnitId: 'unit-a' });
    expect(prisma.lessonPlan.update).toHaveBeenCalledWith({
      where: { id: 'lesson-a' },
      data: {
        title: 'Updated lesson',
        durationMinutes: 60,
        development: 'Guided practice',
      },
    });
    expect(logger.log).toHaveBeenCalledWith({
      context: 'LessonPlansService',
      event: 'LESSON_PLAN_UPDATED',
      message: 'LESSON_PLAN_UPDATED',
      userId: teacher.id,
      metadata: { academicUnitId: 'unit-a', lessonPlanId: 'lesson-a' },
    });
  });

  it('does not update a lesson through another academic unit', async () => {
    prisma.academicUnit.findFirst.mockResolvedValue(
      unitContext('plan-a', 'unit-b'),
    );
    prisma.lessonPlan.findFirst.mockResolvedValue(null);

    await expect(
      service.update(teacher, 'plan-a', 'unit-b', 'lesson-a', {
        title: 'Updated lesson',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lessonPlan.update).not.toHaveBeenCalled();
  });

  it('does not update another teacher’s lesson', async () => {
    prisma.academicUnit.findFirst.mockResolvedValue(
      unitContext('plan-a', 'unit-a', 'teacher-b-profile'),
    );

    await expect(
      service.update(teacher, 'plan-a', 'unit-a', 'lesson-a', {
        title: 'Updated lesson',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lessonPlan.update).not.toHaveBeenCalled();
  });

  it.each([
    ['published plan', AcademicPlanStatus.PUBLISHED, 'ACTIVE'],
    ['closed academic period', AcademicPlanStatus.DRAFT, 'CLOSED'],
  ])(
    'does not update a lesson for a %s',
    async (_scenario, status, periodStatus) => {
      prisma.academicUnit.findFirst.mockResolvedValue(
        unitContext(
          'plan-a',
          'unit-a',
          'teacher-a-profile',
          status,
          periodStatus,
        ),
      );

      await expect(
        service.update(teacher, 'plan-a', 'unit-a', 'lesson-a', {
          title: 'Updated lesson',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.lessonPlan.update).not.toHaveBeenCalled();
    },
  );

  it.each(['2026-09-01', '2026-09-30'])(
    'accepts a lesson date at the academic unit boundary %s',
    async (lessonDate) => {
      prisma.academicUnit.findFirst.mockResolvedValue({
        ...unitContext(),
        startDate: new Date('2026-09-01T00:00:00.000Z'),
        endDate: new Date('2026-09-30T00:00:00.000Z'),
      });

      await expect(
        service.create(teacher, 'plan-a', 'unit-a', {
          title: 'Boundary lesson',
          lessonDate,
        }),
      ).resolves.toBeDefined();
    },
  );

  it.each(['2026-08-31', '2026-10-01'])(
    'rejects a lesson date outside the academic unit range %s',
    async (lessonDate) => {
      prisma.academicUnit.findFirst.mockResolvedValue({
        ...unitContext(),
        startDate: new Date('2026-09-01T00:00:00.000Z'),
        endDate: new Date('2026-09-30T00:00:00.000Z'),
      });

      await expect(
        service.create(teacher, 'plan-a', 'unit-a', {
          title: 'Outside lesson',
          lessonDate,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.lessonPlan.create).not.toHaveBeenCalled();
    },
  );

  it('allows a lesson date when the academic unit has no start boundary', async () => {
    prisma.academicUnit.findFirst.mockResolvedValue({
      ...unitContext(),
      startDate: null,
      endDate: new Date('2026-09-30T00:00:00.000Z'),
    });

    await expect(
      service.create(teacher, 'plan-a', 'unit-a', {
        title: 'Early lesson',
        lessonDate: '2026-08-31',
      }),
    ).resolves.toBeDefined();
  });

  it('deletes a lesson in a mutable context and records the success event', async () => {
    await expect(
      service.remove(teacher, 'plan-a', 'unit-a', 'lesson-a'),
    ).resolves.toBeUndefined();
    expect(prisma.lessonPlan.delete).toHaveBeenCalledWith({
      where: { id: 'lesson-a' },
    });
    expect(logger.log).toHaveBeenCalledWith({
      context: 'LessonPlansService',
      event: 'LESSON_PLAN_DELETED',
      message: 'LESSON_PLAN_DELETED',
      userId: teacher.id,
      metadata: { academicUnitId: 'unit-a', lessonPlanId: 'lesson-a' },
    });
  });

  it('normalizes remaining lesson positions after deletion', async () => {
    prisma.lessonPlan.findMany.mockResolvedValue([
      { id: 'lesson-a', position: 1 },
      { id: 'lesson-c', position: 3 },
    ]);

    await service.remove(teacher, 'plan-a', 'unit-a', 'lesson-b');

    expect(prisma.lessonPlan.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'lesson-a' },
      data: { position: 10000 },
    });
    expect(prisma.lessonPlan.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'lesson-c' },
      data: { position: 10001 },
    });
    expect(prisma.lessonPlan.update).toHaveBeenNthCalledWith(3, {
      where: { id: 'lesson-a' },
      data: { position: 1 },
    });
    expect(prisma.lessonPlan.update).toHaveBeenNthCalledWith(4, {
      where: { id: 'lesson-c' },
      data: { position: 2 },
    });
  });

  it('does not delete a lesson through another academic unit', async () => {
    prisma.academicUnit.findFirst.mockResolvedValue(
      unitContext('plan-a', 'unit-b'),
    );
    prisma.lessonPlan.findFirst.mockResolvedValue(null);

    await expect(
      service.remove(teacher, 'plan-a', 'unit-b', 'lesson-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lessonPlan.delete).not.toHaveBeenCalled();
  });

  it('does not delete another teacher’s lesson', async () => {
    prisma.academicUnit.findFirst.mockResolvedValue(
      unitContext('plan-a', 'unit-a', 'teacher-b-profile'),
    );

    await expect(
      service.remove(teacher, 'plan-a', 'unit-a', 'lesson-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lessonPlan.delete).not.toHaveBeenCalled();
  });

  it.each([
    ['published plan', AcademicPlanStatus.PUBLISHED, 'ACTIVE'],
    ['closed academic period', AcademicPlanStatus.DRAFT, 'CLOSED'],
  ])(
    'does not delete a lesson for a %s',
    async (_scenario, status, periodStatus) => {
      prisma.academicUnit.findFirst.mockResolvedValue(
        unitContext(
          'plan-a',
          'unit-a',
          'teacher-a-profile',
          status,
          periodStatus,
        ),
      );

      await expect(
        service.remove(teacher, 'plan-a', 'unit-a', 'lesson-a'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.lessonPlan.delete).not.toHaveBeenCalled();
    },
  );

  it('does not log a delete success event when its transaction fails', async () => {
    prisma.$transaction.mockRejectedValueOnce(new Error('delete failed'));

    await expect(
      service.remove(teacher, 'plan-a', 'unit-a', 'lesson-a'),
    ).rejects.toThrow('delete failed');
    expect(prisma.lessonPlan.delete).not.toHaveBeenCalled();
    expect(logger.log).not.toHaveBeenCalled();
  });

  it('reorders a complete lesson set into the requested contiguous order', async () => {
    prisma.lessonPlan.findMany.mockResolvedValue([
      { id: 'lesson-a' },
      { id: 'lesson-b' },
      { id: 'lesson-c' },
    ]);

    await expect(
      service.reorder(teacher, 'plan-a', 'unit-a', [
        'lesson-c',
        'lesson-a',
        'lesson-b',
      ]),
    ).resolves.toBeUndefined();

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.lessonPlan.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'lesson-c' },
      data: { position: 10000 },
    });
    expect(prisma.lessonPlan.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'lesson-a' },
      data: { position: 10001 },
    });
    expect(prisma.lessonPlan.update).toHaveBeenNthCalledWith(3, {
      where: { id: 'lesson-b' },
      data: { position: 10002 },
    });
    expect(prisma.lessonPlan.update).toHaveBeenNthCalledWith(4, {
      where: { id: 'lesson-c' },
      data: { position: 1 },
    });
    expect(prisma.lessonPlan.update).toHaveBeenNthCalledWith(5, {
      where: { id: 'lesson-a' },
      data: { position: 2 },
    });
    expect(prisma.lessonPlan.update).toHaveBeenNthCalledWith(6, {
      where: { id: 'lesson-b' },
      data: { position: 3 },
    });
    expect(logger.log).toHaveBeenCalledWith({
      context: 'LessonPlansService',
      event: 'LESSON_PLANS_REORDERED',
      message: 'Lesson plans reordered',
      userId: teacher.id,
      metadata: { academicUnitId: 'unit-a', count: 3 },
    });
  });

  it('uses temporary positions for a two-lesson swap', async () => {
    prisma.lessonPlan.findMany.mockResolvedValue([
      { id: 'lesson-a' },
      { id: 'lesson-b' },
    ]);

    await service.reorder(teacher, 'plan-a', 'unit-a', [
      'lesson-b',
      'lesson-a',
    ]);

    expect(prisma.lessonPlan.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'lesson-b' },
      data: { position: 10000 },
    });
    expect(prisma.lessonPlan.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'lesson-a' },
      data: { position: 10001 },
    });
    expect(prisma.lessonPlan.update).toHaveBeenNthCalledWith(3, {
      where: { id: 'lesson-b' },
      data: { position: 1 },
    });
    expect(prisma.lessonPlan.update).toHaveBeenNthCalledWith(4, {
      where: { id: 'lesson-a' },
      data: { position: 2 },
    });
  });

  it('rejects an incomplete lesson reorder without writes or success logging', async () => {
    prisma.lessonPlan.findMany.mockResolvedValue([
      { id: 'lesson-a' },
      { id: 'lesson-b' },
      { id: 'lesson-c' },
    ]);

    await expect(
      service.reorder(teacher, 'plan-a', 'unit-a', ['lesson-a', 'lesson-b']),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.lessonPlan.update).not.toHaveBeenCalled();
    expect(logger.log).not.toHaveBeenCalled();
  });

  it('rejects duplicate lesson ids before opening a reorder transaction', async () => {
    await expect(
      service.reorder(teacher, 'plan-a', 'unit-a', [
        'lesson-a',
        'lesson-a',
        'lesson-c',
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(logger.log).not.toHaveBeenCalled();
  });

  it('rejects an unknown lesson id from a complete reorder', async () => {
    prisma.lessonPlan.findMany.mockResolvedValue([
      { id: 'lesson-a' },
      { id: 'lesson-b' },
      { id: 'lesson-c' },
    ]);

    await expect(
      service.reorder(teacher, 'plan-a', 'unit-a', [
        'lesson-a',
        'lesson-b',
        'unknown-lesson',
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.lessonPlan.update).not.toHaveBeenCalled();
  });

  it('rejects a lesson belonging to a different unit from a reorder', async () => {
    prisma.lessonPlan.findMany.mockResolvedValue([
      { id: 'lesson-a' },
      { id: 'lesson-b' },
      { id: 'lesson-c' },
    ]);

    await expect(
      service.reorder(teacher, 'plan-a', 'unit-a', [
        'lesson-a',
        'lesson-b',
        'unit-b-lesson',
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.lessonPlan.update).not.toHaveBeenCalled();
  });

  it('does not reorder a unit through a different academic plan', async () => {
    prisma.academicUnit.findFirst.mockResolvedValue(null);

    await expect(
      service.reorder(teacher, 'plan-b', 'unit-a', ['lesson-a']),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not let another teacher reorder lesson plans', async () => {
    prisma.academicUnit.findFirst.mockResolvedValue(
      unitContext('plan-a', 'unit-a', 'teacher-b-profile'),
    );

    await expect(
      service.reorder(teacher, 'plan-a', 'unit-a', ['lesson-a']),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(logger.log).not.toHaveBeenCalled();
  });

  it.each([
    ['ADMIN', admin],
    ['SUPER_ADMIN', superAdmin],
  ])('does not let %s reorder lesson plans', async (_role, actor) => {
    await expect(
      service.reorder(actor, 'plan-a', 'unit-a', ['lesson-a']),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(logger.log).not.toHaveBeenCalled();
  });

  it.each([
    ['published plan', AcademicPlanStatus.PUBLISHED, 'ACTIVE'],
    ['closed academic period', AcademicPlanStatus.DRAFT, 'CLOSED'],
  ])(
    'does not reorder lesson plans for a %s',
    async (_scenario, status, periodStatus) => {
      prisma.academicUnit.findFirst.mockResolvedValue(
        unitContext(
          'plan-a',
          'unit-a',
          'teacher-a-profile',
          status,
          periodStatus,
        ),
      );

      await expect(
        service.reorder(teacher, 'plan-a', 'unit-a', ['lesson-a']),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(logger.log).not.toHaveBeenCalled();
    },
  );

  it('propagates a reorder transaction failure without reporting success', async () => {
    prisma.lessonPlan.findMany.mockResolvedValue([
      { id: 'lesson-a' },
      { id: 'lesson-b' },
    ]);
    prisma.lessonPlan.update
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('reorder transaction failed'));

    await expect(
      service.reorder(teacher, 'plan-a', 'unit-a', ['lesson-b', 'lesson-a']),
    ).rejects.toThrow('reorder transaction failed');
    expect(prisma.lessonPlan.update).toHaveBeenCalledTimes(2);
    expect(logger.log).not.toHaveBeenCalled();
  });
});
