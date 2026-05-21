import type { AcademicRegime, InstitutionRegion } from "@/features/institutions/types";

export const INSTITUTION_REGIONS: InstitutionRegion[] = [
  "COSTA",
  "SIERRA",
  "AMAZONIA",
  "GALAPAGOS",
];

export const ACADEMIC_REGIMES: AcademicRegime[] = [
  "COSTA_GALAPAGOS",
  "SIERRA_AMAZONIA",
];

export const REGION_LABELS: Record<InstitutionRegion, string> = {
  COSTA: "Costa",
  SIERRA: "Sierra",
  AMAZONIA: "Amazonía",
  GALAPAGOS: "Galápagos",
};

export const REGIME_LABELS: Record<AcademicRegime, string> = {
  COSTA_GALAPAGOS: "Costa y Galápagos",
  SIERRA_AMAZONIA: "Sierra y Amazonía",
};

export const STATUS_LABELS = {
  active: "Activa",
  inactive: "Inactiva",
} as const;
