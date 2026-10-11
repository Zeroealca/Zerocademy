import { ScheduleBlockKind, Weekday } from '@prisma/client';
import { TimetableConflictEngine } from './timetable-conflict-engine.service';
import {
  TimetableConflictCode,
  TimetableValidationMode,
  type TimetableConflictValidationInput,
} from './timetable-conflict.types';

const engine = new TimetableConflictEngine();

const input = (
  overrides: Partial<TimetableConflictValidationInput> = {},
): TimetableConflictValidationInput => ({
  mode: TimetableValidationMode.PARTIAL,
  context: {
    institutionId: 'institution-a',
    academicPeriodId: 'period-a',
    periodScheduleStructureId: 'structure-a',
    enabledWeekdays: [Weekday.MON, Weekday.TUE],
  },
  assignments: [
    {
      id: 'assignment-a',
      institutionId: 'institution-a',
      academicPeriodId: 'period-a',
      teacherId: 'teacher-a',
      courseId: 'course-a',
    },
    {
      id: 'assignment-b',
      institutionId: 'institution-a',
      academicPeriodId: 'period-a',
      teacherId: 'teacher-b',
      courseId: 'course-b',
    },
  ],
  scheduleBlocks: [
    {
      id: 'block-a',
      periodScheduleStructureId: 'structure-a',
      kind: ScheduleBlockKind.TEACHING,
    },
  ],
  teachingLoads: [
    { teacherAssignmentId: 'assignment-a', weeklyPeriods: 1 },
    { teacherAssignmentId: 'assignment-b', weeklyPeriods: 1 },
  ],
  candidates: [
    {
      id: 'candidate-a',
      teacherAssignmentId: 'assignment-a',
      weekday: Weekday.MON,
      scheduleBlockId: 'block-a',
    },
    {
      id: 'candidate-b',
      teacherAssignmentId: 'assignment-b',
      weekday: Weekday.TUE,
      scheduleBlockId: 'block-a',
    },
  ],
  ...overrides,
});

const codes = (value: TimetableConflictValidationInput) =>
  engine.validate(value).conflicts.map((conflict) => conflict.code);

describe('TimetableConflictEngine', () => {
  it('accepts valid partial and complete candidates', () => {
    expect(engine.validate(input())).toEqual(
      expect.objectContaining({
        valid: true,
        mode: TimetableValidationMode.PARTIAL,
      }),
    );
    expect(
      engine.validate(input({ mode: TimetableValidationMode.COMPLETE })),
    ).toEqual(
      expect.objectContaining({
        valid: true,
        mode: TimetableValidationMode.COMPLETE,
      }),
    );
  });

  it('detects teacher, course, and simultaneous teacher/course conflicts', () => {
    const teacherCollision = input({
      assignments: [
        ...input().assignments,
        {
          ...input().assignments[1],
          id: 'assignment-c',
          teacherId: 'teacher-a',
        },
      ],
      teachingLoads: [
        ...input().teachingLoads,
        { teacherAssignmentId: 'assignment-c', weeklyPeriods: 1 },
      ],
      candidates: [
        input().candidates[0],
        {
          id: 'candidate-c',
          teacherAssignmentId: 'assignment-c',
          weekday: Weekday.MON,
          scheduleBlockId: 'block-a',
        },
      ],
    });
    expect(codes(teacherCollision)).toEqual([
      TimetableConflictCode.TEACHER_CONFLICT,
    ]);

    const both = input({
      assignments: [
        input().assignments[0],
        {
          ...input().assignments[1],
          teacherId: 'teacher-a',
          courseId: 'course-a',
        },
      ],
      candidates: [
        input().candidates[0],
        {
          ...input().candidates[1],
          weekday: Weekday.MON,
        },
      ],
    });
    expect(codes(both)).toEqual([
      TimetableConflictCode.TEACHER_CONFLICT,
      TimetableConflictCode.COURSE_CONFLICT,
    ]);
  });

  it('rejects disabled weekdays, missing blocks, BREAK, NON_TEACHING, and foreign blocks', () => {
    for (const [block, weekday, expected] of [
      ['missing', Weekday.MON, TimetableConflictCode.INVALID_BLOCK],
      ['block-a', Weekday.WED, TimetableConflictCode.INVALID_DAY],
      ['break-a', Weekday.MON, TimetableConflictCode.INVALID_BLOCK],
      ['non-teaching-a', Weekday.MON, TimetableConflictCode.INVALID_BLOCK],
      ['foreign-a', Weekday.MON, TimetableConflictCode.INVALID_BLOCK],
    ] as const) {
      expect(
        codes(
          input({
            scheduleBlocks: [
              ...input().scheduleBlocks,
              {
                id: 'break-a',
                periodScheduleStructureId: 'structure-a',
                kind: ScheduleBlockKind.BREAK,
              },
              {
                id: 'non-teaching-a',
                periodScheduleStructureId: 'structure-a',
                kind: ScheduleBlockKind.NON_TEACHING,
              },
              {
                id: 'foreign-a',
                periodScheduleStructureId: 'structure-b',
                kind: ScheduleBlockKind.TEACHING,
              },
            ],
            candidates: [
              {
                ...input().candidates[0],
                scheduleBlockId: block,
                weekday,
              },
            ],
          }),
        ),
      ).toContain(expected);
    }
  });

  it('reports missing and foreign assignments plus timetable institution/period mismatches', () => {
    const result = engine.validate(
      input({
        context: {
          ...input().context,
          timetable: {
            id: 'timetable-a',
            institutionId: 'institution-b',
            academicPeriodId: 'period-b',
          },
        },
        assignments: [
          { ...input().assignments[0], institutionId: 'institution-b' },
          { ...input().assignments[1], academicPeriodId: 'period-b' },
        ],
        candidates: [
          input().candidates[0],
          input().candidates[1],
          {
            id: 'candidate-missing-assignment',
            teacherAssignmentId: 'missing-assignment',
            weekday: Weekday.MON,
            scheduleBlockId: 'block-a',
          },
        ],
      }),
    );
    expect(
      result.conflicts.filter(
        (conflict) => conflict.code === TimetableConflictCode.CONTEXT_MISMATCH,
      ),
    ).toHaveLength(4);
  });

  it('checks configured loads, suppresses underload in partial mode, and reports missing loads', () => {
    const incomplete = input({
      teachingLoads: [
        { teacherAssignmentId: 'assignment-a', weeklyPeriods: 2 },
      ],
      candidates: input().candidates,
    });
    expect(codes(incomplete)).toEqual([
      TimetableConflictCode.MISSING_TEACHING_LOAD,
    ]);
    expect(
      codes({ ...incomplete, mode: TimetableValidationMode.COMPLETE }),
    ).toEqual([
      TimetableConflictCode.MISSING_TEACHING_LOAD,
      TimetableConflictCode.LOAD_UNSATISFIED,
    ]);

    expect(
      codes(
        input({
          candidates: [
            input().candidates[0],
            {
              ...input().candidates[0],
              id: 'candidate-a-two',
              weekday: Weekday.TUE,
            },
          ],
        }),
      ),
    ).toContain(TimetableConflictCode.LOAD_OVERSATISFIED);
  });

  it('reports duplicates once and does not count them toward loads or occupancy', () => {
    const result = engine.validate(
      input({
        mode: TimetableValidationMode.COMPLETE,
        teachingLoads: [
          { teacherAssignmentId: 'assignment-a', weeklyPeriods: 2 },
        ],
        candidates: [
          input().candidates[0],
          { ...input().candidates[0], id: 'candidate-a-duplicate' },
        ],
      }),
    );
    expect(result.conflicts.map((conflict) => conflict.code)).toEqual([
      TimetableConflictCode.DUPLICATE_CANDIDATE,
      TimetableConflictCode.LOAD_UNSATISFIED,
    ]);
    expect(result.conflicts[1]).toMatchObject({ actualWeeklyPeriods: 1 });
  });

  it('is deterministic, order independent, handles empty candidates, and does not mutate input', () => {
    const proposal = input({
      mode: TimetableValidationMode.COMPLETE,
      candidates: [...input().candidates].reverse(),
    });
    const before: TimetableConflictValidationInput = {
      ...proposal,
      context: { ...proposal.context },
      assignments: proposal.assignments.map((assignment) => ({
        ...assignment,
      })),
      scheduleBlocks: proposal.scheduleBlocks.map((block) => ({ ...block })),
      teachingLoads: proposal.teachingLoads.map((load) => ({ ...load })),
      candidates: proposal.candidates.map((candidate) => ({ ...candidate })),
    };
    const first = engine.validate(proposal);
    const second = engine.validate({
      ...proposal,
      candidates: [...proposal.candidates].reverse(),
    });
    expect(first).toEqual(second);
    expect(proposal).toEqual(before);
    const empty = engine.validate(
      input({ mode: TimetableValidationMode.COMPLETE, candidates: [] }),
    );
    expect(empty.valid).toBe(false);
    expect(
      empty.conflicts.some(
        (conflict) => conflict.code === TimetableConflictCode.LOAD_UNSATISFIED,
      ),
    ).toBe(true);
  });
});
