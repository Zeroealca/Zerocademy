import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  activateAcademicPeriod,
  archiveAcademicPeriod,
  createAcademicPeriod,
  deactivateAcademicPeriod,
  deleteAcademicPeriod,
  updateAcademicPeriod,
} from "@/features/academic-periods/api/academic-periods.api";
import { academicPeriodsKeys } from "@/features/academic-periods/api/academic-periods.keys";
import type {
  CreateAcademicPeriodInput,
  UpdateAcademicPeriodInput,
} from "@/features/academic-periods/types";

export function useCreateAcademicPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAcademicPeriodInput) =>
      createAcademicPeriod(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicPeriodsKeys.all });
    },
  });
}

export function useUpdateAcademicPeriod(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAcademicPeriodInput) =>
      updateAcademicPeriod(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicPeriodsKeys.all });
    },
  });
}

export function useDeleteAcademicPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAcademicPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicPeriodsKeys.all });
    },
  });
}

export function useActivateAcademicPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateAcademicPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicPeriodsKeys.all });
    },
  });
}

export function useDeactivateAcademicPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateAcademicPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicPeriodsKeys.all });
    },
  });
}

export function useArchiveAcademicPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveAcademicPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicPeriodsKeys.all });
    },
  });
}
