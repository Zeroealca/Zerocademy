import { useQuery } from "@tanstack/react-query";
import { fetchAcademicPeriod } from "@/features/academic-periods/api/academic-periods.api";
import { academicPeriodsKeys } from "@/features/academic-periods/api/academic-periods.keys";

export function useAcademicPeriod(id: string) {
  return useQuery({
    queryKey: academicPeriodsKeys.detail(id),
    queryFn: () => fetchAcademicPeriod(id),
    enabled: Boolean(id),
  });
}
