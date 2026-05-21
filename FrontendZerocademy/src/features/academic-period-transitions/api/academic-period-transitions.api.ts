import { apiClient } from "@/lib/api-client";
import type {
  AcademicTransitionPreview,
  AcademicTransitionRecord,
  AcademicTransitionRequest,
  AcademicTransitionsListResponse,
  ActiveAcademicPeriodResponse,
  SetActiveAcademicPeriodInput,
} from "@/features/academic-period-transitions/types";

const basePath = (institutionId: string) =>
  `/v1/institutions/${institutionId}/academic-transitions`;

export function fetchActiveAcademicPeriodForInstitution(
  institutionId: string,
): Promise<ActiveAcademicPeriodResponse> {
  return apiClient<ActiveAcademicPeriodResponse>(
    `${basePath(institutionId)}/active-period`,
  );
}

export function setActiveAcademicPeriodForInstitution(
  institutionId: string,
  payload: SetActiveAcademicPeriodInput,
): Promise<ActiveAcademicPeriodResponse> {
  return apiClient<ActiveAcademicPeriodResponse>(
    `${basePath(institutionId)}/active-period`,
    { method: "PUT", body: payload },
  );
}

export function fetchAcademicTransitionHistory(
  institutionId: string,
  page: number,
  limit: number,
): Promise<AcademicTransitionsListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiClient<AcademicTransitionsListResponse>(
    `${basePath(institutionId)}?${params.toString()}`,
  );
}

export function previewAcademicTransition(
  institutionId: string,
  payload: AcademicTransitionRequest,
): Promise<AcademicTransitionPreview> {
  return apiClient<AcademicTransitionPreview>(
    `${basePath(institutionId)}/preview`,
    { method: "POST", body: payload },
  );
}

export function executeAcademicTransition(
  institutionId: string,
  payload: AcademicTransitionRequest,
): Promise<AcademicTransitionRecord> {
  return apiClient<AcademicTransitionRecord>(
    `${basePath(institutionId)}/execute`,
    { method: "POST", body: payload },
  );
}
