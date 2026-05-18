import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  activateGradeLevel,
  createGradeLevel,
  deactivateGradeLevel,
  deleteGradeLevel,
  updateGradeLevel,
} from "@/features/grade-levels/api/grade-levels.api";
import { gradeLevelsKeys } from "@/features/grade-levels/api/grade-levels.keys";
import type {
  CreateGradeLevelInput,
  UpdateGradeLevelInput,
} from "@/features/grade-levels/types";

export function useCreateGradeLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGradeLevelInput) => createGradeLevel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeLevelsKeys.all });
    },
  });
}

export function useUpdateGradeLevel(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateGradeLevelInput) =>
      updateGradeLevel(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeLevelsKeys.all });
    },
  });
}

export function useActivateGradeLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateGradeLevel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeLevelsKeys.all });
    },
  });
}

export function useDeactivateGradeLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateGradeLevel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeLevelsKeys.all });
    },
  });
}

export function useDeleteGradeLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGradeLevel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeLevelsKeys.all });
    },
  });
}
