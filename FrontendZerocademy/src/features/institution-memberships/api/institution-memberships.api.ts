import { apiClient } from "@/lib/api-client";
import type {
  CreateInstitutionMembershipInput,
  InstitutionMembership,
  InstitutionMembershipsFilters,
  InstitutionMembershipsListResponse,
  UpdateInstitutionMembershipInput,
} from "@/features/institution-memberships/types";

function buildListQuery(filters: InstitutionMembershipsFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  if (filters.role) {
    params.set("role", filters.role);
  }

  if (filters.isActive !== undefined) {
    params.set("isActive", String(filters.isActive));
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  return params.toString();
}

export function fetchInstitutionMemberships(
  institutionId: string,
  filters: InstitutionMembershipsFilters,
): Promise<InstitutionMembershipsListResponse> {
  const query = buildListQuery(filters);
  return apiClient<InstitutionMembershipsListResponse>(
    `/v1/institutions/${institutionId}/memberships?${query}`,
  );
}

export function assignInstitutionMembership(
  institutionId: string,
  payload: CreateInstitutionMembershipInput,
): Promise<InstitutionMembership> {
  return apiClient<InstitutionMembership>(
    `/v1/institutions/${institutionId}/memberships`,
    { method: "POST", body: payload },
  );
}

export function updateInstitutionMembership(
  institutionId: string,
  membershipId: string,
  payload: UpdateInstitutionMembershipInput,
): Promise<InstitutionMembership> {
  return apiClient<InstitutionMembership>(
    `/v1/institutions/${institutionId}/memberships/${membershipId}`,
    { method: "PATCH", body: payload },
  );
}

export function activateInstitutionMembership(
  institutionId: string,
  membershipId: string,
): Promise<InstitutionMembership> {
  return apiClient<InstitutionMembership>(
    `/v1/institutions/${institutionId}/memberships/${membershipId}/activate`,
    { method: "POST" },
  );
}

export function deactivateInstitutionMembership(
  institutionId: string,
  membershipId: string,
): Promise<InstitutionMembership> {
  return apiClient<InstitutionMembership>(
    `/v1/institutions/${institutionId}/memberships/${membershipId}/deactivate`,
    { method: "POST" },
  );
}

export function removeInstitutionMembership(
  institutionId: string,
  membershipId: string,
): Promise<void> {
  return apiClient<void>(
    `/v1/institutions/${institutionId}/memberships/${membershipId}`,
    { method: "DELETE" },
  );
}
