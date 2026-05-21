"use client";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import { useAcademicPeriods } from "@/features/academic-periods/hooks/use-academic-periods";
import {
  useAcademicPeriodContext,
  useSetSelectedAcademicPeriod,
} from "@/features/academic-periods/hooks/use-academic-period-context";
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
  const { data: periodsData, isLoading: periodsLoading } = useAcademicPeriods({
    page: 1,
    limit: 100,
    institutionId: context?.institutionId,
  });
  const setPeriod = useSetSelectedAcademicPeriod();

  const effectiveId = context?.effectivePeriod?.id ?? "";
  const periods = periodsData?.data ?? [];

  return (
    <div className="hidden min-w-[200px] flex-col gap-1 sm:flex">
      <Label htmlFor="header-period" className="sr-only">
        Período académico
      </Label>
      <Select
        id="header-period"
        value={effectiveId}
        disabled={contextLoading || periodsLoading || setPeriod.isPending}
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
          {contextLoading ? "Cargando…" : "Seleccionar período"}
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
