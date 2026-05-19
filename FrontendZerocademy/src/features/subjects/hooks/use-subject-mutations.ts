import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  activateSubject,
  createSubject,
  deactivateSubject,
  deleteSubject,
  updateSubject,
} from "@/features/subjects/api/subjects.api";
import { subjectsKeys } from "@/features/subjects/api/subjects.keys";
import type {
  CreateSubjectInput,
  UpdateSubjectInput,
} from "@/features/subjects/types";

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSubjectInput) => createSubject(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectsKeys.all });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSubjectInput;
    }) => updateSubject(id, payload),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: subjectsKeys.all });
      void queryClient.invalidateQueries({ queryKey: subjectsKeys.detail(id) });
    },
  });
}

export function useActivateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateSubject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectsKeys.all });
    },
  });
}

export function useDeactivateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateSubject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectsKeys.all });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectsKeys.all });
    },
  });
}
