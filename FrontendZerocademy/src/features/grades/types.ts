export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Assessment {
  id: string;
  institutionId: string;
  academicPeriodId: string;
  academicPeriodName: string;
  academicTermId: string;
  academicTermName: string;
  academicTermOrder: number;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherAssignmentId: string;
  courseId: string;
  assessmentCategoryId: string;
  assessmentCategoryName: string;
  title: string;
  description: string | null;
  maxScore: number;
  weight: number;
  assessmentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentsFilters {
  page: number;
  limit: number;
  institutionId?: string;
  academicPeriodId?: string;
  academicTermId?: string;
  subjectId?: string;
  courseId?: string;
  teacherAssignmentId?: string;
  search?: string;
}

export interface AssessmentsListResponse {
  data: Assessment[];
  meta: PaginationMeta;
}

export interface CreateAssessmentInput {
  institutionId: string;
  academicPeriodId: string;
  academicTermId: string;
  subjectId: string;
  teacherAssignmentId: string;
  assessmentCategoryId: string;
  title: string;
  description?: string;
  maxScore: number;
  weight: number;
  assessmentDate: string;
}

export type UpdateAssessmentInput = Partial<CreateAssessmentInput>;

export interface Grade {
  id: string;
  assessmentId: string;
  enrollmentId: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  score: number;
  observations: string | null;
  gradingSchemeId: string | null;
  assessment: Assessment;
  createdAt: string;
  updatedAt: string;
}

export interface GradesFilters {
  page: number;
  limit: number;
  assessmentId?: string;
  enrollmentId?: string;
  academicPeriodId?: string;
  academicTermId?: string;
  subjectId?: string;
  studentId?: string;
}

export interface GradesListResponse {
  data: Grade[];
  meta: PaginationMeta;
}

export interface CreateGradeInput {
  assessmentId: string;
  enrollmentId: string;
  score: number;
  observations?: string;
}

export interface BulkGradeEntryInput {
  enrollmentId: string;
  score: number;
  observations?: string;
}

export interface BulkUpsertGradesInput {
  assessmentId: string;
  grades: BulkGradeEntryInput[];
}

export interface BulkGradeResult {
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  errors: Array<{ enrollmentId: string; message: string }>;
}

export interface GradeEntryRow {
  enrollmentId: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  gradeId: string | null;
  score: number | null;
  observations: string | null;
}

export interface GradeEntrySheet {
  assessment: Assessment;
  gradingSchemeMinScore: number;
  gradingSchemeMaxScore: number;
  decimalPlaces: number;
  rows: GradeEntryRow[];
}
