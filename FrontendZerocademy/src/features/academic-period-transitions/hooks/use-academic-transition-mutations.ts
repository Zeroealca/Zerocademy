import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  executeAcademicTransition,
  previewAcademicTransition,
  setActiveAcademicPeriodForInstitution,
} from "@/features/academic-period-transitions/api/academic-period-transitions.api";
import { academicPeriodTransitionsKeys } from "@/features/academic-period-transitions/api/academic-period-transitions.keys";
import type {
  AcademicTransitionRequest,
  SetActiveAcademicPeriodInput,
} from "@/features/academic-period-transitions/types";
import { academicPeriodsKeys } from "@/features/academic-periods/api/academic-periods.keys";

export function useAcademicTransitionMutations(institutionId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: academicPeriodTransitionsKeys.all,
    });
    void queryClient.invalidateQueries({ queryKey: academicPeriodsKeys.all });
  };

  const previewMutation = useMutation({
    mutationFn: (payload: AcademicTransitionRequest) =>
      previewAcademicTransition(institutionId, payload),
  });

  const executeMutation = useMutation({
    mutationFn: (payload: AcademicTransitionRequest) =>
      executeAcademicTransition(institutionId, payload),
    onSuccess: invalidate,
  });

  const setActivePeriodMutation = useMutation({
    mutationFn: (payload: SetActiveAcademicPeriodInput) =>
      setActiveAcademicPeriodForInstitution(institutionId, payload),
    onSuccess: invalidate,
  });

  return { previewMutation, executeMutation, setActivePeriodMutation };
}
