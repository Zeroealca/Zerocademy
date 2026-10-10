import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AcademicPeriodStatus,
  Role,
  ScheduleBlockKind,
  Weekday,
} from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ScheduleStructuresService } from './schedule-structures.service';

jest.mock('../../common/rbac/academic-scope.util', () => ({
  assertActorCanAccessInstitution: jest.fn().mockResolvedValue(undefined),
}));

const admin: AuthenticatedUser = {
  id: 'admin-a',
  email: 'admin@example.test',
  firstName: 'Admin',
  lastName: 'A',
  role: Role.ADMIN,
  profileId: 'profile-a',
  institutionId: 'institution-a',
};
const block = (
  id: string,
  position: number,
  startTime: Date,
  endTime: Date,
  kind: ScheduleBlockKind = ScheduleBlockKind.TEACHING,
) => ({ id, position, name: null, startTime, endTime, kind });
const structure = (
  blocks = [
    block(
      'block-a',
      1,
      new Date('1970-01-01T07:00:00Z'),
      new Date('1970-01-01T07:40:00Z'),
    ),
  ],
) => ({
  id: 'structure-a',
  institutionId: 'institution-a',
  academicPeriodId: 'period-a',
  enabledWeekdays: [Weekday.MON, Weekday.TUE],
  scheduleBlocks: blocks,
});

describe('ScheduleStructuresService', () => {
  const prisma = {
    academicPeriod: { findUnique: jest.fn() },
    periodScheduleStructure: { findUnique: jest.fn(), upsert: jest.fn() },
    scheduleBlock: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    timetableSlot: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  };
  const logger = { log: jest.fn() };
  const permissionEnforcer = {
    requireForInstitutionMembership: jest.fn().mockResolvedValue(undefined),
  };
  let service: ScheduleStructuresService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.academicPeriod.findUnique.mockResolvedValue({
      institutionId: 'institution-a',
      status: AcademicPeriodStatus.PLANNED,
    });
    prisma.periodScheduleStructure.findUnique.mockResolvedValue(structure());
    prisma.periodScheduleStructure.upsert.mockResolvedValue(structure());
    prisma.scheduleBlock.create.mockResolvedValue(
      block(
        'block-b',
        2,
        new Date('1970-01-01T07:45:00Z'),
        new Date('1970-01-01T08:25:00Z'),
      ),
    );
    service = new ScheduleStructuresService(
      prisma as unknown as PrismaService,
      logger as unknown as AppLoggerService,
      permissionEnforcer as never,
    );
  });

  it('initializes weekdays and derives weekly teaching capacity without counting breaks', async () => {
    prisma.periodScheduleStructure.findUnique.mockResolvedValue(
      structure([
        block(
          'teaching-a',
          1,
          new Date('1970-01-01T07:00:00Z'),
          new Date('1970-01-01T07:40:00Z'),
        ),
        block(
          'break-a',
          2,
          new Date('1970-01-01T07:40:00Z'),
          new Date('1970-01-01T08:00:00Z'),
          ScheduleBlockKind.BREAK,
        ),
        block(
          'non-teaching-a',
          3,
          new Date('1970-01-01T08:00:00Z'),
          new Date('1970-01-01T08:20:00Z'),
          ScheduleBlockKind.NON_TEACHING,
        ),
      ]),
    );
    const result = await service.findOne(admin, 'institution-a', 'period-a');
    expect(result.capacity).toMatchObject({
      teachingBlocksPerConfiguredDay: 1,
      weeklyTeachingSlotsPerCourse: 2,
      breakBlocksPerConfiguredDay: 1,
      nonTeachingBlocksPerConfiguredDay: 1,
      structurallyReady: true,
    });
  });

  it('reports no enabled weekday and no teaching block as stable readiness statuses', async () => {
    prisma.periodScheduleStructure.findUnique.mockResolvedValue({
      ...structure([]),
      enabledWeekdays: [],
    });
    await expect(
      service.validate(admin, 'institution-a', 'period-a'),
    ).resolves.toMatchObject({
      structurallyReady: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ status: 'NO_ENABLED_WEEKDAYS' }),
        expect.objectContaining({ status: 'NO_TEACHING_BLOCKS' }),
      ]),
    });
  });

  it('rejects overlapping and non-positive blocks before persistence', async () => {
    await expect(
      service.createBlock(admin, 'institution-a', 'period-a', {
        startTime: '07:20',
        endTime: '08:00',
        kind: ScheduleBlockKind.TEACHING,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.createBlock(admin, 'institution-a', 'period-a', {
        startTime: '08:00',
        endTime: '08:00',
        kind: ScheduleBlockKind.TEACHING,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.scheduleBlock.create).not.toHaveBeenCalled();
  });

  it.each([AcademicPeriodStatus.CLOSED, AcademicPeriodStatus.ARCHIVED])(
    'rejects mutations for %s periods',
    async (status) => {
      prisma.academicPeriod.findUnique.mockResolvedValue({
        institutionId: 'institution-a',
        status,
      });
      await expect(
        service.upsert(admin, 'institution-a', 'period-a', {
          enabledWeekdays: [Weekday.MON],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it.each([Role.TEACHER, Role.SUPER_ADMIN, Role.STUDENT])(
    'denies %s schedule mutations',
    async (role) => {
      await expect(
        service.upsert({ ...admin, role }, 'institution-a', 'period-a', {
          enabledWeekdays: [Weekday.MON],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );

  it('does not allow deletion while a timetable slot references the block', async () => {
    prisma.scheduleBlock.findUnique.mockResolvedValue({
      ...block(
        'block-a',
        1,
        new Date('1970-01-01T07:00:00Z'),
        new Date('1970-01-01T07:40:00Z'),
      ),
      periodScheduleStructure: structure(),
    });
    prisma.timetableSlot.findFirst.mockResolvedValue({ id: 'slot-a' });
    await expect(service.removeBlock(admin, 'block-a')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.scheduleBlock.delete).not.toHaveBeenCalled();
  });

  it('rejects a reorder that includes a block from another structure', async () => {
    await expect(
      service.reorderBlocks(admin, 'institution-a', 'period-a', {
        items: [
          { id: 'block-a', position: 1 },
          { id: 'foreign', position: 2 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
