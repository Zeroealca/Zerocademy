import { useQuery } from "@tanstack/react-query";
import { fetchGradeLevel } from "@/features/grade-levels/api/grade-levels.api";
import { gradeLevelsKeys } from "@/features/grade-levels/api/grade-levels.keys";

export function useGradeLevel(id: string) {
  return useQuery({
    queryKey: gradeLevelsKeys.detail(id),
    queryFn: () => fetchGradeLevel(id),
    enabled: Boolean(id),
  });
}
