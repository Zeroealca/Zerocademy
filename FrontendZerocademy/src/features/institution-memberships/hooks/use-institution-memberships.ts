import { useQuery } from "@tanstack/react-query";
import { fetchInstitutionMemberships } from "@/features/institution-memberships/api/institution-memberships.api";
import { institutionMembershipsKeys } from "@/features/institution-memberships/api/institution-memberships.keys";
import type { InstitutionMembershipsFilters } from "@/features/institution-memberships/types";

export function useInstitutionMemberships(
  institutionId: string,
  filters: InstitutionMembershipsFilters,
) {
  return useQuery({
    queryKey: institutionMembershipsKeys.list(institutionId, filters),
    queryFn: () => fetchInstitutionMemberships(institutionId, filters),
    enabled: Boolean(institutionId),
  });
}
