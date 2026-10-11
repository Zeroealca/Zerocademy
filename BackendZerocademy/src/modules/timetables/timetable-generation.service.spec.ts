import { ScheduleBlockKind, Weekday } from '@prisma/client';
import { TimetableConflictEngine } from './timetable-conflict-engine.service';
import { TimetableGenerationService } from './timetable-generation.service';
import {
  TimetableGenerationDiagnosticCode,
  TimetableGenerationStatus,
  type TimetableGenerationInput,
} from './timetable-generation.types';

const baseInput = (): TimetableGenerationInput => ({
  context: {
    institutionId: 'institution-1',
    academicPeriodId: 'period-1',
    periodScheduleStructureId: 'structure-1',
    enabledWeekdays: [Weekday.MON, Weekday.TUE],
  },
  scheduleBlocks: [
    {
      id: 'block-1',
      periodScheduleStructureId: 'structure-1',
      position: 1,
      kind: ScheduleBlockKind.TEACHING,
      startTime: '08:00',
      endTime: '08:40',
    },
    {
      id: 'break-1',
      periodScheduleStructureId: 'structure-1',
      position: 2,
      kind: ScheduleBlockKind.BREAK,
      startTime: '08:40',
      endTime: '09:00',
    },
    {
      id: 'block-2',
      periodScheduleStructureId: 'structure-1',
      position: 3,
      kind: ScheduleBlockKind.TEACHING,
      startTime: '09:00',
      endTime: '09:40',
    },
  ],
  assignments: [
    {
      id: 'assignment-1',
      institutionId: 'institution-1',
      academicPeriodId: 'period-1',
      teacherId: 'teacher-1',
      courseId: 'course-1',
    },
  ],
  teachingLoads: [{ teacherAssignmentId: 'assignment-1', weeklyPeriods: 2 }],
});

describe('TimetableGenerationService', () => {
  const service = new TimetableGenerationService(new TimetableConflictEngine());

  it('generates an exact valid weekly proposal without using non-teaching blocks', () => {
    const result = service.generate(baseInput());

    expect(result.status).toBe(TimetableGenerationStatus.SUCCESS);
    expect(result.slots).toHaveLength(2);
    expect(
      result.slots.every((slot) => slot.scheduleBlockId !== 'break-1'),
    ).toBe(true);
    expect(result.validation?.valid).toBe(true);
    expect(result.statistics.generatedSlots).toBe(2);
  });

  it('separates shared-teacher courses while fulfilling every load', () => {
    const input = baseInput();
    input.assignments.push({
      id: 'assignment-2',
      institutionId: 'institution-1',
      academicPeriodId: 'period-1',
      teacherId: 'teacher-1',
      courseId: 'course-2',
    });
    input.teachingLoads.push({
      teacherAssignmentId: 'assignment-2',
      weeklyPeriods: 2,
    });

    const result = service.generate(input);

    expect(result.status).toBe(TimetableGenerationStatus.SUCCESS);
    expect(
      new Set(
        result.slots.map((slot) => `${slot.weekday}|${slot.scheduleBlockId}`),
      ).size,
    ).toBe(4);
    expect(result.statistics).toMatchObject({
      requirements: 4,
      generatedSlots: 4,
      searchNodesExplored: 4,
      backtracks: 0,
    });
  });

  it('is deterministic for permuted normalized inputs', () => {
    const input = baseInput();
    input.assignments.push({
      id: 'assignment-2',
      institutionId: 'institution-1',
      academicPeriodId: 'period-1',
      teacherId: 'teacher-2',
      courseId: 'course-1',
    });
    input.teachingLoads.push({
      teacherAssignmentId: 'assignment-2',
      weeklyPeriods: 1,
    });
    const shuffled: TimetableGenerationInput = {
      ...input,
      context: {
        ...input.context,
        enabledWeekdays: [...input.context.enabledWeekdays].reverse(),
      },
      assignments: [...input.assignments].reverse(),
      teachingLoads: [...input.teachingLoads].reverse(),
      scheduleBlocks: [...input.scheduleBlocks].reverse(),
    };

    expect(service.generate(shuffled).slots).toEqual(
      service.generate(input).slots,
    );
  });

  it('reports valid-but-impossible course capacity as unsatisfiable', () => {
    const input = baseInput();
    input.teachingLoads[0].weeklyPeriods = 5;

    const result = service.generate(input);

    expect(result.status).toBe(TimetableGenerationStatus.UNSATISFIABLE);
    expect(result.diagnostics[0].code).toBe(
      TimetableGenerationDiagnosticCode.COURSE_CAPACITY_EXCEEDED,
    );
  });

  it('reports invalid foreign assignment context without searching', () => {
    const input = baseInput();
    input.assignments[0].academicPeriodId = 'period-2';

    const result = service.generate(input);

    expect(result.status).toBe(TimetableGenerationStatus.INVALID_CONFIGURATION);
    expect(result.statistics.searchNodesExplored).toBe(0);
    expect(result.diagnostics.map((item) => item.code)).toContain(
      TimetableGenerationDiagnosticCode.INVALID_ASSIGNMENT_CONTEXT,
    );
  });

  it('stops deterministically at the search-node budget', () => {
    const input = baseInput();
    input.options = { maxSearchNodes: 1 };

    const result = service.generate(input);

    expect(result.status).toBe(TimetableGenerationStatus.SEARCH_LIMIT_REACHED);
    expect(result.slots).toEqual([]);
    expect(result.diagnostics[0].code).toBe(
      TimetableGenerationDiagnosticCode.SEARCH_NODE_LIMIT_REACHED,
    );
  });
});
