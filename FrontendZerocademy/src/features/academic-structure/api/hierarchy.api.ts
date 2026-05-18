import type {
  AcademicHierarchyFilters,
  AcademicHierarchyResponse,
} from "@/features/academic-structure/types";
import { apiClient } from "@/lib/api-client";

function buildHierarchyQuery(filters: AcademicHierarchyFilters): string {
  const params = new URLSearchParams();

  if (filters.academicPeriodId) {
    params.set("academicPeriodId", filters.academicPeriodId);
  }

  if (filters.institutionId) {
    params.set("institutionId", filters.institutionId);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function fetchAcademicHierarchy(
  filters: AcademicHierarchyFilters,
): Promise<AcademicHierarchyResponse> {
  const query = buildHierarchyQuery(filters);
  return apiClient<AcademicHierarchyResponse>(
    `/v1/academic-levels/hierarchy/tree${query}`,
  );
}
