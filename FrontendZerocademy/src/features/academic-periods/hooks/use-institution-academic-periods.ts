"use client";

import { useAcademicPeriodContext } from "@/features/academic-periods/hooks/use-academic-period-context";
import { useAcademicPeriods } from "@/features/academic-periods/hooks/use-academic-periods";
import type { AcademicPeriodsFilters } from "@/features/academic-periods/types";

type InstitutionPeriodFilters = Omit<
  AcademicPeriodsFilters,
  "institutionId" | "regime"
>;

/**
 * Lists calendar periods for the actor's institution regime (Costa/Galápagos or Sierra/Amazonía).
 */
export function useInstitutionAcademicPeriods(
  filters: InstitutionPeriodFilters = { page: 1, limit: 100 },
) {
  const { data: context, isLoading: contextLoading } = useAcademicPeriodContext();

  const query = useAcademicPeriods({
    ...filters,
    institutionId: context?.institutionId,
    regime: context?.institutionRegime,
  });

  const hasInstitutionScope = Boolean(context?.institutionId);
  const hasRegime = Boolean(context?.institutionRegime);

  return {
    ...query,
    institutionId: context?.institutionId,
    institutionRegime: context?.institutionRegime,
    contextLoading,
    hasInstitutionScope,
    hasRegime,
    isScopeReady: !contextLoading && hasInstitutionScope && hasRegime,
  };
}
