import type { AcademicLevelsFilters } from "@/features/academic-levels/types";

export const academicLevelsKeys = {
  all: ["academic-levels"] as const,
  lists: () => [...academicLevelsKeys.all, "list"] as const,
  list: (filters: AcademicLevelsFilters) =>
    [...academicLevelsKeys.lists(), filters] as const,
  details: () => [...academicLevelsKeys.all, "detail"] as const,
  detail: (id: string) => [...academicLevelsKeys.details(), id] as const,
};
