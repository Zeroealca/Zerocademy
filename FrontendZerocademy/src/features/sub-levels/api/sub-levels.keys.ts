import type { SubLevelsFilters } from "@/features/sub-levels/types";
export const subLevelsKeys = {
  all: ["sub-levels"] as const,
  lists: () => [...subLevelsKeys.all, "list"] as const,
  list: (filters: SubLevelsFilters) =>
    [...subLevelsKeys.lists(), filters] as const,
};
