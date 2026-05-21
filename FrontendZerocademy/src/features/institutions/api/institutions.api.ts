import { apiClient, apiUploadClient } from "@/lib/api-client";
import type {
  CreateInstitutionInput,
  Institution,
  InstitutionsFilters,
  InstitutionsListResponse,
  UpdateInstitutionBrandingInput,
  UpdateInstitutionInput,
  UpdateInstitutionSettingsInput,
} from "@/features/institutions/types";

function buildListQuery(filters: InstitutionsFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  if (filters.region) {
    params.set("region", filters.region);
  }

  if (filters.regime) {
    params.set("regime", filters.regime);
  }

  if (filters.isActive !== undefined) {
    params.set("isActive", String(filters.isActive));
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  return params.toString();
}

export function fetchInstitutions(
  filters: InstitutionsFilters,
): Promise<InstitutionsListResponse> {
  const query = buildListQuery(filters);
  return apiClient<InstitutionsListResponse>(`/v1/institutions?${query}`);
}

export function fetchInstitution(id: string): Promise<Institution> {
  return apiClient<Institution>(`/v1/institutions/${id}`);
}

export function createInstitution(
  payload: CreateInstitutionInput,
): Promise<Institution> {
  return apiClient<Institution>("/v1/institutions", {
    method: "POST",
    body: payload,
  });
}

export function updateInstitution(
  id: string,
  payload: UpdateInstitutionInput,
): Promise<Institution> {
  return apiClient<Institution>(`/v1/institutions/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function updateInstitutionSettings(
  id: string,
  payload: UpdateInstitutionSettingsInput,
): Promise<Institution> {
  return apiClient<Institution>(`/v1/institutions/${id}/settings`, {
    method: "PATCH",
    body: payload,
  });
}

export function updateInstitutionBranding(
  id: string,
  payload: UpdateInstitutionBrandingInput,
): Promise<Institution> {
  return apiClient<Institution>(`/v1/institutions/${id}/branding`, {
    method: "PATCH",
    body: payload,
  });
}

export function activateInstitution(id: string): Promise<Institution> {
  return apiClient<Institution>(`/v1/institutions/${id}/activate`, {
    method: "POST",
  });
}

export function deactivateInstitution(id: string): Promise<Institution> {
  return apiClient<Institution>(`/v1/institutions/${id}/deactivate`, {
    method: "POST",
  });
}

export function deleteInstitution(id: string): Promise<void> {
  return apiClient<void>(`/v1/institutions/${id}`, {
    method: "DELETE",
  });
}

export function uploadInstitutionLogo(
  institutionId: string,
  file: File,
): Promise<Institution> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUploadClient<Institution>(
    `/v1/institutions/${institutionId}/logo`,
    formData,
  );
}
