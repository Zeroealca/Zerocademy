"use client";

import { useAcademicPeriodContext } from "@/features/academic-periods/hooks/use-academic-period-context";

/** Prefetches academic period context for the header selector and list filters. */
export function AcademicPeriodContextLoader() {
  // Hook must always run; enablement is handled inside useAcademicPeriodContext.
  useAcademicPeriodContext();
  return null;
}
