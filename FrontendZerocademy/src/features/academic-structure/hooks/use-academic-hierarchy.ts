import { useQuery } from "@tanstack/react-query";
import { fetchAcademicHierarchy } from "@/features/academic-structure/api/hierarchy.api";
import { academicHierarchyKeys } from "@/features/academic-structure/api/hierarchy.keys";
import type { AcademicHierarchyFilters } from "@/features/academic-structure/types";

export function useAcademicHierarchy(filters: AcademicHierarchyFilters) {
  return useQuery({
    queryKey: academicHierarchyKeys.tree(filters),
    queryFn: () => fetchAcademicHierarchy(filters),
  });
}
