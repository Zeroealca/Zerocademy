import type { AcademicPeriod, AcademicRegime } from "@/features/academic-periods/types";

export interface TransitionPeriodSummary {
  id: string;
  name: string;
}

export interface TransitionCountSummary {
  courses: number;
  teacherAssignments: number;
  terms: number;
}

export interface ReusableStructureSummary {
  academicLevels: number;
  gradeLevels: number;
  subjects: number;
}

export interface TransitionOptions {
  copyCourses: boolean;
  copyTeacherAssignments: boolean;
  copyTerms: boolean;
  activateTargetPeriod: boolean;
  closeSourcePeriod: boolean;
}

export interface CreateTargetPeriodInTransition {
  name: string;
  regime: AcademicRegime;
  startDate: string;
  endDate: string;
}

export interface AcademicTransitionRequest {
  fromAcademicPeriodId: string;
  toAcademicPeriodId?: string;
  createTargetPeriod?: CreateTargetPeriodInTransition;
  options: TransitionOptions;
}

export interface AcademicTransitionPreview {
  fromPeriod: TransitionPeriodSummary;
  toPeriod?: TransitionPeriodSummary;
  willCreateTargetPeriod?: boolean;
  sourceCounts: TransitionCountSummary;
  estimatedCopies: TransitionCountSummary;
  reusableStructures: ReusableStructureSummary;
  structuresReusedNotCopied: boolean;
}

export interface AcademicTransitionRecord {
  id: string;
  institutionId: string;
  fromPeriod: TransitionPeriodSummary;
  toPeriod: TransitionPeriodSummary;
  executedById: string;
  copiedCourses: boolean;
  copiedAssignments: boolean;
  copiedStructures: boolean;
  copiedTerms: boolean;
  createdAt: string;
}

export interface ActiveAcademicPeriodResponse {
  institutionId: string;
  activePeriod: AcademicPeriod | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AcademicTransitionsListResponse {
  data: AcademicTransitionRecord[];
  meta: PaginationMeta;
}

export interface SetActiveAcademicPeriodInput {
  academicPeriodId: string;
}
