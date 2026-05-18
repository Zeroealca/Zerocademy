import { apiClient } from "@/lib/api-client";
import type {
  AcademicLevel,
  AcademicLevelsFilters,
  AcademicLevelsListResponse,
  CreateAcademicLevelInput,
  UpdateAcademicLevelInput,
} from "@/features/academic-levels/types";

function buildListQuery(filters: AcademicLevelsFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.institutionId) {
    params.set("institutionId", filters.institutionId);
  }

  if (filters.isActive !== undefined) {
    params.set("isActive", String(filters.isActive));
  }

  if (filters.isSystem !== undefined) {
    params.set("isSystem", String(filters.isSystem));
  }

  return params.toString();
}

export function fetchAcademicLevels(
  filters: AcademicLevelsFilters,
): Promise<AcademicLevelsListResponse> {
  const query = buildListQuery(filters);
  return apiClient<AcademicLevelsListResponse>(`/v1/academic-levels?${query}`);
}

export function fetchAcademicLevel(id: string): Promise<AcademicLevel> {
  return apiClient<AcademicLevel>(`/v1/academic-levels/${id}`);
}

export function createAcademicLevel(
  payload: CreateAcademicLevelInput,
): Promise<AcademicLevel> {
  return apiClient<AcademicLevel>("/v1/academic-levels", {
    method: "POST",
    body: payload,
  });
}

export function updateAcademicLevel(
  id: string,
  payload: UpdateAcademicLevelInput,
): Promise<AcademicLevel> {
  return apiClient<AcademicLevel>(`/v1/academic-levels/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function activateAcademicLevel(id: string): Promise<AcademicLevel> {
  return apiClient<AcademicLevel>(`/v1/academic-levels/${id}/activate`, {
    method: "POST",
  });
}

export function deactivateAcademicLevel(id: string): Promise<AcademicLevel> {
  return apiClient<AcademicLevel>(`/v1/academic-levels/${id}/deactivate`, {
    method: "POST",
  });
}

export function deleteAcademicLevel(id: string): Promise<void> {
  return apiClient<void>(`/v1/academic-levels/${id}`, {
    method: "DELETE",
  });
}
