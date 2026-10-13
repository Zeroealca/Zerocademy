import { apiClient } from "@/lib/api-client";
import type { ScheduleBlock, ScheduleBlockInput, ScheduleStructure, ScheduleStructureDetail, ScheduleStructureValidation, Weekday } from "@/features/timetables/types";

const structurePath = (institutionId: string, academicPeriodId: string) =>
  `/v1/institutions/${institutionId}/academic-periods/${academicPeriodId}/schedule-structure`;

export const fetchScheduleStructure = (institutionId: string, academicPeriodId: string) =>
  apiClient<ScheduleStructureDetail>(structurePath(institutionId, academicPeriodId));

export const updateEnabledWeekdays = (institutionId: string, academicPeriodId: string, enabledWeekdays: Weekday[]) =>
  apiClient<ScheduleStructure>(structurePath(institutionId, academicPeriodId), { method: "PUT", body: { enabledWeekdays } });

export const createScheduleBlock = (institutionId: string, academicPeriodId: string, payload: ScheduleBlockInput) =>
  apiClient<ScheduleBlock>(`${structurePath(institutionId, academicPeriodId)}/blocks`, { method: "POST", body: payload });

export const updateScheduleBlock = (id: string, payload: Partial<ScheduleBlockInput>) =>
  apiClient<ScheduleBlock>(`/v1/schedule-blocks/${id}`, { method: "PATCH", body: payload });

export const deleteScheduleBlock = (id: string) =>
  apiClient<void>(`/v1/schedule-blocks/${id}`, { method: "DELETE" });

export const reorderScheduleBlocks = (institutionId: string, academicPeriodId: string, ids: string[]) =>
  apiClient<ScheduleStructure>(`${structurePath(institutionId, academicPeriodId)}/blocks/order`, {
    method: "PUT",
    body: { items: ids.map((id, index) => ({ id, position: index + 1 })) },
  });

export const fetchScheduleStructureValidation = (institutionId: string, academicPeriodId: string) =>
  apiClient<ScheduleStructureValidation>(`${structurePath(institutionId, academicPeriodId)}/validation`);
