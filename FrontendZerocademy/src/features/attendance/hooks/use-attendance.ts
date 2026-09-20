import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkUpsertAttendance,
  fetchAttendanceCourses,
  fetchDailyAttendance,
  fetchCourseAttendanceReport,
  fetchMyAttendanceHistory,
  createAttendanceJustification,
  fetchAttendanceJustifications,
  reviewAttendanceJustification,
} from "@/features/attendance/api/attendance.api";
import { attendanceKeys } from "@/features/attendance/api/attendance.keys";
import type { BulkUpsertAttendanceInput } from "@/features/attendance/types";

export function useAttendanceCourses(academicPeriodId: string) {
  return useQuery({
    queryKey: attendanceKeys.courses(academicPeriodId),
    queryFn: () => fetchAttendanceCourses(academicPeriodId),
    enabled: Boolean(academicPeriodId),
  });
}
export function useDailyAttendance(
  academicPeriodId: string,
  courseId: string,
  date: string,
) {
  return useQuery({
    queryKey: attendanceKeys.daily(academicPeriodId, courseId, date),
    queryFn: () => fetchDailyAttendance(academicPeriodId, courseId, date),
    enabled: Boolean(academicPeriodId && courseId && date),
  });
}
export function useBulkAttendanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkUpsertAttendanceInput) =>
      bulkUpsertAttendance(payload),
    onSuccess: (_result, payload) =>
      void queryClient.invalidateQueries({
        queryKey: attendanceKeys.daily(
          payload.academicPeriodId,
          payload.courseId,
          payload.date,
        ),
      }),
  });
}
export function useMyAttendanceHistory(
  academicPeriodId: string,
  startDate: string,
  endDate: string,
) {
  return useQuery({
    queryKey: [
      ...attendanceKeys.all,
      "my-history",
      academicPeriodId,
      startDate,
      endDate,
    ],
    queryFn: () =>
      fetchMyAttendanceHistory(
        academicPeriodId,
        startDate || undefined,
        endDate || undefined,
      ),
    enabled: Boolean(academicPeriodId),
  });
}
export function useCourseAttendanceReport(
  academicPeriodId: string,
  courseId: string,
  startDate: string,
  endDate: string,
) {
  return useQuery({
    queryKey: [
      ...attendanceKeys.all,
      "course-report",
      academicPeriodId,
      courseId,
      startDate,
      endDate,
    ],
    queryFn: () =>
      fetchCourseAttendanceReport(
        academicPeriodId,
        courseId,
        startDate,
        endDate,
      ),
    enabled: Boolean(academicPeriodId && courseId && startDate && endDate),
  });
}
export function useCreateAttendanceJustification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      attendanceRecordId,
      reason,
    }: {
      attendanceRecordId: string;
      reason: string;
    }) => createAttendanceJustification(attendanceRecordId, reason),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
  });
}
export function usePendingAttendanceJustifications(enabled: boolean) {
  return useQuery({
    queryKey: [...attendanceKeys.all, "justifications", "pending"],
    queryFn: fetchAttendanceJustifications,
    enabled,
  });
}
export function useReviewAttendanceJustification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      justificationId,
      decision,
      comment,
    }: {
      justificationId: string;
      decision: "APPROVE" | "REJECT";
      comment?: string;
    }) => reviewAttendanceJustification(justificationId, decision, comment),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
  });
}
