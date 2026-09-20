import { apiClient } from "@/lib/api-client";
import type {
  AttendanceCourse,
  BulkAttendanceResult,
  BulkUpsertAttendanceInput,
  DailyAttendance,
  CourseAttendanceReport,
  MyAttendanceHistory,
  AttendanceJustification,
} from "@/features/attendance/types";

export function fetchAttendanceCourses(
  academicPeriodId: string,
): Promise<AttendanceCourse[]> {
  return apiClient<AttendanceCourse[]>(
    `/v1/attendance/courses?academicPeriodId=${academicPeriodId}`,
  );
}
export function createAttendanceJustification(
  attendanceRecordId: string,
  reason: string,
) {
  return apiClient<{ id: string; status: "PENDING" }>(
    `/v1/attendance/${attendanceRecordId}/justifications`,
    { method: "POST", body: { reason } },
  );
}
export function fetchAttendanceJustifications(): Promise<
  AttendanceJustification[]
> {
  return apiClient<AttendanceJustification[]>(
    "/v1/attendance/justifications?status=PENDING",
  );
}
export function reviewAttendanceJustification(
  justificationId: string,
  decision: "APPROVE" | "REJECT",
  comment?: string,
) {
  return apiClient<{ id: string; status: "APPROVED" | "REJECTED" }>(
    `/v1/attendance/justifications/${justificationId}/review`,
    { method: "POST", body: { decision, comment } },
  );
}
export function fetchDailyAttendance(
  academicPeriodId: string,
  courseId: string,
  date: string,
): Promise<DailyAttendance> {
  const params = new URLSearchParams({ academicPeriodId, courseId, date });
  return apiClient<DailyAttendance>(`/v1/attendance/daily?${params}`);
}
export function bulkUpsertAttendance(
  payload: BulkUpsertAttendanceInput,
): Promise<BulkAttendanceResult> {
  return apiClient<BulkAttendanceResult>("/v1/attendance/bulk", {
    method: "POST",
    body: payload,
  });
}
export function fetchMyAttendanceHistory(
  academicPeriodId: string,
  startDate?: string,
  endDate?: string,
): Promise<MyAttendanceHistory> {
  const params = new URLSearchParams({ academicPeriodId });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return apiClient<MyAttendanceHistory>(`/v1/attendance/me/history?${params}`);
}
export function fetchCourseAttendanceReport(
  academicPeriodId: string,
  courseId: string,
  startDate: string,
  endDate: string,
): Promise<CourseAttendanceReport> {
  return apiClient<CourseAttendanceReport>(
    `/v1/attendance/course-summary?${new URLSearchParams({ academicPeriodId, courseId, startDate, endDate })}`,
  );
}
