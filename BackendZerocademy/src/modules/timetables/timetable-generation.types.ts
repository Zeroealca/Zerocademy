import type { ScheduleBlockKind, Weekday } from '@prisma/client';
import type {
  TimetableCandidateSlot,
  TimetableConflict,
  TimetableConflictValidationResult,
} from './timetable-conflict.types';

export enum TimetableGenerationStatus {
  SUCCESS = 'SUCCESS',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  UNSATISFIABLE = 'UNSATISFIABLE',
  SEARCH_LIMIT_REACHED = 'SEARCH_LIMIT_REACHED',
}

export enum TimetableGenerationDiagnosticCode {
  MISSING_SCHEDULE_STRUCTURE = 'MISSING_SCHEDULE_STRUCTURE',
  NO_ENABLED_WEEKDAYS = 'NO_ENABLED_WEEKDAYS',
  NO_TEACHING_BLOCKS = 'NO_TEACHING_BLOCKS',
  INVALID_SCHEDULE_BLOCK = 'INVALID_SCHEDULE_BLOCK',
  OVERLAPPING_SCHEDULE_BLOCKS = 'OVERLAPPING_SCHEDULE_BLOCKS',
  INVALID_ASSIGNMENT_CONTEXT = 'INVALID_ASSIGNMENT_CONTEXT',
  DUPLICATE_ASSIGNMENT = 'DUPLICATE_ASSIGNMENT',
  MISSING_TEACHING_LOAD = 'MISSING_TEACHING_LOAD',
  INVALID_WEEKLY_PERIODS = 'INVALID_WEEKLY_PERIODS',
  COURSE_CAPACITY_EXCEEDED = 'COURSE_CAPACITY_EXCEEDED',
  TEACHER_CAPACITY_EXCEEDED = 'TEACHER_CAPACITY_EXCEEDED',
  NO_FEASIBLE_TIMETABLE = 'NO_FEASIBLE_TIMETABLE',
  SEARCH_NODE_LIMIT_REACHED = 'SEARCH_NODE_LIMIT_REACHED',
  AUTHORITATIVE_CONFLICT = 'AUTHORITATIVE_CONFLICT',
}

export type TimetableGenerationDiagnostic = {
  code: TimetableGenerationDiagnosticCode;
  message: string;
  teacherAssignmentIds: string[];
  teacherIds: string[];
  courseIds: string[];
};

export type TimetableGenerationAssignment = {
  id: string;
  institutionId: string | null;
  academicPeriodId: string;
  teacherId: string;
  courseId: string;
};

export type TimetableGenerationScheduleBlock = {
  id: string;
  periodScheduleStructureId: string;
  position: number;
  kind: ScheduleBlockKind;
  startTime?: string;
  endTime?: string;
};

export type TimetableGenerationInput = {
  context: {
    institutionId: string;
    academicPeriodId: string;
    periodScheduleStructureId: string | null;
    enabledWeekdays: Weekday[];
  };
  assignments: TimetableGenerationAssignment[];
  scheduleBlocks: TimetableGenerationScheduleBlock[];
  teachingLoads: Array<{ teacherAssignmentId: string; weeklyPeriods: number }>;
  options?: { maxSearchNodes?: number };
};

export type TimetableGenerationStatistics = {
  searchNodesExplored: number;
  backtracks: number;
  requirements: number;
  generatedSlots: number;
};

export type TimetableGenerationResult = {
  status: TimetableGenerationStatus;
  institutionId: string;
  academicPeriodId: string;
  slots: TimetableCandidateSlot[];
  diagnostics: TimetableGenerationDiagnostic[];
  validation: TimetableConflictValidationResult | null;
  statistics: TimetableGenerationStatistics;
};

export type TimetableGenerationAuthoritativeFailure = TimetableConflict & {
  code: TimetableGenerationDiagnosticCode.AUTHORITATIVE_CONFLICT;
};
