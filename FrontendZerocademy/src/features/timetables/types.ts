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
  issues: Array<{ status: string; severity: "ERROR" | "INFO"; message: string; scheduleBlockId: string | null }>;
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
  slots: TimetableSlot[];
}

export interface TimetableListResponse {
  data: Timetable[];
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
