import { apiClient } from "@/lib/api-client";
import type { StudentsListResponse } from "@/features/students/types";
import type {
  AvailableStudentsFilters,
  BulkCreateEnrollmentsInput,
  BulkEnrollmentResult,
  CreateEnrollmentInput,
  Enrollment,
  EnrollmentsFilters,
  EnrollmentsListResponse,
  UpdateEnrollmentInput,
} from "@/features/enrollments/types";

function buildListQuery(filters: EnrollmentsFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  if (filters.studentId) params.set("studentId", filters.studentId);
  if (filters.courseId) params.set("courseId", filters.courseId);
  if (filters.academicPeriodId) {
    params.set("academicPeriodId", filters.academicPeriodId);
  }
  if (filters.status) params.set("status", filters.status);

  return params.toString();
}

export function fetchEnrollments(
  filters: EnrollmentsFilters,
): Promise<EnrollmentsListResponse> {
  return apiClient<EnrollmentsListResponse>(
    `/v1/enrollments?${buildListQuery(filters)}`,
  );
}

export function fetchStudentEnrollmentHistory(
  studentId: string,
  filters: EnrollmentsFilters,
): Promise<EnrollmentsListResponse> {
  return apiClient<EnrollmentsListResponse>(
    `/v1/enrollments/student/${studentId}/history?${buildListQuery(filters)}`,
  );
}

export function fetchEnrollment(id: string): Promise<Enrollment> {
  return apiClient<Enrollment>(`/v1/enrollments/${id}`);
}

export function createEnrollment(
  payload: CreateEnrollmentInput,
): Promise<Enrollment> {
  return apiClient<Enrollment>("/v1/enrollments", {
    method: "POST",
    body: payload,
  });
}

export function updateEnrollment(
  id: string,
  payload: UpdateEnrollmentInput,
): Promise<Enrollment> {
  return apiClient<Enrollment>(`/v1/enrollments/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

function buildAvailableStudentsQuery(
  filters: AvailableStudentsFilters,
): string {
  const params = new URLSearchParams();
  params.set("courseId", filters.courseId);
  params.set("academicPeriodId", filters.academicPeriodId);
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  if (filters.search) {
    params.set("search", filters.search);
  }
  return params.toString();
}

export function fetchAvailableStudentsForEnrollment(
  filters: AvailableStudentsFilters,
): Promise<StudentsListResponse> {
  return apiClient<StudentsListResponse>(
    `/v1/enrollments/available-students?${buildAvailableStudentsQuery(filters)}`,
  );
}

export function bulkCreateEnrollments(
  payload: BulkCreateEnrollmentsInput,
): Promise<BulkEnrollmentResult> {
  return apiClient<BulkEnrollmentResult>("/v1/enrollments/bulk", {
    method: "POST",
    body: payload,
  });
}
