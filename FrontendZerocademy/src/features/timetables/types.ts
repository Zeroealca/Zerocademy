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
