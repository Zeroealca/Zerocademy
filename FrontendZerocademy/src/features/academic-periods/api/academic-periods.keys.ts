import type { AcademicPeriodsFilters } from "@/features/academic-periods/types";

export const academicPeriodsKeys = {
  all: ["academic-periods"] as const,
  lists: () => [...academicPeriodsKeys.all, "list"] as const,
  list: (filters: AcademicPeriodsFilters) =>
    [...academicPeriodsKeys.lists(), filters] as const,
  details: () => [...academicPeriodsKeys.all, "detail"] as const,
  detail: (id: string) => [...academicPeriodsKeys.details(), id] as const,
  active: (regime: string) =>
    [...academicPeriodsKeys.all, "active", regime] as const,
  terms: (periodId: string) =>
    [...academicPeriodsKeys.all, "terms", periodId] as const,
};
