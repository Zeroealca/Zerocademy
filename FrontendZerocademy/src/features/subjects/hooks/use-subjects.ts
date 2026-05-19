import { useQuery } from "@tanstack/react-query";
import { fetchSubjects } from "@/features/subjects/api/subjects.api";
import { subjectsKeys } from "@/features/subjects/api/subjects.keys";
import type { SubjectsFilters } from "@/features/subjects/types";

export function useSubjects(filters: SubjectsFilters) {
  return useQuery({
    queryKey: subjectsKeys.list(filters),
    queryFn: () => fetchSubjects(filters),
  });
}
