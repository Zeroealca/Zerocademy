import { apiClient } from "@/lib/api-client";
import type {
  BulkImportResult,
  BulkImportStudentsInput,
  CreateStudentInput,
  Student,
  StudentsFilters,
  StudentsListResponse,
  UpdateStudentInput,
} from "@/features/students/types";

function buildListQuery(filters: StudentsFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.isActive !== undefined) {
    params.set("isActive", String(filters.isActive));
  }

  if (filters.academicPeriodId) {
    params.set("academicPeriodId", filters.academicPeriodId);
  }

  if (filters.courseId) {
    params.set("courseId", filters.courseId);
  }

  if (filters.excludeEnrolledInPeriodId) {
    params.set(
      "excludeEnrolledInPeriodId",
      filters.excludeEnrolledInPeriodId,
    );
  }

  return params.toString();
}

export function fetchStudents(
  filters: StudentsFilters,
): Promise<StudentsListResponse> {
  return apiClient<StudentsListResponse>(`/v1/students?${buildListQuery(filters)}`);
}

export function fetchStudent(id: string): Promise<Student> {
  return apiClient<Student>(`/v1/students/${id}`);
}

export function fetchMyStudent(): Promise<Student> {
  return apiClient<Student>("/v1/students/me");
}

export function createStudent(payload: CreateStudentInput): Promise<Student> {
  return apiClient<Student>("/v1/students", {
    method: "POST",
    body: payload,
  });
}

export function updateStudent(
  id: string,
  payload: UpdateStudentInput,
): Promise<Student> {
  return apiClient<Student>(`/v1/students/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function activateStudent(id: string): Promise<Student> {
  return apiClient<Student>(`/v1/students/${id}/activate`, { method: "POST" });
}

export function deactivateStudent(id: string): Promise<Student> {
  return apiClient<Student>(`/v1/students/${id}/deactivate`, { method: "POST" });
}

export function bulkImportStudents(
  payload: BulkImportStudentsInput,
): Promise<BulkImportResult> {
  return apiClient<BulkImportResult>("/v1/students/bulk-import", {
    method: "POST",
    body: payload,
  });
}
