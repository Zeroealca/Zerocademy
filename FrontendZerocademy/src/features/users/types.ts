import type { UserRole } from "@/stores/use-auth-store";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsersListResponse {
  data: User[];
  meta: PaginationMeta;
}

export interface UsersFilters {
  page: number;
  limit: number;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}
