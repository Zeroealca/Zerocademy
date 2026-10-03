import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStudentRepresentative,
  deactivateStudentRepresentative,
  fetchMyRepresentativeStudents,
  fetchStudentRepresentatives,
  updateStudentRepresentative,
} from "@/features/representatives/api/representatives.api";
import { representativeKeys } from "@/features/representatives/api/representatives.keys";
import type {
  CreateRepresentativeStudentInput,
  UpdateRepresentativeStudentInput,
} from "@/features/representatives/types";

export function useMyRepresentativeStudents(enabled = true) {
  return useQuery({
    queryKey: representativeKeys.myStudents(),
    queryFn: fetchMyRepresentativeStudents,
    enabled,
  });
}

export function useStudentRepresentatives(studentId: string, enabled = true) {
  return useQuery({
    queryKey: representativeKeys.forStudent(studentId),
    queryFn: () => fetchStudentRepresentatives(studentId),
    enabled: enabled && Boolean(studentId),
  });
}

export function useStudentRepresentativeMutations(studentId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: representativeKeys.forStudent(studentId),
    });

  const createMutation = useMutation({
    mutationFn: (payload: CreateRepresentativeStudentInput) =>
      createStudentRepresentative(studentId, payload),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      relationshipId,
      payload,
    }: {
      relationshipId: string;
      payload: UpdateRepresentativeStudentInput;
    }) => updateStudentRepresentative(relationshipId, payload),
    onSuccess: invalidate,
  });

  const deactivateMutation = useMutation({
    mutationFn: (relationshipId: string) =>
      deactivateStudentRepresentative(relationshipId),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deactivateMutation };
}
