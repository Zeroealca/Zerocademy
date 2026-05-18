import { useQuery } from "@tanstack/react-query";
import { fetchCourse } from "@/features/courses/api/courses.api";
import { coursesKeys } from "@/features/courses/api/courses.keys";

export function useCourse(id: string) {
  return useQuery({
    queryKey: coursesKeys.detail(id),
    queryFn: () => fetchCourse(id),
    enabled: Boolean(id),
  });
}
