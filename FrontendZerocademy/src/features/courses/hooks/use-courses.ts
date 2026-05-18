import { useQuery } from "@tanstack/react-query";
import { fetchCourses } from "@/features/courses/api/courses.api";
import { coursesKeys } from "@/features/courses/api/courses.keys";
import type { CoursesFilters } from "@/features/courses/types";

export function useCourses(filters: CoursesFilters) {
  return useQuery({
    queryKey: coursesKeys.list(filters),
    queryFn: () => fetchCourses(filters),
  });
}
