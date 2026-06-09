import { apiClient } from "@/lib/api-client";
import type {
  Assessment,
  AssessmentsFilters,
  AssessmentsListResponse,
  CreateAssessmentInput,
  UpdateAssessmentInput,
} from "@/features/grades/types";

function buildAssessmentsQuery(filters: AssessmentsFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  if (filters.institutionId) params.set("institutionId", filters.institutionId);
  if (filters.academicPeriodId) {
    params.set("academicPeriodId", filters.academicPeriodId);
  }
  if (filters.academicTermId) params.set("academicTermId", filters.academicTermId);
  if (filters.subjectId) params.set("subjectId", filters.subjectId);
  if (filters.courseId) params.set("courseId", filters.courseId);
  if (filters.teacherAssignmentId) {
    params.set("teacherAssignmentId", filters.teacherAssignmentId);
  }
  if (filters.search) params.set("search", filters.search);

  return params.toString();
}

export function fetchAssessments(
  filters: AssessmentsFilters,
): Promise<AssessmentsListResponse> {
  return apiClient<AssessmentsListResponse>(
    `/v1/assessments?${buildAssessmentsQuery(filters)}`,
  );
}

export function fetchAssessment(id: string): Promise<Assessment> {
  return apiClient<Assessment>(`/v1/assessments/${id}`);
}

export function createAssessment(
  payload: CreateAssessmentInput,
): Promise<Assessment> {
  return apiClient<Assessment>("/v1/assessments", {
    method: "POST",
    body: payload,
  });
}

export function updateAssessment(
  id: string,
  payload: UpdateAssessmentInput,
): Promise<Assessment> {
  return apiClient<Assessment>(`/v1/assessments/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteAssessment(id: string): Promise<void> {
  return apiClient<void>(`/v1/assessments/${id}`, { method: "DELETE" });
}
