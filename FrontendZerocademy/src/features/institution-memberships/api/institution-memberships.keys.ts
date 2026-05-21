import type { InstitutionMembershipsFilters } from "@/features/institution-memberships/types";

export const institutionMembershipsKeys = {
  all: ["institution-memberships"] as const,
  lists: () => [...institutionMembershipsKeys.all, "list"] as const,
  list: (institutionId: string, filters: InstitutionMembershipsFilters) =>
    [...institutionMembershipsKeys.lists(), institutionId, filters] as const,
  detail: (institutionId: string, membershipId: string) =>
    [...institutionMembershipsKeys.all, "detail", institutionId, membershipId] as const,
};
