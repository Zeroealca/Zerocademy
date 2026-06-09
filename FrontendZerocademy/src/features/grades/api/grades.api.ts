import { apiClient } from "@/lib/api-client";
import type {
  BulkGradeResult,
  BulkUpsertGradesInput,
  CreateGradeInput,
  Grade,
  GradeEntrySheet,
  GradesFilters,
  GradesListResponse,
} from "@/features/grades/types";

function buildGradesQuery(filters: GradesFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  if (filters.assessmentId) params.set("assessmentId", filters.assessmentId);
  if (filters.enrollmentId) params.set("enrollmentId", filters.enrollmentId);
  if (filters.academicPeriodId) {
    params.set("academicPeriodId", filters.academicPeriodId);
  }
  if (filters.academicTermId) params.set("academicTermId", filters.academicTermId);
  if (filters.subjectId) params.set("subjectId", filters.subjectId);
  if (filters.studentId) params.set("studentId", filters.studentId);

  return params.toString();
}

export function fetchGrades(filters: GradesFilters): Promise<GradesListResponse> {
  return apiClient<GradesListResponse>(`/v1/grades?${buildGradesQuery(filters)}`);
}

export function fetchGrade(id: string): Promise<Grade> {
  return apiClient<Grade>(`/v1/grades/${id}`);
}

export function fetchGradeEntrySheet(
  assessmentId: string,
): Promise<GradeEntrySheet> {
  return apiClient<GradeEntrySheet>(
    `/v1/grades/entry-sheet/${assessmentId}`,
  );
}

export function createGrade(payload: CreateGradeInput): Promise<Grade> {
  return apiClient<Grade>("/v1/grades", {
    method: "POST",
    body: payload,
  });
}

export function bulkUpsertGrades(
  payload: BulkUpsertGradesInput,
): Promise<BulkGradeResult> {
  return apiClient<BulkGradeResult>("/v1/grades/bulk", {
    method: "POST",
    body: payload,
  });
}
