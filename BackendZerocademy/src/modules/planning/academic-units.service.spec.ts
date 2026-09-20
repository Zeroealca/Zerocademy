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
    service = new AcademicUnitsService(
      prisma as unknown as PrismaService,
      { log: jest.fn() } as unknown as AppLoggerService,
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
  });
});
