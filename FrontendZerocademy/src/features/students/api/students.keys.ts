import type { StudentsFilters } from "@/features/students/types";

export const studentsKeys = {
  all: ["students"] as const,
  lists: () => [...studentsKeys.all, "list"] as const,
  list: (filters: StudentsFilters) =>
    [...studentsKeys.lists(), filters] as const,
  details: () => [...studentsKeys.all, "detail"] as const,
  detail: (id: string) => [...studentsKeys.details(), id] as const,
  me: () => [...studentsKeys.all, "me"] as const,
};
