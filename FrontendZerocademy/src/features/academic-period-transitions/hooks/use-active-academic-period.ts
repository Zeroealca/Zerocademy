import { useQuery } from "@tanstack/react-query";
import { fetchActiveAcademicPeriodForInstitution } from "@/features/academic-period-transitions/api/academic-period-transitions.api";
import { academicPeriodTransitionsKeys } from "@/features/academic-period-transitions/api/academic-period-transitions.keys";

export function useActiveAcademicPeriod(institutionId: string) {
  return useQuery({
    queryKey: academicPeriodTransitionsKeys.activePeriod(institutionId),
    queryFn: () => fetchActiveAcademicPeriodForInstitution(institutionId),
    enabled: Boolean(institutionId),
  });
}
