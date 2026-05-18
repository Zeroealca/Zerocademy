import { useQuery } from "@tanstack/react-query";
import { fetchGradeLevels } from "@/features/grade-levels/api/grade-levels.api";
import { gradeLevelsKeys } from "@/features/grade-levels/api/grade-levels.keys";
import type { GradeLevelsFilters } from "@/features/grade-levels/types";

export function useGradeLevels(filters: GradeLevelsFilters) {
  return useQuery({
    queryKey: gradeLevelsKeys.list(filters),
    queryFn: () => fetchGradeLevels(filters),
  });
}
