"use client";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import {
  useAcademicPeriodContext,
  useSetSelectedAcademicPeriod,
} from "@/features/academic-periods/hooks/use-academic-period-context";
import { useInstitutionAcademicPeriods } from "@/features/academic-periods/hooks/use-institution-academic-periods";
import { canSelectAcademicPeriod } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function AcademicPeriodSelector() {
  const role = useAuthStore((state) => state.user?.role);

  if (!canSelectAcademicPeriod(role)) {
    return null;
  }

  return <AcademicPeriodSelectorInner />;
}

function AcademicPeriodSelectorInner() {
  const { data: context, isLoading: contextLoading } = useAcademicPeriodContext();
  const {
    data: periodsData,
    isLoading: periodsLoading,
    hasInstitutionScope,
    hasRegime,
    isScopeReady,
  } = useInstitutionAcademicPeriods();
  const setPeriod = useSetSelectedAcademicPeriod();

  const effectiveId = context?.effectivePeriod?.id ?? "";
  const periods = periodsData?.data ?? [];

  const emptyHint = !contextLoading && !hasInstitutionScope
    ? "Sin institución asignada"
    : !contextLoading && hasInstitutionScope && !hasRegime
      ? "Institución sin régimen"
      : periods.length === 0 && isScopeReady
        ? "Sin períodos para este régimen"
        : "Seleccionar período";

  return (
    <div className="hidden min-w-[200px] flex-col gap-1 sm:flex">
      <Label htmlFor="header-period" className="sr-only">
        Período académico
      </Label>
      <Select
        id="header-period"
        value={effectiveId}
        disabled={
          contextLoading ||
          periodsLoading ||
          setPeriod.isPending ||
          !isScopeReady
        }
        onChange={(event) => {
          const nextId = event.target.value;
          if (nextId && nextId !== effectiveId) {
            void setPeriod.mutateAsync(nextId);
          }
        }}
        className="h-9 text-xs"
        aria-label="Período académico seleccionado"
      >
        <option value="">
          {contextLoading || periodsLoading ? "Cargando…" : emptyHint}
        </option>
        {periods.map((period) => (
          <option key={period.id} value={period.id}>
            {formatAcademicPeriodOptionLabel(period)}
          </option>
        ))}
      </Select>
    </div>
  );
}
