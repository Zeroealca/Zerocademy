import { useQuery } from "@tanstack/react-query";
import { fetchAcademicPeriods } from "@/features/academic-periods/api/academic-periods.api";
import { academicPeriodsKeys } from "@/features/academic-periods/api/academic-periods.keys";
import type { AcademicPeriodsFilters } from "@/features/academic-periods/types";

export function useAcademicPeriods(filters: AcademicPeriodsFilters) {
  return useQuery({
    queryKey: academicPeriodsKeys.list(filters),
    queryFn: () => fetchAcademicPeriods(filters),
  });
}
