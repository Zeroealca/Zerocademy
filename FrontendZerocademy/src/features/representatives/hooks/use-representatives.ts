import { useQuery } from "@tanstack/react-query";
import { fetchMyRepresentativeStudents } from "@/features/representatives/api/representatives.api";
import { representativeKeys } from "@/features/representatives/api/representatives.keys";

export function useMyRepresentativeStudents(enabled = true) {
  return useQuery({ queryKey: representativeKeys.myStudents(), queryFn: fetchMyRepresentativeStudents, enabled });
}
