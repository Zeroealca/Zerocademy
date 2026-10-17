"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTimetable, fetchTimetableValidation, fetchTimetables } from "@/features/timetables/api/timetables.api";
import { timetablesKeys } from "@/features/timetables/api/timetables.keys";

export function useTimetables(institutionId?: string, academicPeriodId?: string) {
  return useQuery({
    queryKey: timetablesKeys.list(institutionId ?? "", academicPeriodId ?? ""),
    queryFn: () => fetchTimetables(institutionId!, academicPeriodId!),
    enabled: Boolean(institutionId && academicPeriodId),
  });
}

export function useTimetable(timetableId?: string) {
  return useQuery({
    queryKey: timetablesKeys.detail(timetableId ?? ""),
    queryFn: () => fetchTimetable(timetableId!),
    enabled: Boolean(timetableId),
  });
}

export function useTimetableValidation(timetableId?: string) {
  return useQuery({
    queryKey: timetablesKeys.timetableValidation(timetableId ?? ""),
    queryFn: () => fetchTimetableValidation(timetableId!),
    enabled: Boolean(timetableId),
  });
}
