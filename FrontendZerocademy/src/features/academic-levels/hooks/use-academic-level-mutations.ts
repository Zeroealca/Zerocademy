import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  activateAcademicLevel,
  createAcademicLevel,
  deactivateAcademicLevel,
  deleteAcademicLevel,
  updateAcademicLevel,
} from "@/features/academic-levels/api/academic-levels.api";
import { academicLevelsKeys } from "@/features/academic-levels/api/academic-levels.keys";
import type {
  CreateAcademicLevelInput,
  UpdateAcademicLevelInput,
} from "@/features/academic-levels/types";

export function useCreateAcademicLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAcademicLevelInput) =>
      createAcademicLevel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicLevelsKeys.all });
    },
  });
}

export function useUpdateAcademicLevel(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAcademicLevelInput) =>
      updateAcademicLevel(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicLevelsKeys.all });
    },
  });
}

export function useActivateAcademicLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateAcademicLevel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicLevelsKeys.all });
    },
  });
}

export function useDeactivateAcademicLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateAcademicLevel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicLevelsKeys.all });
    },
  });
}

export function useDeleteAcademicLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAcademicLevel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicLevelsKeys.all });
    },
  });
}
