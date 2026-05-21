import type { InstitutionsFilters } from "@/features/institutions/types";

export const institutionsKeys = {
  all: ["institutions"] as const,
  lists: () => [...institutionsKeys.all, "list"] as const,
  list: (filters: InstitutionsFilters) =>
    [...institutionsKeys.lists(), filters] as const,
  details: () => [...institutionsKeys.all, "detail"] as const,
  detail: (id: string) => [...institutionsKeys.details(), id] as const,
};
