import type { ScheduleBlockKind, Weekday } from '@prisma/client';

export enum TimetableValidationMode {
  PARTIAL = 'PARTIAL',
  COMPLETE = 'COMPLETE',
}

export enum TimetableConflictCode {
  TEACHER_CONFLICT = 'TEACHER_CONFLICT',
  COURSE_CONFLICT = 'COURSE_CONFLICT',
  INVALID_BLOCK = 'INVALID_BLOCK',
  INVALID_DAY = 'INVALID_DAY',
  CONTEXT_MISMATCH = 'CONTEXT_MISMATCH',
  LOAD_UNSATISFIED = 'LOAD_UNSATISFIED',
  LOAD_OVERSATISFIED = 'LOAD_OVERSATISFIED',
  MISSING_TEACHING_LOAD = 'MISSING_TEACHING_LOAD',
  DUPLICATE_CANDIDATE = 'DUPLICATE_CANDIDATE',
}

export enum TimetableConflictSeverity {
  ERROR = 'ERROR',
}

export type TimetableCandidateSlot = {
  id: string;
  teacherAssignmentId: string;
  weekday: Weekday;
  scheduleBlockId: string;
};

export type TimetableConflictAssignment = {
  id: string;
  institutionId: string | null;
  academicPeriodId: string;
  teacherId: string;
  courseId: string;
};

export type TimetableConflictScheduleBlock = {
  id: string;
  periodScheduleStructureId: string;
  kind: ScheduleBlockKind;
};

export type TimetableConflictTeachingLoad = {
  teacherAssignmentId: string;
  weeklyPeriods: number;
};

export type TimetableConflictValidationInput = {
  mode: TimetableValidationMode;
  context: {
    institutionId: string;
    academicPeriodId: string;
    periodScheduleStructureId: string;
    enabledWeekdays: Weekday[];
    timetable?: {
      id: string;
      institutionId: string;
      academicPeriodId: string;
    };
  };
  assignments: TimetableConflictAssignment[];
  scheduleBlocks: TimetableConflictScheduleBlock[];
  teachingLoads: TimetableConflictTeachingLoad[];
  candidates: TimetableCandidateSlot[];
};

export type TimetableConflict = {
  code: TimetableConflictCode;
  severity: TimetableConflictSeverity;
  message: string;
  affectedCandidateIds: string[];
  teacherAssignmentIds: string[];
  courseIds: string[];
  weekday: Weekday | null;
  scheduleBlockId: string | null;
  expectedWeeklyPeriods: number | null;
  actualWeeklyPeriods: number | null;
};

export type TimetableConflictValidationResult = {
  valid: boolean;
  mode: TimetableValidationMode;
  conflicts: TimetableConflict[];
};
