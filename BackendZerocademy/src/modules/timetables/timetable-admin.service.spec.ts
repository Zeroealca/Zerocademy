import { Role, ScheduleBlockKind, Weekday } from '@prisma/client';
import { TimetableAdminService } from './timetable-admin.service';
import { TimetableConflictEngine } from './timetable-conflict-engine.service';
import { TimetableGenerationService } from './timetable-generation.service';
import { TimetableGenerationStatus } from './timetable-generation.types';

jest.mock('../../common/rbac/academic-scope.util', () => ({
  assertActorCanAccessInstitution: jest.fn().mockResolvedValue(undefined),
}));

const actor = {
  id: 'admin-a',
  email: 'admin@example.test',
  firstName: 'Admin',
  lastName: 'A',
  role: Role.ADMIN,
  profileId: 'profile-a',
  institutionId: 'institution-a',
};

describe('TimetableAdminService', () => {
  const prisma = {
    academicPeriod: { findUnique: jest.fn() },
    periodScheduleStructure: { findUnique: jest.fn() },
    teacherAssignment: { findMany: jest.fn() },
    timetable: { findMany: jest.fn(), findUnique: jest.fn() },
  };
  const permissionEnforcer = {
    requireForInstitutionMembership: jest.fn().mockResolvedValue(undefined),
  };
  const engine = new TimetableConflictEngine();
  const service = new TimetableAdminService(
    prisma as never,
    permissionEnforcer as never,
    new TimetableGenerationService(engine),
    engine,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.academicPeriod.findUnique.mockResolvedValue({
      institutionId: 'institution-a',
      status: 'ACTIVE',
    });
    prisma.periodScheduleStructure.findUnique.mockResolvedValue({
      id: 'structure-a',
      enabledWeekdays: [Weekday.MON],
      scheduleBlocks: [
        {
          id: 'block-a',
          periodScheduleStructureId: 'structure-a',
          position: 1,
          kind: ScheduleBlockKind.TEACHING,
          startTime: new Date('1970-01-01T08:00:00Z'),
          endTime: new Date('1970-01-01T08:40:00Z'),
        },
      ],
    });
    prisma.teacherAssignment.findMany.mockResolvedValue([
      {
        id: 'assignment-a',
        institutionId: 'institution-a',
        academicPeriodId: 'period-a',
        teacherId: 'teacher-a',
        courseId: 'course-a',
        teachingLoad: { weeklyPeriods: 1 },
      },
    ]);
  });

  it('generates a validated proposal without timetable writes', async () => {
    const result = await service.generate(
      actor,
      'institution-a',
      'period-a',
      {},
    );
    expect(result.status).toBe(TimetableGenerationStatus.SUCCESS);
    expect(result.slots).toEqual([
      {
        teacherAssignmentId: 'assignment-a',
        weekday: Weekday.MON,
        scheduleBlockId: 'block-a',
      },
    ]);
    expect(prisma.timetable.findMany).not.toHaveBeenCalled();
    expect(prisma.timetable.findUnique).not.toHaveBeenCalled();
  });
});
