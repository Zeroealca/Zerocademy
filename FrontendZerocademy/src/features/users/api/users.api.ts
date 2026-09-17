import { apiClient } from "@/lib/api-client";
import type {
  User,
  UsersFilters,
  UsersListResponse,
} from "@/features/users/types";
import type { CreateUserInput } from "@/features/users/schemas/create-user.schema";

function buildQuery(filters: UsersFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  if (filters.institutionId) params.set("institutionId", filters.institutionId);

  if (filters.role) {
    params.set("role", filters.role);
  }

  if (filters.isActive !== undefined) {
    params.set("isActive", String(filters.isActive));
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.sortBy) {
    params.set("sortBy", filters.sortBy);
  }

  if (filters.sortOrder) {
    params.set("sortOrder", filters.sortOrder);
  }

  return params.toString();
}

export function fetchUsers(filters: UsersFilters): Promise<UsersListResponse> {
  const query = buildQuery(filters);
  return apiClient<UsersListResponse>(`/v1/users?${query}`);
}

export function createUser(payload: CreateUserInput): Promise<User> {
  return apiClient<User>("/v1/users", {
    method: "POST",
    body: payload,
  });
}
