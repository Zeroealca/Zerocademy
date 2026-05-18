import { apiClient } from "@/lib/api-client";
import type {
  CreateGradeLevelInput,
  GradeLevel,
  GradeLevelsFilters,
  GradeLevelsListResponse,
  UpdateGradeLevelInput,
} from "@/features/grade-levels/types";

function buildListQuery(filters: GradeLevelsFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.institutionId) {
    params.set("institutionId", filters.institutionId);
  }

  if (filters.academicLevelId) {
    params.set("academicLevelId", filters.academicLevelId);
  }

  if (filters.isActive !== undefined) {
    params.set("isActive", String(filters.isActive));
  }

  if (filters.isSystem !== undefined) {
    params.set("isSystem", String(filters.isSystem));
  }

  return params.toString();
}

export function fetchGradeLevels(
  filters: GradeLevelsFilters,
): Promise<GradeLevelsListResponse> {
  const query = buildListQuery(filters);
  return apiClient<GradeLevelsListResponse>(`/v1/grade-levels?${query}`);
}

export function fetchGradeLevel(id: string): Promise<GradeLevel> {
  return apiClient<GradeLevel>(`/v1/grade-levels/${id}`);
}

export function createGradeLevel(
  payload: CreateGradeLevelInput,
): Promise<GradeLevel> {
  return apiClient<GradeLevel>("/v1/grade-levels", {
    method: "POST",
    body: payload,
  });
}

export function updateGradeLevel(
  id: string,
  payload: UpdateGradeLevelInput,
): Promise<GradeLevel> {
  return apiClient<GradeLevel>(`/v1/grade-levels/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function activateGradeLevel(id: string): Promise<GradeLevel> {
  return apiClient<GradeLevel>(`/v1/grade-levels/${id}/activate`, {
    method: "POST",
  });
}

export function deactivateGradeLevel(id: string): Promise<GradeLevel> {
  return apiClient<GradeLevel>(`/v1/grade-levels/${id}/deactivate`, {
    method: "POST",
  });
}

export function deleteGradeLevel(id: string): Promise<void> {
  return apiClient<void>(`/v1/grade-levels/${id}`, {
    method: "DELETE",
  });
}
