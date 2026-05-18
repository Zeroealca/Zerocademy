import type { GradeLevelsFilters } from "@/features/grade-levels/types";

export const gradeLevelsKeys = {
  all: ["grade-levels"] as const,
  lists: () => [...gradeLevelsKeys.all, "list"] as const,
  list: (filters: GradeLevelsFilters) =>
    [...gradeLevelsKeys.lists(), filters] as const,
  details: () => [...gradeLevelsKeys.all, "detail"] as const,
  detail: (id: string) => [...gradeLevelsKeys.details(), id] as const,
};
