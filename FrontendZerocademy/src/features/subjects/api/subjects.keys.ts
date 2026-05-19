import type { SubjectsFilters } from "@/features/subjects/types";

export const subjectsKeys = {
  all: ["subjects"] as const,
  lists: () => [...subjectsKeys.all, "list"] as const,
  list: (filters: SubjectsFilters) =>
    [...subjectsKeys.lists(), filters] as const,
  details: () => [...subjectsKeys.all, "detail"] as const,
  detail: (id: string) => [...subjectsKeys.details(), id] as const,
  hierarchy: (params: { gradeLevelId?: string; activeOnly?: boolean }) =>
    [...subjectsKeys.all, "hierarchy", params] as const,
};
