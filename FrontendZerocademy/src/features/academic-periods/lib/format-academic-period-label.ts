import { REGIME_LABELS } from "@/features/academic-periods/constants";
import type { AcademicPeriodStatus, AcademicRegime } from "@/features/academic-periods/types";

/** Label for period selects: «2025-2026 · Costa y Galápagos». */
export function formatAcademicPeriodOptionLabel(period: {
  name: string;
  regime: AcademicRegime;
  status: AcademicPeriodStatus;
}): string {
  return `${period.name} · ${REGIME_LABELS[period.regime]}${period.status === "ACTIVE" ? " (Activo)" : ""}`;
}
