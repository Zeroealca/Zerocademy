import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAcademicTerm,
  deleteAcademicTerm,
  fetchAcademicTerms,
  updateAcademicTerm,
} from "@/features/academic-periods/api/academic-periods.api";
import { academicPeriodsKeys } from "@/features/academic-periods/api/academic-periods.keys";
import type {
  CreateAcademicTermInput,
  UpdateAcademicTermInput,
} from "@/features/academic-periods/types";

export function useAcademicTerms(periodId: string) {
  return useQuery({
    queryKey: academicPeriodsKeys.terms(periodId),
    queryFn: () => fetchAcademicTerms(periodId),
    enabled: Boolean(periodId),
  });
}

export function useCreateAcademicTerm(periodId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAcademicTermInput) =>
      createAcademicTerm(periodId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: academicPeriodsKeys.terms(periodId),
      });
      queryClient.invalidateQueries({
        queryKey: academicPeriodsKeys.detail(periodId),
      });
    },
  });
}

export function useUpdateAcademicTerm(periodId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      termId,
      payload,
    }: {
      termId: string;
      payload: UpdateAcademicTermInput;
    }) => updateAcademicTerm(periodId, termId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: academicPeriodsKeys.terms(periodId),
      });
      queryClient.invalidateQueries({
        queryKey: academicPeriodsKeys.detail(periodId),
      });
    },
  });
}

export function useDeleteAcademicTerm(periodId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (termId: string) => deleteAcademicTerm(periodId, termId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: academicPeriodsKeys.terms(periodId),
      });
      queryClient.invalidateQueries({
        queryKey: academicPeriodsKeys.detail(periodId),
      });
    },
  });
}
