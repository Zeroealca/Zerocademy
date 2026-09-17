import { apiClient } from "@/lib/api-client";
import type {
  CreateSubjectInput,
  Subject,
  SubjectsFilters,
  SubjectsListResponse,
  UpdateSubjectInput,
} from "@/features/subjects/types";

function buildListQuery(filters: SubjectsFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  if (filters.institutionId) params.set("institutionId", filters.institutionId);

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.gradeLevelId) {
    params.set("gradeLevelId", filters.gradeLevelId);
  }

  if (filters.isActive !== undefined) {
    params.set("isActive", String(filters.isActive));
  }

  if (filters.isSystem !== undefined) {
    params.set("isSystem", String(filters.isSystem));
  }

  return params.toString();
}

export function fetchSubjects(
  filters: SubjectsFilters,
): Promise<SubjectsListResponse> {
  const query = buildListQuery(filters);
  return apiClient<SubjectsListResponse>(`/v1/subjects?${query}`);
}

export function fetchSubject(id: string): Promise<Subject> {
  return apiClient<Subject>(`/v1/subjects/${id}`);
}

export function fetchSubjectsHierarchy(params: {
  gradeLevelId?: string;
  activeOnly?: boolean;
}): Promise<{ subjects: Subject[] }> {
  const search = new URLSearchParams();

  if (params.gradeLevelId) {
    search.set("gradeLevelId", params.gradeLevelId);
  }

  if (params.activeOnly === false) {
    search.set("activeOnly", "false");
  }

  const query = search.toString();
  const path = query
    ? `/v1/subjects/hierarchy/catalog?${query}`
    : "/v1/subjects/hierarchy/catalog";

  return apiClient<{ subjects: Subject[] }>(path);
}

export function createSubject(payload: CreateSubjectInput): Promise<Subject> {
  return apiClient<Subject>("/v1/subjects", {
    method: "POST",
    body: payload,
  });
}

export function updateSubject(
  id: string,
  payload: UpdateSubjectInput,
): Promise<Subject> {
  return apiClient<Subject>(`/v1/subjects/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function activateSubject(id: string): Promise<Subject> {
  return apiClient<Subject>(`/v1/subjects/${id}/activate`, {
    method: "POST",
  });
}

export function deactivateSubject(id: string): Promise<Subject> {
  return apiClient<Subject>(`/v1/subjects/${id}/deactivate`, {
    method: "POST",
  });
}

export function deleteSubject(id: string): Promise<void> {
  return apiClient<void>(`/v1/subjects/${id}`, {
    method: "DELETE",
  });
}
