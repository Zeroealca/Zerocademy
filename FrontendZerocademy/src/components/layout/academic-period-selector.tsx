"use client";

import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import { useAcademicPeriodContext } from "@/features/academic-periods/hooks/use-academic-period-context";
import { canSelectAcademicPeriod } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function AcademicPeriodSelector() {
  const role = useAuthStore((state) => state.user?.role);
  if (!canSelectAcademicPeriod(role)) return null;
  return <ActiveAcademicPeriodLabel />;
}

function ActiveAcademicPeriodLabel() {
  const { data: context, isLoading, isError } = useAcademicPeriodContext();
  const period = context?.effectivePeriod;
  const activePeriod = period?.status === "ACTIVE" && period.isActive ? period : null;
  const label = isLoading
    ? "Cargando periodo lectivo..."
    : isError
      ? "No se pudo cargar el periodo activo"
      : activePeriod
        ? formatAcademicPeriodOptionLabel(activePeriod)
        : "Sin periodo lectivo activo";

  return (
    <span
      className="hidden max-w-full text-xs text-muted-foreground sm:block"
      aria-label="Periodo lectivo activo"
      aria-live="polite"
    >
      {label}
    </span>
  );
}
