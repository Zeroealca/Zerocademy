export type InstitutionMembershipRole = "ADMIN" | "TEACHER";

export interface InstitutionMembership {
  id: string;
  institutionId: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  role: InstitutionMembershipRole;
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

export interface InstitutionMembershipsListResponse {
  data: InstitutionMembership[];
  meta: PaginationMeta;
}

export interface InstitutionMembershipsFilters {
  page: number;
  limit: number;
  role?: InstitutionMembershipRole;
  isActive?: boolean;
  search?: string;
}

export interface CreateInstitutionMembershipInput {
  userId: string;
  role: InstitutionMembershipRole;
}

export interface UpdateInstitutionMembershipInput {
  role?: InstitutionMembershipRole;
  isActive?: boolean;
}
