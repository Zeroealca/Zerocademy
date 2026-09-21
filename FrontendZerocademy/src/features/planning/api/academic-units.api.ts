import { apiClient } from "@/lib/api-client";
import type {
  AcademicUnit,
  AcademicUnitInput,
  ReorderAcademicUnitsInput,
  UpdateAcademicUnitInput,
} from "@/features/planning/types";

const unitsPath = (academicPlanId: string) =>
  `/v1/academic-plans/${academicPlanId}/units`;

export const fetchAcademicUnits = (academicPlanId: string) =>
  apiClient<AcademicUnit[]>(unitsPath(academicPlanId));

export const fetchAcademicUnit = (
  academicPlanId: string,
  academicUnitId: string,
) => apiClient<AcademicUnit>(`${unitsPath(academicPlanId)}/${academicUnitId}`);

export const createAcademicUnit = (
  academicPlanId: string,
  payload: AcademicUnitInput,
) =>
  apiClient<AcademicUnit>(unitsPath(academicPlanId), {
    method: "POST",
    body: payload,
  });

export const updateAcademicUnit = (
  academicPlanId: string,
  academicUnitId: string,
  payload: UpdateAcademicUnitInput,
) =>
  apiClient<AcademicUnit>(`${unitsPath(academicPlanId)}/${academicUnitId}`, {
    method: "PATCH",
    body: payload,
  });

export const deleteAcademicUnit = (
  academicPlanId: string,
  academicUnitId: string,
) =>
  apiClient<void>(`${unitsPath(academicPlanId)}/${academicUnitId}`, {
    method: "DELETE",
  });

export const reorderAcademicUnits = (
  academicPlanId: string,
  payload: ReorderAcademicUnitsInput,
) =>
  apiClient<void>(`${unitsPath(academicPlanId)}/reorder`, {
    method: "PATCH",
    body: payload,
  });
