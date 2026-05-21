import { apiClient } from "@/lib/api-client";
import type {
  AcademicPeriod,
  AcademicPeriodsFilters,
  AcademicPeriodsListResponse,
  AcademicRegime,
  AcademicTerm,
  CreateAcademicPeriodInput,
  CreateAcademicTermInput,
  UpdateAcademicPeriodInput,
  UpdateAcademicTermInput,
} from "@/features/academic-periods/types";

function buildListQuery(filters: AcademicPeriodsFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  if (filters.institutionId) {
    params.set("institutionId", filters.institutionId);
  }

  if (filters.regime) {
    params.set("regime", filters.regime);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  return params.toString();
}

export function fetchAcademicPeriods(
  filters: AcademicPeriodsFilters,
): Promise<AcademicPeriodsListResponse> {
  const query = buildListQuery(filters);
  return apiClient<AcademicPeriodsListResponse>(`/v1/academic-periods?${query}`);
}

export function fetchAcademicPeriod(id: string): Promise<AcademicPeriod> {
  return apiClient<AcademicPeriod>(`/v1/academic-periods/${id}`);
}

export function fetchActiveAcademicPeriod(
  regime: AcademicRegime,
): Promise<AcademicPeriod | null> {
  return apiClient<AcademicPeriod | null>(
    `/v1/academic-periods/active?regime=${regime}`,
  );
}

export function createAcademicPeriod(
  payload: CreateAcademicPeriodInput,
): Promise<AcademicPeriod> {
  return apiClient<AcademicPeriod>("/v1/academic-periods", {
    method: "POST",
    body: payload,
  });
}

export function updateAcademicPeriod(
  id: string,
  payload: UpdateAcademicPeriodInput,
): Promise<AcademicPeriod> {
  return apiClient<AcademicPeriod>(`/v1/academic-periods/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteAcademicPeriod(id: string): Promise<void> {
  return apiClient<void>(`/v1/academic-periods/${id}`, {
    method: "DELETE",
  });
}

export function activateAcademicPeriod(id: string): Promise<AcademicPeriod> {
  return apiClient<AcademicPeriod>(`/v1/academic-periods/${id}/activate`, {
    method: "POST",
  });
}

export function deactivateAcademicPeriod(id: string): Promise<AcademicPeriod> {
  return apiClient<AcademicPeriod>(`/v1/academic-periods/${id}/deactivate`, {
    method: "POST",
  });
}

export function archiveAcademicPeriod(id: string): Promise<AcademicPeriod> {
  return apiClient<AcademicPeriod>(`/v1/academic-periods/${id}/archive`, {
    method: "POST",
  });
}

export function fetchAcademicTerms(periodId: string): Promise<AcademicTerm[]> {
  return apiClient<AcademicTerm[]>(
    `/v1/academic-periods/${periodId}/terms`,
  );
}

export function createAcademicTerm(
  periodId: string,
  payload: CreateAcademicTermInput,
): Promise<AcademicTerm> {
  return apiClient<AcademicTerm>(`/v1/academic-periods/${periodId}/terms`, {
    method: "POST",
    body: payload,
  });
}

export function updateAcademicTerm(
  periodId: string,
  termId: string,
  payload: UpdateAcademicTermInput,
): Promise<AcademicTerm> {
  return apiClient<AcademicTerm>(
    `/v1/academic-periods/${periodId}/terms/${termId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export function deleteAcademicTerm(
  periodId: string,
  termId: string,
): Promise<void> {
  return apiClient<void>(
    `/v1/academic-periods/${periodId}/terms/${termId}`,
    {
      method: "DELETE",
    },
  );
}
