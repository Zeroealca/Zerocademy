import { apiClient } from "@/lib/api-client";
import type {
  CreateTeacherAssignmentInput,
  TeacherAssignment,
  TeacherAssignmentsFilters,
  TeacherAssignmentsListResponse,
  UpdateTeacherAssignmentInput,
} from "@/features/teacher-assignments/types";

function buildListQuery(filters: TeacherAssignmentsFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.teacherId) {
    params.set("teacherId", filters.teacherId);
  }

  if (filters.subjectId) {
    params.set("subjectId", filters.subjectId);
  }

  if (filters.courseId) {
    params.set("courseId", filters.courseId);
  }

  if (filters.academicPeriodId) {
    params.set("academicPeriodId", filters.academicPeriodId);
  }

  if (filters.gradeLevelId) {
    params.set("gradeLevelId", filters.gradeLevelId);
  }

  return params.toString();
}

export function fetchTeacherAssignments(
  filters: TeacherAssignmentsFilters,
): Promise<TeacherAssignmentsListResponse> {
  const query = buildListQuery(filters);
  return apiClient<TeacherAssignmentsListResponse>(
    `/v1/teacher-assignments?${query}`,
  );
}

export function fetchTeacherAssignment(id: string): Promise<TeacherAssignment> {
  return apiClient<TeacherAssignment>(`/v1/teacher-assignments/${id}`);
}

export function createTeacherAssignment(
  payload: CreateTeacherAssignmentInput,
): Promise<TeacherAssignment> {
  return apiClient<TeacherAssignment>("/v1/teacher-assignments", {
    method: "POST",
    body: payload,
  });
}

export function updateTeacherAssignment(
  id: string,
  payload: UpdateTeacherAssignmentInput,
): Promise<TeacherAssignment> {
  return apiClient<TeacherAssignment>(`/v1/teacher-assignments/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteTeacherAssignment(id: string): Promise<void> {
  return apiClient<void>(`/v1/teacher-assignments/${id}`, {
    method: "DELETE",
  });
}
