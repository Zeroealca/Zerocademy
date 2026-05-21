import { useQuery } from "@tanstack/react-query";
import { fetchInstitution } from "@/features/institutions/api/institutions.api";
import { institutionsKeys } from "@/features/institutions/api/institutions.keys";

export function useInstitution(id: string) {
  return useQuery({
    queryKey: institutionsKeys.detail(id),
    queryFn: () => fetchInstitution(id),
    enabled: Boolean(id),
  });
}
