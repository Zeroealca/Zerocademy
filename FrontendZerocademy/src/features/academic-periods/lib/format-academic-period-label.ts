import { REGIME_LABELS } from "@/features/academic-periods/constants";
import type { AcademicRegime } from "@/features/academic-periods/types";

/** Label for period selects: «2025-2026 · Costa y Galápagos». */
export function formatAcademicPeriodOptionLabel(period: {
  name: string;
  regime: AcademicRegime;
}): string {
  return `${period.name} · ${REGIME_LABELS[period.regime]}`;
}
