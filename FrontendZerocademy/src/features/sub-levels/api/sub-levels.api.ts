import { apiClient } from "@/lib/api-client";
import type {
  SubLevelsFilters,
  SubLevelsListResponse,
} from "@/features/sub-levels/types";

export function fetchSubLevels(
  filters: SubLevelsFilters,
): Promise<SubLevelsListResponse> {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });
  if (filters.institutionId) params.set("institutionId", filters.institutionId);
  if (filters.academicLevelId)
    params.set("academicLevelId", filters.academicLevelId);
  if (filters.isActive !== undefined)
    params.set("isActive", String(filters.isActive));
  if (filters.isSystem !== undefined)
    params.set("isSystem", String(filters.isSystem));
  if (filters.search) params.set("search", filters.search);
  return apiClient<SubLevelsListResponse>(
    `/v1/sub-levels?${params.toString()}`,
  );
}
