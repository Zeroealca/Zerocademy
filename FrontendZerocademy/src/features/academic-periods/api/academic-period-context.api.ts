import { apiClient } from "@/lib/api-client";
import type { AcademicPeriod } from "@/features/academic-periods/types";
import type { AcademicRegime } from "@/features/academic-periods/types";

export interface ActivePeriodByRegime {
  regime: AcademicRegime;
  period: AcademicPeriod | null;
}

export interface AcademicPeriodContext {
  selectedPeriod: AcademicPeriod | null;
  effectivePeriod: AcademicPeriod | null;
  activeByRegime: ActivePeriodByRegime[];
  institutionId?: string;
  institutionRegime?: AcademicRegime;
}

export function fetchAcademicPeriodContext(): Promise<AcademicPeriodContext> {
  return apiClient<AcademicPeriodContext>("/v1/academic-periods/context");
}

export function setSelectedAcademicPeriod(
  academicPeriodId: string,
): Promise<AcademicPeriodContext> {
  return apiClient<AcademicPeriodContext>("/v1/academic-periods/context/selection", {
    method: "PUT",
    body: { academicPeriodId },
  });
}
