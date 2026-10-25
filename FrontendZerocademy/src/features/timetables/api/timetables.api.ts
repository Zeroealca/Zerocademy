import { apiClient } from "@/lib/api-client";
import type {
  ScheduleBlock,
  ScheduleBlockInput,
  ScheduleStructure,
  ScheduleStructureDetail,
  ScheduleStructureValidation,
  TeachingLoadListResponse,
  Timetable,
  TimetableGeneration,
  TimetableListResponse,
  TimetableSlotInput,
  TimetableValidation,
  TeacherTimetableListResponse,
  Weekday,
} from "@/features/timetables/types";

const structurePath = (institutionId: string, academicPeriodId: string) =>
  `/v1/institutions/${institutionId}/academic-periods/${academicPeriodId}/schedule-structure`;

export const fetchScheduleStructure = (
  institutionId: string,
  academicPeriodId: string,
) =>
  apiClient<ScheduleStructureDetail>(
    structurePath(institutionId, academicPeriodId),
  );

export const updateEnabledWeekdays = (
  institutionId: string,
  academicPeriodId: string,
  enabledWeekdays: Weekday[],
) =>
  apiClient<ScheduleStructure>(structurePath(institutionId, academicPeriodId), {
    method: "PUT",
    body: { enabledWeekdays },
  });

export const createScheduleBlock = (
  institutionId: string,
  academicPeriodId: string,
  payload: ScheduleBlockInput,
) =>
  apiClient<ScheduleBlock>(
    `${structurePath(institutionId, academicPeriodId)}/blocks`,
    { method: "POST", body: payload },
  );

export const updateScheduleBlock = (
  id: string,
  payload: Partial<ScheduleBlockInput>,
) =>
  apiClient<ScheduleBlock>(`/v1/schedule-blocks/${id}`, {
    method: "PATCH",
    body: payload,
  });

export const deleteScheduleBlock = (id: string) =>
  apiClient<void>(`/v1/schedule-blocks/${id}`, { method: "DELETE" });

export const reorderScheduleBlocks = (
  institutionId: string,
  academicPeriodId: string,
  ids: string[],
) =>
  apiClient<ScheduleStructure>(
    `${structurePath(institutionId, academicPeriodId)}/blocks/order`,
    {
      method: "PUT",
      body: { items: ids.map((id, index) => ({ id, position: index + 1 })) },
    },
  );

export const fetchScheduleStructureValidation = (
  institutionId: string,
  academicPeriodId: string,
) =>
  apiClient<ScheduleStructureValidation>(
    `${structurePath(institutionId, academicPeriodId)}/validation`,
  );

const timetableListPath = (institutionId: string, academicPeriodId: string) =>
  `/v1/institutions/${institutionId}/academic-periods/${academicPeriodId}/timetables`;

export const fetchTimetables = (
  institutionId: string,
  academicPeriodId: string,
) =>
  apiClient<TimetableListResponse>(
    timetableListPath(institutionId, academicPeriodId),
  );

export const fetchTimetable = (timetableId: string) =>
  apiClient<Timetable>(`/v1/timetables/${timetableId}`);

export const fetchTimetableValidation = (timetableId: string) =>
  apiClient<TimetableValidation>(`/v1/timetables/${timetableId}/validation`);

const teacherTimetablePath = (suffix = "", academicPeriodId?: string) =>
  `/v1/timetables/me${suffix}${academicPeriodId ? `?academicPeriodId=${encodeURIComponent(academicPeriodId)}` : ""}`;

export const fetchMyTimetable = (academicPeriodId?: string) =>
  apiClient<TeacherTimetableListResponse>(
    teacherTimetablePath("", academicPeriodId),
  );

export const fetchMyTodayTimetable = (academicPeriodId?: string) =>
  apiClient<TeacherTimetableListResponse>(
    teacherTimetablePath("/today", academicPeriodId),
  );

export const generateTimetable = (
  institutionId: string,
  academicPeriodId: string,
  maxSearchNodes?: number,
) =>
  apiClient<TimetableGeneration>(
    `${timetableListPath(institutionId, academicPeriodId)}/generate`,
    { method: "POST", body: maxSearchNodes ? { maxSearchNodes } : {} },
  );

export const createTimetable = (
  institutionId: string,
  academicPeriodId: string,
  slots: TimetableSlotInput[],
) =>
  apiClient<Timetable>(timetableListPath(institutionId, academicPeriodId), {
    method: "POST",
    body: { slots },
  });

export const replaceTimetableSlots = (
  timetableId: string,
  expectedVersion: number,
  slots: TimetableSlotInput[],
) =>
  apiClient<Timetable>(`/v1/timetables/${timetableId}/slots`, {
    method: "PUT",
    body: { expectedVersion, slots },
  });

export const publishTimetable = (
  timetableId: string,
  expectedVersion: number,
) =>
  apiClient<Timetable>(`/v1/timetables/${timetableId}/publish`, {
    method: "POST",
    body: { expectedVersion },
  });

export const unpublishTimetable = (
  timetableId: string,
  expectedVersion: number,
) =>
  apiClient<Timetable>(`/v1/timetables/${timetableId}/unpublish`, {
    method: "POST",
    body: { expectedVersion },
  });

export const discardTimetable = (timetableId: string) =>
  apiClient<void>(`/v1/timetables/${timetableId}`, { method: "DELETE" });

export const fetchTeachingLoads = (
  institutionId: string,
  academicPeriodId: string,
) =>
  apiClient<TeachingLoadListResponse>(
    `/v1/teaching-loads/institutions/${institutionId}/academic-periods/${academicPeriodId}?page=1&limit=100`,
  );
