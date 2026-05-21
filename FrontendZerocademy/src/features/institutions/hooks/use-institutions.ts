import { useQuery } from "@tanstack/react-query";
import { fetchInstitutions } from "@/features/institutions/api/institutions.api";
import { institutionsKeys } from "@/features/institutions/api/institutions.keys";
import type { InstitutionsFilters } from "@/features/institutions/types";

export function useInstitutions(filters: InstitutionsFilters) {
  return useQuery({
    queryKey: institutionsKeys.list(filters),
    queryFn: () => fetchInstitutions(filters),
  });
}
