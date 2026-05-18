import { apiClient } from "@/lib/api-client";
import type {
  Course,
  CoursesFilters,
  CoursesListResponse,
  CreateCourseInput,
  UpdateCourseInput,
} from "@/features/courses/types";

function buildListQuery(filters: CoursesFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.academicPeriodId) {
    params.set("academicPeriodId", filters.academicPeriodId);
  }

  if (filters.gradeLevelId) {
    params.set("gradeLevelId", filters.gradeLevelId);
  }

  if (filters.academicLevelId) {
    params.set("academicLevelId", filters.academicLevelId);
  }

  if (filters.isActive !== undefined) {
    params.set("isActive", String(filters.isActive));
  }

  return params.toString();
}

export function fetchCourses(
  filters: CoursesFilters,
): Promise<CoursesListResponse> {
  const query = buildListQuery(filters);
  return apiClient<CoursesListResponse>(`/v1/courses?${query}`);
}

export function fetchCourse(id: string): Promise<Course> {
  return apiClient<Course>(`/v1/courses/${id}`);
}

export function createCourse(payload: CreateCourseInput): Promise<Course> {
  return apiClient<Course>("/v1/courses", {
    method: "POST",
    body: payload,
  });
}

export function updateCourse(
  id: string,
  payload: UpdateCourseInput,
): Promise<Course> {
  return apiClient<Course>(`/v1/courses/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function activateCourse(id: string): Promise<Course> {
  return apiClient<Course>(`/v1/courses/${id}/activate`, {
    method: "POST",
  });
}

export function deactivateCourse(id: string): Promise<Course> {
  return apiClient<Course>(`/v1/courses/${id}/deactivate`, {
    method: "POST",
  });
}

export function deleteCourse(id: string): Promise<void> {
  return apiClient<void>(`/v1/courses/${id}`, {
    method: "DELETE",
  });
}
