"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMyStudent } from "@/features/students/api/students.api";
import { studentsKeys } from "@/features/students/api/students.keys";

export function useMyStudent() {
  return useQuery({
    queryKey: studentsKeys.me(),
    queryFn: fetchMyStudent,
  });
}
