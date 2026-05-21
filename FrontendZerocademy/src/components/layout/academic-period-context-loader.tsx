"use client";

import { useAcademicPeriodContext } from "@/features/academic-periods/hooks/use-academic-period-context";
import { canSelectAcademicPeriod } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

/** Prefetches academic period context for the header selector and list filters. */
export function AcademicPeriodContextLoader() {
  const role = useAuthStore((state) => state.user?.role);

  if (!canSelectAcademicPeriod(role)) {
    return null;
  }

  useAcademicPeriodContext();
  return null;
}
