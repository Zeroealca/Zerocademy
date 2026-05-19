import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTeacherAssignment,
  deleteTeacherAssignment,
  updateTeacherAssignment,
} from "@/features/teacher-assignments/api/teacher-assignments.api";
import { teacherAssignmentsKeys } from "@/features/teacher-assignments/api/teacher-assignments.keys";
import type {
  CreateTeacherAssignmentInput,
  UpdateTeacherAssignmentInput,
} from "@/features/teacher-assignments/types";

export function useCreateTeacherAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTeacherAssignmentInput) =>
      createTeacherAssignment(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: teacherAssignmentsKeys.all,
      });
    },
  });
}

export function useUpdateTeacherAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTeacherAssignmentInput;
    }) => updateTeacherAssignment(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: teacherAssignmentsKeys.all,
      });
    },
  });
}

export function useDeleteTeacherAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTeacherAssignment,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: teacherAssignmentsKeys.all,
      });
    },
  });
}
