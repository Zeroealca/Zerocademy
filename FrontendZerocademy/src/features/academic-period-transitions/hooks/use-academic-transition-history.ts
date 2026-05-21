import { useQuery } from "@tanstack/react-query";
import { fetchAcademicTransitionHistory } from "@/features/academic-period-transitions/api/academic-period-transitions.api";
import { academicPeriodTransitionsKeys } from "@/features/academic-period-transitions/api/academic-period-transitions.keys";

export function useAcademicTransitionHistory(
  institutionId: string,
  page: number,
  limit: number,
) {
  return useQuery({
    queryKey: academicPeriodTransitionsKeys.history(institutionId, page, limit),
    queryFn: () => fetchAcademicTransitionHistory(institutionId, page, limit),
    enabled: Boolean(institutionId),
  });
}
