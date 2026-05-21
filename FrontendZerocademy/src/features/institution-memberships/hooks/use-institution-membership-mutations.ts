import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  activateInstitutionMembership,
  assignInstitutionMembership,
  deactivateInstitutionMembership,
  removeInstitutionMembership,
} from "@/features/institution-memberships/api/institution-memberships.api";
import { institutionMembershipsKeys } from "@/features/institution-memberships/api/institution-memberships.keys";
import type { CreateInstitutionMembershipInput } from "@/features/institution-memberships/types";

export function useInstitutionMembershipMutations(institutionId: string) {
  const queryClient = useQueryClient();

  const invalidate = () =>
    void queryClient.invalidateQueries({
      queryKey: institutionMembershipsKeys.lists(),
    });

  const assignMutation = useMutation({
    mutationFn: (payload: CreateInstitutionMembershipInput) =>
      assignInstitutionMembership(institutionId, payload),
    onSuccess: invalidate,
  });

  const activateMutation = useMutation({
    mutationFn: (membershipId: string) =>
      activateInstitutionMembership(institutionId, membershipId),
    onSuccess: invalidate,
  });

  const deactivateMutation = useMutation({
    mutationFn: (membershipId: string) =>
      deactivateInstitutionMembership(institutionId, membershipId),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (membershipId: string) =>
      removeInstitutionMembership(institutionId, membershipId),
    onSuccess: invalidate,
  });

  return {
    assignMutation,
    activateMutation,
    deactivateMutation,
    removeMutation,
  };
}
