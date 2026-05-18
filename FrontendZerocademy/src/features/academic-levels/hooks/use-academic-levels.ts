import { useQuery } from "@tanstack/react-query";
import { fetchAcademicLevels } from "@/features/academic-levels/api/academic-levels.api";
import { academicLevelsKeys } from "@/features/academic-levels/api/academic-levels.keys";
import type { AcademicLevelsFilters } from "@/features/academic-levels/types";

export function useAcademicLevels(filters: AcademicLevelsFilters) {
  return useQuery({
    queryKey: academicLevelsKeys.list(filters),
    queryFn: () => fetchAcademicLevels(filters),
  });
}
