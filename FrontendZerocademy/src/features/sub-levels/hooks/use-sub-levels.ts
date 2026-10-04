import { useQuery } from "@tanstack/react-query";
import { fetchSubLevels } from "@/features/sub-levels/api/sub-levels.api";
import { subLevelsKeys } from "@/features/sub-levels/api/sub-levels.keys";
import type { SubLevelsFilters } from "@/features/sub-levels/types";
export function useSubLevels(filters: SubLevelsFilters) {
  return useQuery({
    queryKey: subLevelsKeys.list(filters),
    queryFn: () => fetchSubLevels(filters),
  });
}
