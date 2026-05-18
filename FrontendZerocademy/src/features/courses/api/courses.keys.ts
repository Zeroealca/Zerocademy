import type { CoursesFilters } from "@/features/courses/types";

export const coursesKeys = {
  all: ["courses"] as const,
  lists: () => [...coursesKeys.all, "list"] as const,
  list: (filters: CoursesFilters) => [...coursesKeys.lists(), filters] as const,
  details: () => [...coursesKeys.all, "detail"] as const,
  detail: (id: string) => [...coursesKeys.details(), id] as const,
};
