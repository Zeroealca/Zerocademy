"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAcademicPeriodContext,
  setSelectedAcademicPeriod,
} from "@/features/academic-periods/api/academic-period-context.api";
import { academicPeriodsKeys } from "@/features/academic-periods/api/academic-periods.keys";
import { canSelectAcademicPeriod } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function useAcademicPeriodContext() {
  const role = useAuthStore((state) => state.user?.role);
  const enabled = canSelectAcademicPeriod(role) || role === "SUPER_ADMIN";

  return useQuery({
    queryKey: academicPeriodsKeys.context(),
    queryFn: fetchAcademicPeriodContext,
    enabled,
    staleTime: 60_000,
  });
}

export function useSetSelectedAcademicPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setSelectedAcademicPeriod,
    onSuccess: (data) => {
      queryClient.setQueryData(academicPeriodsKeys.context(), data);
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      void queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["assessments"] });
      void queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
  });
}

export function useEffectiveAcademicPeriodId(): string | undefined {
  const { data } = useAcademicPeriodContext();
  return data?.effectivePeriod?.id;
}
