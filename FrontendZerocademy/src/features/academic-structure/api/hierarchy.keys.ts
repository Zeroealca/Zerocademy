import type { AcademicHierarchyFilters } from "@/features/academic-structure/types";

export const academicHierarchyKeys = {
  all: ["academic-hierarchy"] as const,
  tree: (filters: AcademicHierarchyFilters) =>
    [...academicHierarchyKeys.all, "tree", filters] as const,
};
