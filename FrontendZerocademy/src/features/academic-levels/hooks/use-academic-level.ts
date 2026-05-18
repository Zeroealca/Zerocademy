import { useQuery } from "@tanstack/react-query";
import { fetchAcademicLevel } from "@/features/academic-levels/api/academic-levels.api";
import { academicLevelsKeys } from "@/features/academic-levels/api/academic-levels.keys";

export function useAcademicLevel(id: string) {
  return useQuery({
    queryKey: academicLevelsKeys.detail(id),
    queryFn: () => fetchAcademicLevel(id),
    enabled: Boolean(id),
  });
}
