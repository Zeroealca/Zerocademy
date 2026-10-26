"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTimetable,
  discardTimetable,
  fetchTeachingLoads,
  fetchMyTimetable,
  fetchMyTodayTimetable,
  fetchRepresentativeStudents,
  fetchRepresentativeTimetable,
  fetchRepresentativeTodayTimetable,
  fetchStudentTimetable,
  fetchStudentTodayTimetable,
  fetchTimetable,
  fetchTimetableValidation,
  fetchTimetables,
  generateTimetable,
  publishTimetable,
  replaceTimetableSlots,
  unpublishTimetable,
} from "@/features/timetables/api/timetables.api";
import { timetablesKeys } from "@/features/timetables/api/timetables.keys";
import type { TimetableSlotInput } from "@/features/timetables/types";

export function useTimetables(
  institutionId?: string,
  academicPeriodId?: string,
) {
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

export function useMyTimetable(academicPeriodId?: string) {
  return useQuery({
    queryKey: timetablesKeys.mine(academicPeriodId ?? ""),
    queryFn: () => fetchMyTimetable(academicPeriodId),
    enabled: Boolean(academicPeriodId),
  });
}

export function useMyTodayTimetable(academicPeriodId?: string) {
  return useQuery({
    queryKey: timetablesKeys.mineToday(academicPeriodId ?? ""),
    queryFn: () => fetchMyTodayTimetable(academicPeriodId),
    enabled: Boolean(academicPeriodId),
  });
}

export function useStudentTimetable(academicPeriodId?: string) {
  return useQuery({
    queryKey: timetablesKeys.student(academicPeriodId ?? ""),
    queryFn: () => fetchStudentTimetable(academicPeriodId),
  });
}

export function useStudentTodayTimetable(academicPeriodId?: string) {
  return useQuery({
    queryKey: timetablesKeys.studentToday(academicPeriodId ?? ""),
    queryFn: () => fetchStudentTodayTimetable(academicPeriodId),
  });
}

export function useRepresentativeStudents(enabled = true) {
  return useQuery({
    queryKey: timetablesKeys.representativeStudents(),
    queryFn: fetchRepresentativeStudents,
    enabled,
  });
}

export function useRepresentativeTimetable(
  studentId?: string,
  academicPeriodId?: string,
) {
  return useQuery({
    queryKey: timetablesKeys.representative(
      studentId ?? "",
      academicPeriodId ?? "",
    ),
    queryFn: () => fetchRepresentativeTimetable(studentId!, academicPeriodId),
    enabled: Boolean(studentId),
  });
}

export function useRepresentativeTodayTimetable(
  studentId?: string,
  academicPeriodId?: string,
) {
  return useQuery({
    queryKey: timetablesKeys.representativeToday(
      studentId ?? "",
      academicPeriodId ?? "",
    ),
    queryFn: () =>
      fetchRepresentativeTodayTimetable(studentId!, academicPeriodId),
    enabled: Boolean(studentId),
  });
}

export function useTimetableValidation(timetableId?: string) {
  return useQuery({
    queryKey: timetablesKeys.timetableValidation(timetableId ?? ""),
    queryFn: () => fetchTimetableValidation(timetableId!),
    enabled: Boolean(timetableId),
  });
}

export function useTeachingLoads(
  institutionId?: string,
  academicPeriodId?: string,
) {
  return useQuery({
    queryKey: timetablesKeys.teachingLoads(
      institutionId ?? "",
      academicPeriodId ?? "",
    ),
    queryFn: () => fetchTeachingLoads(institutionId!, academicPeriodId!),
    enabled: Boolean(institutionId && academicPeriodId),
  });
}

export function useTimetableMutations(
  institutionId: string,
  academicPeriodId: string,
) {
  const queryClient = useQueryClient();
  const invalidate = (timetableId?: string) =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: timetablesKeys.list(institutionId, academicPeriodId),
      }),
      ...(timetableId
        ? [
            queryClient.invalidateQueries({
              queryKey: timetablesKeys.detail(timetableId),
            }),
            queryClient.invalidateQueries({
              queryKey: timetablesKeys.timetableValidation(timetableId),
            }),
          ]
        : []),
    ]);
  return {
    generate: useMutation({
      mutationFn: (maxSearchNodes?: number) =>
        generateTimetable(institutionId, academicPeriodId, maxSearchNodes),
    }),
    create: useMutation({
      mutationFn: (slots: TimetableSlotInput[]) =>
        createTimetable(institutionId, academicPeriodId, slots),
      onSuccess: (result) => invalidate(result.id),
    }),
    replace: useMutation({
      mutationFn: ({
        timetableId,
        expectedVersion,
        slots,
      }: {
        timetableId: string;
        expectedVersion: number;
        slots: TimetableSlotInput[];
      }) => replaceTimetableSlots(timetableId, expectedVersion, slots),
      onSuccess: (result) => invalidate(result.id),
    }),
    publish: useMutation({
      mutationFn: ({
        timetableId,
        expectedVersion,
      }: {
        timetableId: string;
        expectedVersion: number;
      }) => publishTimetable(timetableId, expectedVersion),
      onSuccess: (result) => invalidate(result.id),
    }),
    unpublish: useMutation({
      mutationFn: ({
        timetableId,
        expectedVersion,
      }: {
        timetableId: string;
        expectedVersion: number;
      }) => unpublishTimetable(timetableId, expectedVersion),
      onSuccess: (result) => invalidate(result.id),
    }),
    discard: useMutation({
      mutationFn: (timetableId: string) => discardTimetable(timetableId),
      onSuccess: (_, timetableId) => invalidate(timetableId),
    }),
  };
}
