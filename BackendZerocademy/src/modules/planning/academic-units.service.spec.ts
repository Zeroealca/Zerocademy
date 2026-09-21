import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AcademicPlanStatus, Role } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AcademicUnitsService } from './academic-units.service';

const actor: AuthenticatedUser = {
  id: 'teacher-user',
  email: 'teacher@example.test',
  firstName: 'Ada',
  lastName: 'Teacher',
  role: Role.TEACHER,
  profileId: 'teacher-profile',
  institutionId: 'institution',
};
const admin: AuthenticatedUser = {
  ...actor,
  id: 'admin-user',
  role: Role.ADMIN,
  profileId: 'admin-profile',
};
const student: AuthenticatedUser = {
  ...actor,
  id: 'student-user',
  role: Role.STUDENT,
  profileId: 'student-profile',
};
const representative: AuthenticatedUser = {
  ...actor,
  id: 'representative-user',
  role: Role.REPRESENTATIVE,
  profileId: 'representative-profile',
};
const superAdmin: AuthenticatedUser = {
  ...actor,
  id: 'super-admin-user',
  role: Role.SUPER_ADMIN,
  profileId: 'super-admin-profile',
  institutionId: 'other-institution',
};

type PrismaMock = {
  academicPlan: { findUnique: jest.Mock };
  academicUnit: {
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

describe('AcademicUnitsService', () => {
  let service: AcademicUnitsService;
  let prisma: PrismaMock;
  let logger: { log: jest.Mock };

  beforeEach(() => {
    prisma = {
      academicPlan: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'plan',
          status: AcademicPlanStatus.DRAFT,
          teacherAssignment: {
            teacherId: 'teacher-profile',
            institutionId: 'institution',
            academicPeriod: { status: 'ACTIVE' },
          },
        }),
      },
      academicUnit: {
        aggregate: jest.fn().mockResolvedValue({ _max: { position: null } }),
        create: jest.fn().mockResolvedValue({
          id: 'unit-c',
          academicPlanId: 'plan',
          position: 1,
          title: 'Unit C',
          description: 'Description',
        }),
        delete: jest.fn(),
        findFirst: jest.fn().mockResolvedValue({
          id: 'unit-c',
          academicPlanId: 'plan',
          position: 1,
          title: 'Unit C',
          description: 'Description',
          startDate: null,
          endDate: null,
        }),
        findMany: jest.fn().mockResolvedValue([
          { id: 'unit-a', title: 'Unit A', position: 1 },
          { id: 'unit-b', title: 'Unit B', position: 2 },
        ]),
        update: jest.fn().mockResolvedValue({
          id: 'unit-c',
          academicPlanId: 'plan',
          position: 1,
          title: 'Updated Unit',
          description: 'Updated description',
        }),
      },
      $transaction: jest.fn((operation: TransactionOperation) =>
        operation(prisma),
      ),
    };
    logger = { log: jest.fn() };
    service = new AcademicUnitsService(
      prisma as unknown as PrismaService,
      logger as unknown as AppLoggerService,
    );
  });

  it('lists ordered units for an authorized teacher on their own plan', async () => {
    await expect(service.list(actor, 'plan')).resolves.toEqual([
      { id: 'unit-a', title: 'Unit A', position: 1 },
      { id: 'unit-b', title: 'Unit B', position: 2 },
    ]);
    expect(prisma.academicPlan.findUnique).toHaveBeenCalledWith({
      where: { id: 'plan' },
      include: { teacherAssignment: { include: { academicPeriod: true } } },
    });
    expect(prisma.academicUnit.findMany).toHaveBeenCalledWith({
      where: { academicPlanId: 'plan' },
      orderBy: { position: 'asc' },
    });
  });

  it('lists units for an admin in the plan institution', async () => {
    await expect(service.list(admin, 'plan')).resolves.toEqual([
      { id: 'unit-a', title: 'Unit A', position: 1 },
      { id: 'unit-b', title: 'Unit B', position: 2 },
    ]);
  });

  it('does not let an admin create units', async () => {
    await expect(
      service.create(admin, 'plan', { title: 'Unit C' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.academicUnit.create).not.toHaveBeenCalled();
  });

  it('does not let an admin read units from another institution', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.DRAFT,
      teacherAssignment: {
        teacherId: 'teacher-profile',
        institutionId: 'other-institution',
        academicPeriod: { status: 'ACTIVE' },
      },
    });

    await expect(service.list(admin, 'plan')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.academicUnit.findMany).not.toHaveBeenCalled();
  });

  it('lists units for a super admin', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.DRAFT,
      teacherAssignment: {
        teacherId: 'teacher-profile',
        institutionId: 'other-institution',
        academicPeriod: { status: 'ACTIVE' },
      },
    });

    await expect(service.list(superAdmin, 'plan')).resolves.toEqual([
      { id: 'unit-a', title: 'Unit A', position: 1 },
      { id: 'unit-b', title: 'Unit B', position: 2 },
    ]);
  });

  it.each([
    ['student', student],
    ['representative', representative],
  ])(
    'does not let a %s read academic units',
    async (_role, unauthorizedActor) => {
      await expect(
        service.list(unauthorizedActor, 'plan'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.academicUnit.findMany).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['published plan', AcademicPlanStatus.PUBLISHED, 'ACTIVE'],
    ['closed academic period', AcademicPlanStatus.DRAFT, 'CLOSED'],
  ])(
    'keeps units readable for a %s',
    async (_scenario, status, periodStatus) => {
      prisma.academicPlan.findUnique.mockResolvedValue({
        id: 'plan',
        status,
        teacherAssignment: {
          teacherId: 'teacher-profile',
          institutionId: 'institution',
          academicPeriod: { status: periodStatus },
        },
      });

      await expect(service.list(actor, 'plan')).resolves.toEqual([
        { id: 'unit-a', title: 'Unit A', position: 1 },
        { id: 'unit-b', title: 'Unit B', position: 2 },
      ]);
    },
  );

  it('accepts a unit date range contained within its academic plan', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.DRAFT,
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-11-30T00:00:00.000Z'),
      teacherAssignment: {
        teacherId: 'teacher-profile',
        institutionId: 'institution',
        academicPeriod: { status: 'ACTIVE' },
      },
    });

    await service.create(actor, 'plan', {
      title: 'Unit C',
      startDate: '2026-09-10',
      endDate: '2026-09-25',
    });

    expect(prisma.academicUnit.create).toHaveBeenCalledWith({
      data: {
        academicPlanId: 'plan',
        position: 1,
        title: 'Unit C',
        startDate: new Date('2026-09-10T00:00:00.000Z'),
        endDate: new Date('2026-09-25T00:00:00.000Z'),
      },
    });
  });

  it.each([
    ['reversed', '2026-10-20', '2026-10-10'],
    ['before the plan', '2026-08-25', '2026-09-10'],
    ['after the plan', '2026-11-20', '2026-12-05'],
  ])('rejects a unit range %s', async (_scenario, startDate, endDate) => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.DRAFT,
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-11-30T00:00:00.000Z'),
      teacherAssignment: {
        teacherId: 'teacher-profile',
        institutionId: 'institution',
        academicPeriod: { status: 'ACTIVE' },
      },
    });

    await expect(
      service.create(actor, 'plan', { title: 'Unit C', startDate, endDate }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.academicUnit.create).not.toHaveBeenCalled();
  });

  it('accepts unit dates equal to the academic plan boundaries on update', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.DRAFT,
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-11-30T00:00:00.000Z'),
      teacherAssignment: {
        teacherId: 'teacher-profile',
        institutionId: 'institution',
        academicPeriod: { status: 'ACTIVE' },
      },
    });

    await service.update(actor, 'plan', 'unit-c', {
      startDate: '2026-09-01',
      endDate: '2026-11-30',
    });

    expect(prisma.academicUnit.update).toHaveBeenCalledWith({
      where: { id: 'unit-c' },
      data: {
        startDate: new Date('2026-09-01T00:00:00.000Z'),
        endDate: new Date('2026-11-30T00:00:00.000Z'),
      },
    });
  });

  it('creates an academic unit for an authorized teacher on their draft plan', async () => {
    await expect(
      service.create(actor, 'plan', {
        title: ' Unit C ',
        description: ' Description ',
      }),
    ).resolves.toEqual({
      id: 'unit-c',
      academicPlanId: 'plan',
      position: 1,
      title: 'Unit C',
      description: 'Description',
    });
    expect(prisma.academicUnit.create).toHaveBeenCalledWith({
      data: {
        academicPlanId: 'plan',
        position: 1,
        title: 'Unit C',
        description: 'Description',
      },
    });
    expect(logger.log).toHaveBeenCalledWith({
      context: 'AcademicUnitsService',
      event: 'ACADEMIC_UNIT_CREATED',
      message: 'ACADEMIC_UNIT_CREATED',
      userId: actor.id,
      metadata: { academicPlanId: 'plan', academicUnitId: 'unit-c' },
    });
  });

  it('appends a created academic unit after the current highest position', async () => {
    prisma.academicUnit.aggregate.mockResolvedValue({
      _max: { position: 3 },
    });
    prisma.academicUnit.create.mockResolvedValue({
      id: 'unit-d',
      academicPlanId: 'plan',
      position: 4,
      title: 'Unit D',
    });

    await service.create(actor, 'plan', { title: 'Unit D' });

    expect(prisma.academicUnit.create).toHaveBeenCalledWith({
      data: { academicPlanId: 'plan', position: 4, title: 'Unit D' },
    });
  });

  it('does not create an academic unit on another teacher’s plan', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.DRAFT,
      teacherAssignment: {
        teacherId: 'other-teacher-profile',
        institutionId: 'institution',
        academicPeriod: { status: 'ACTIVE' },
      },
    });

    await expect(
      service.create(actor, 'plan', { title: 'Unit C' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.academicUnit.create).not.toHaveBeenCalled();
  });

  it('does not create an academic unit on a published plan', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.PUBLISHED,
      teacherAssignment: {
        teacherId: 'teacher-profile',
        institutionId: 'institution',
        academicPeriod: { status: 'ACTIVE' },
      },
    });

    await expect(
      service.create(actor, 'plan', { title: 'Unit C' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.academicUnit.create).not.toHaveBeenCalled();
  });

  it('does not create an academic unit in a closed academic period', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.DRAFT,
      teacherAssignment: {
        teacherId: 'teacher-profile',
        institutionId: 'institution',
        academicPeriod: { status: 'CLOSED' },
      },
    });

    await expect(
      service.create(actor, 'plan', { title: 'Unit C' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.academicUnit.create).not.toHaveBeenCalled();
  });

  it('updates an academic unit for an authorized teacher on their draft plan', async () => {
    await expect(
      service.update(actor, 'plan', 'unit-c', {
        title: ' Updated Unit ',
        description: ' Updated description ',
      }),
    ).resolves.toEqual({
      id: 'unit-c',
      academicPlanId: 'plan',
      position: 1,
      title: 'Updated Unit',
      description: 'Updated description',
    });
    expect(prisma.academicUnit.update).toHaveBeenCalledWith({
      where: { id: 'unit-c' },
      data: { title: 'Updated Unit', description: 'Updated description' },
    });
    expect(logger.log).toHaveBeenCalledWith({
      context: 'AcademicUnitsService',
      event: 'ACADEMIC_UNIT_UPDATED',
      message: 'ACADEMIC_UNIT_UPDATED',
      userId: actor.id,
      metadata: { academicPlanId: 'plan', academicUnitId: 'unit-c' },
    });
  });

  it('does not update an academic unit on another teacher’s plan', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.DRAFT,
      teacherAssignment: {
        teacherId: 'other-teacher-profile',
        institutionId: 'institution',
        academicPeriod: { status: 'ACTIVE' },
      },
    });

    await expect(
      service.update(actor, 'plan', 'unit-c', { title: 'Updated Unit' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.academicUnit.update).not.toHaveBeenCalled();
  });

  it('does not update a unit outside the requested academic plan', async () => {
    prisma.academicUnit.findFirst.mockResolvedValue(null);

    await expect(
      service.update(actor, 'plan', 'other-plan-unit', {
        title: 'Updated Unit',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.academicUnit.findFirst).toHaveBeenCalledWith({
      where: { id: 'other-plan-unit', academicPlanId: 'plan' },
    });
    expect(prisma.academicUnit.update).not.toHaveBeenCalled();
  });

  it('does not update an academic unit on a published plan', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.PUBLISHED,
      teacherAssignment: {
        teacherId: 'teacher-profile',
        institutionId: 'institution',
        academicPeriod: { status: 'ACTIVE' },
      },
    });

    await expect(
      service.update(actor, 'plan', 'unit-c', { title: 'Updated Unit' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.academicUnit.update).not.toHaveBeenCalled();
  });

  it('does not update an academic unit in a closed academic period', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.DRAFT,
      teacherAssignment: {
        teacherId: 'teacher-profile',
        institutionId: 'institution',
        academicPeriod: { status: 'CLOSED' },
      },
    });

    await expect(
      service.update(actor, 'plan', 'unit-c', { title: 'Updated Unit' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.academicUnit.update).not.toHaveBeenCalled();
  });

  it('deletes an academic unit for an authorized teacher on their draft plan', async () => {
    await expect(
      service.remove(actor, 'plan', 'unit-c'),
    ).resolves.toBeUndefined();

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.academicUnit.delete).toHaveBeenCalledWith({
      where: { id: 'unit-c' },
    });
    expect(logger.log).toHaveBeenCalledWith({
      context: 'AcademicUnitsService',
      event: 'ACADEMIC_UNIT_DELETED',
      message: 'ACADEMIC_UNIT_DELETED',
      userId: actor.id,
      metadata: { academicPlanId: 'plan', academicUnitId: 'unit-c' },
    });
  });

  it('normalizes remaining unit positions after deletion', async () => {
    prisma.academicUnit.findMany.mockResolvedValue([
      { id: 'unit-a', position: 1 },
      { id: 'unit-c', position: 3 },
    ]);

    await service.remove(actor, 'plan', 'unit-b');

    expect(prisma.academicUnit.update).toHaveBeenCalledWith({
      where: { id: 'unit-a' },
      data: { position: 10000 },
    });
    expect(prisma.academicUnit.update).toHaveBeenCalledWith({
      where: { id: 'unit-c' },
      data: { position: 10001 },
    });
    expect(prisma.academicUnit.update).toHaveBeenCalledWith({
      where: { id: 'unit-a' },
      data: { position: 1 },
    });
    expect(prisma.academicUnit.update).toHaveBeenCalledWith({
      where: { id: 'unit-c' },
      data: { position: 2 },
    });
  });

  it('does not delete an academic unit on another teacher’s plan', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.DRAFT,
      teacherAssignment: {
        teacherId: 'other-teacher-profile',
        institutionId: 'institution',
        academicPeriod: { status: 'ACTIVE' },
      },
    });

    await expect(
      service.remove(actor, 'plan', 'unit-c'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.academicUnit.delete).not.toHaveBeenCalled();
  });

  it('does not delete a unit outside the requested academic plan', async () => {
    prisma.academicUnit.findFirst.mockResolvedValue(null);

    await expect(
      service.remove(actor, 'plan', 'other-plan-unit'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.academicUnit.delete).not.toHaveBeenCalled();
  });

  it('does not delete an academic unit on a published plan', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.PUBLISHED,
      teacherAssignment: {
        teacherId: 'teacher-profile',
        institutionId: 'institution',
        academicPeriod: { status: 'ACTIVE' },
      },
    });

    await expect(
      service.remove(actor, 'plan', 'unit-c'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.academicUnit.delete).not.toHaveBeenCalled();
  });

  it('does not delete an academic unit in a closed academic period', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.DRAFT,
      teacherAssignment: {
        teacherId: 'teacher-profile',
        institutionId: 'institution',
        academicPeriod: { status: 'CLOSED' },
      },
    });

    await expect(
      service.remove(actor, 'plan', 'unit-c'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.academicUnit.delete).not.toHaveBeenCalled();
  });

  it('reorders all academic units for an authorized teacher', async () => {
    prisma.academicUnit.findMany.mockResolvedValue([
      { id: 'unit-a' },
      { id: 'unit-b' },
      { id: 'unit-c' },
    ]);

    await expect(
      service.reorder(actor, 'plan', ['unit-c', 'unit-a', 'unit-b']),
    ).resolves.toBeUndefined();

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.academicUnit.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'unit-c' },
      data: { position: 10000 },
    });
    expect(prisma.academicUnit.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'unit-a' },
      data: { position: 10001 },
    });
    expect(prisma.academicUnit.update).toHaveBeenNthCalledWith(3, {
      where: { id: 'unit-b' },
      data: { position: 10002 },
    });
    expect(prisma.academicUnit.update).toHaveBeenNthCalledWith(4, {
      where: { id: 'unit-c' },
      data: { position: 1 },
    });
    expect(prisma.academicUnit.update).toHaveBeenNthCalledWith(5, {
      where: { id: 'unit-a' },
      data: { position: 2 },
    });
    expect(prisma.academicUnit.update).toHaveBeenNthCalledWith(6, {
      where: { id: 'unit-b' },
      data: { position: 3 },
    });
    expect(logger.log).toHaveBeenCalledWith({
      context: 'AcademicUnitsService',
      event: 'ACADEMIC_UNITS_REORDERED',
      message: 'Academic units reordered',
      userId: actor.id,
      metadata: { academicPlanId: 'plan', count: 3 },
    });
  });

  it('reorders a two-unit swap through collision-safe temporary positions', async () => {
    prisma.academicUnit.findMany.mockResolvedValue([
      { id: 'unit-a' },
      { id: 'unit-b' },
    ]);

    await service.reorder(actor, 'plan', ['unit-b', 'unit-a']);

    expect(prisma.academicUnit.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'unit-b' },
      data: { position: 10000 },
    });
    expect(prisma.academicUnit.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'unit-a' },
      data: { position: 10001 },
    });
    expect(prisma.academicUnit.update).toHaveBeenNthCalledWith(3, {
      where: { id: 'unit-b' },
      data: { position: 1 },
    });
    expect(prisma.academicUnit.update).toHaveBeenNthCalledWith(4, {
      where: { id: 'unit-a' },
      data: { position: 2 },
    });
  });

  it('rejects a reorder with duplicate unit ids', async () => {
    await expect(
      service.reorder(actor, 'plan', ['unit-a', 'unit-a']),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a reorder that omits a unit from the plan', async () => {
    prisma.academicUnit.findMany.mockResolvedValue([
      { id: 'unit-a' },
      { id: 'unit-b' },
      { id: 'unit-c' },
    ]);

    await expect(
      service.reorder(actor, 'plan', ['unit-a', 'unit-b']),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.academicUnit.update).not.toHaveBeenCalled();
  });

  it('rejects foreign and unknown units from a plan reorder', async () => {
    prisma.academicUnit.findMany.mockResolvedValue([
      { id: 'unit-a' },
      { id: 'unit-b' },
      { id: 'unit-c' },
    ]);

    await expect(
      service.reorder(actor, 'plan', ['unit-a', 'plan-b-unit', 'unit-c']),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.reorder(actor, 'plan', ['unit-a', 'unknown-unit', 'unit-c']),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.academicUnit.update).not.toHaveBeenCalled();
  });

  it('does not reorder academic units on another teacher’s plan', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.DRAFT,
      teacherAssignment: {
        teacherId: 'other-teacher-profile',
        institutionId: 'institution',
        academicPeriod: { status: 'ACTIVE' },
      },
    });

    await expect(
      service.reorder(actor, 'plan', ['unit-a', 'unit-b']),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not reorder academic units on a published plan or in a closed period', async () => {
    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.PUBLISHED,
      teacherAssignment: {
        teacherId: 'teacher-profile',
        institutionId: 'institution',
        academicPeriod: { status: 'ACTIVE' },
      },
    });

    await expect(
      service.reorder(actor, 'plan', ['unit-a', 'unit-b']),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.academicPlan.findUnique.mockResolvedValue({
      id: 'plan',
      status: AcademicPlanStatus.DRAFT,
      teacherAssignment: {
        teacherId: 'teacher-profile',
        institutionId: 'institution',
        academicPeriod: { status: 'CLOSED' },
      },
    });

    await expect(
      service.reorder(actor, 'plan', ['unit-a', 'unit-b']),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('propagates transaction failures from delete and reorder operations', async () => {
    prisma.$transaction
      .mockRejectedValueOnce(new Error('delete transaction failed'))
      .mockRejectedValueOnce(new Error('reorder transaction failed'));

    await expect(service.remove(actor, 'plan', 'unit-c')).rejects.toThrow(
      'delete transaction failed',
    );
    await expect(
      service.reorder(actor, 'plan', ['unit-a', 'unit-b']),
    ).rejects.toThrow('reorder transaction failed');
    expect(prisma.academicUnit.delete).not.toHaveBeenCalled();
    expect(prisma.academicUnit.update).not.toHaveBeenCalled();
    expect(logger.log).not.toHaveBeenCalled();
  });
});
