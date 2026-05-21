export type InstitutionRegion = "COSTA" | "SIERRA" | "AMAZONIA" | "GALAPAGOS";

export type AcademicRegime = "COSTA_GALAPAGOS" | "SIERRA_AMAZONIA";

export interface Institution {
  id: string;
  name: string;
  code: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  region?: InstitutionRegion | null;
  regime?: AcademicRegime | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
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

export interface InstitutionsListResponse {
  data: Institution[];
  meta: PaginationMeta;
}

export interface InstitutionsFilters {
  page: number;
  limit: number;
  region?: InstitutionRegion;
  regime?: AcademicRegime;
  isActive?: boolean;
  search?: string;
}

export interface CreateInstitutionInput {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  region?: InstitutionRegion;
  regime?: AcademicRegime;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export type UpdateInstitutionInput = Partial<CreateInstitutionInput>;

export interface UpdateInstitutionSettingsInput {
  email?: string;
  phone?: string;
  address?: string;
  region?: InstitutionRegion;
  regime?: AcademicRegime;
}

export interface UpdateInstitutionBrandingInput {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}
