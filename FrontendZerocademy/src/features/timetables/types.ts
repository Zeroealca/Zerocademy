export type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI";
export type ScheduleBlockKind = "TEACHING" | "BREAK" | "NON_TEACHING";

export interface ScheduleBlock {
  id: string;
  position: number;
  name: string | null;
  startTime: string;
  endTime: string;
  kind: ScheduleBlockKind;
}

export interface ScheduleStructure {
  id: string;
  institutionId: string;
  academicPeriodId: string;
  enabledWeekdays: Weekday[];
  blocks: ScheduleBlock[];
}

export interface ScheduleStructureDetail extends ScheduleStructure {
  capacity: {
    enabledWeekdays: Weekday[];
    teachingBlocksPerConfiguredDay: number;
    weeklyTeachingSlotsPerCourse: number;
    breakBlocksPerConfiguredDay: number;
    nonTeachingBlocksPerConfiguredDay: number;
    structurallyReady: boolean;
  };
}

export interface ScheduleStructureValidation {
  structurallyReady: boolean;
  issues: Array<{
    status: string;
    severity: "ERROR" | "INFO";
    message: string;
    scheduleBlockId: string | null;
  }>;
}

export type ScheduleBlockInput = {
  name?: string;
  startTime: string;
  endTime: string;
  kind: ScheduleBlockKind;
};

export type TimetableStatus = "DRAFT" | "PUBLISHED";

export interface TimetableSlot {
  id: string;
  teacherAssignmentId: string;
  teacherId: string;
  courseId: string;
  weekday: Weekday;
  scheduleBlockId: string;
  scheduleBlockPosition: number;
  scheduleBlockStartTime: string;
  scheduleBlockEndTime: string;
  courseName: string;
  subjectName: string;
  teacherName: string;
}

export interface Timetable {
  id: string;
  institutionId: string;
  academicPeriodId: string;
  status: TimetableStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  publishedByUserId: string | null;
  slots: TimetableSlot[];
}

export interface TimetableListResponse {
  data: Timetable[];
}

export interface TeacherTimetableSlot {
  id: string;
  teacherAssignmentId: string;
  weekday: Weekday;
  scheduleBlockId: string;
  scheduleBlockPosition: number;
  scheduleBlockStartTime: string;
  scheduleBlockEndTime: string;
  courseId: string;
  courseName: string;
  subjectName: string;
}

export interface TeacherTimetable {
  id: string;
  institutionId: string;
  academicPeriodId: string;
  academicPeriodName: string;
  slots: TeacherTimetableSlot[];
}

export interface TeacherTimetableListResponse {
  data: TeacherTimetable[];
}

export type TimetableConflictCode =
  | "TEACHER_CONFLICT"
  | "COURSE_CONFLICT"
  | "INVALID_BLOCK"
  | "INVALID_DAY"
  | "CONTEXT_MISMATCH"
  | "LOAD_UNSATISFIED"
  | "LOAD_OVERSATISFIED"
  | "MISSING_TEACHING_LOAD"
  | "DUPLICATE_CANDIDATE"
  | string;

export interface TimetableConflict {
  code: TimetableConflictCode;
  severity: "ERROR";
  message: string;
  affectedCandidateIds: string[];
  teacherAssignmentIds: string[];
  courseIds: string[];
  weekday: Weekday | null;
  scheduleBlockId: string | null;
  expectedWeeklyPeriods: number | null;
  actualWeeklyPeriods: number | null;
}

export interface TimetableValidation {
  valid: boolean;
  mode: "PARTIAL" | "COMPLETE";
  conflicts: TimetableConflict[];
}

export interface TimetableSlotInput {
  teacherAssignmentId: string;
  weekday: Weekday;
  scheduleBlockId: string;
}

export type TimetableGenerationStatus =
  | "SUCCESS"
  | "INVALID_CONFIGURATION"
  | "UNSATISFIABLE"
  | "SEARCH_LIMIT_REACHED";
export type TimetableGenerationDiagnosticCode =
  | "MISSING_SCHEDULE_STRUCTURE"
  | "NO_ENABLED_WEEKDAYS"
  | "NO_TEACHING_BLOCKS"
  | "INVALID_SCHEDULE_BLOCK"
  | "OVERLAPPING_SCHEDULE_BLOCKS"
  | "INVALID_ASSIGNMENT_CONTEXT"
  | "DUPLICATE_ASSIGNMENT"
  | "MISSING_TEACHING_LOAD"
  | "INVALID_WEEKLY_PERIODS"
  | "COURSE_CAPACITY_EXCEEDED"
  | "TEACHER_CAPACITY_EXCEEDED"
  | "NO_FEASIBLE_TIMETABLE"
  | "SEARCH_NODE_LIMIT_REACHED"
  | "AUTHORITATIVE_CONFLICT"
  | string;

export interface TimetableGeneration {
  status: TimetableGenerationStatus;
  slots: TimetableSlotInput[];
  diagnostics: Array<{
    code: TimetableGenerationDiagnosticCode;
    message: string;
    teacherAssignmentIds: string[];
    teacherIds: string[];
    courseIds: string[];
  }>;
  validation: TimetableValidation | null;
  statistics: {
    searchNodesExplored: number;
    backtracks: number;
    requirements: number;
    generatedSlots: number;
  };
}

export interface TeachingLoad {
  teacherAssignmentId: string;
  courseId: string;
  courseName: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  weeklyPeriods: number | null;
}

export interface TeachingLoadListResponse {
  data: TeachingLoad[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
