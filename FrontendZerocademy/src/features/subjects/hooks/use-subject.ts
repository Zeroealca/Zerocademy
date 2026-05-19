import { useQuery } from "@tanstack/react-query";
import { fetchSubject } from "@/features/subjects/api/subjects.api";
import { subjectsKeys } from "@/features/subjects/api/subjects.keys";

export function useSubject(id: string) {
  return useQuery({
    queryKey: subjectsKeys.detail(id),
    queryFn: () => fetchSubject(id),
    enabled: Boolean(id),
  });
}
