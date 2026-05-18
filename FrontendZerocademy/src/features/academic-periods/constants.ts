import type {
  AcademicPeriodStatus,
  AcademicRegime,
} from "@/features/academic-periods/types";

export const ACADEMIC_REGIMES: AcademicRegime[] = [
  "COSTA_GALAPAGOS",
  "SIERRA_AMAZONIA",
];

export const ACADEMIC_PERIOD_STATUSES: AcademicPeriodStatus[] = [
  "PLANNED",
  "ACTIVE",
  "CLOSED",
  "ARCHIVED",
];

export const REGIME_LABELS: Record<AcademicRegime, string> = {
  COSTA_GALAPAGOS: "Costa y Galápagos",
  SIERRA_AMAZONIA: "Sierra y Amazonía",
};

export const STATUS_LABELS: Record<AcademicPeriodStatus, string> = {
  PLANNED: "Planificado",
  ACTIVE: "Activo",
  CLOSED: "Cerrado",
  ARCHIVED: "Archivado",
};

export const STATUS_VARIANTS: Record<
  AcademicPeriodStatus,
  "default" | "success" | "secondary" | "muted"
> = {
  PLANNED: "secondary",
  ACTIVE: "success",
  CLOSED: "muted",
  ARCHIVED: "default",
};
