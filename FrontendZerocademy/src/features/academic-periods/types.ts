export type AcademicRegime = "COSTA_GALAPAGOS" | "SIERRA_AMAZONIA";

export type AcademicPeriodStatus =
  | "PLANNED"
  | "ACTIVE"
  | "CLOSED"
  | "ARCHIVED";

export interface AcademicTerm {
  id: string;
  name: string;
  order: number;
  startDate: string;
  endDate: string;
  academicPeriodId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicPeriod {
  id: string;
  name: string;
  institutionId?: string | null;
  regime: AcademicRegime;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: AcademicPeriodStatus;
  createdAt: string;
  updatedAt: string;
  terms?: AcademicTerm[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AcademicPeriodsListResponse {
  data: AcademicPeriod[];
  meta: PaginationMeta;
}

export interface AcademicPeriodsFilters {
  page: number;
  limit: number;
  institutionId?: string;
  regime?: AcademicRegime;
  status?: AcademicPeriodStatus;
  search?: string;
}

export interface CreateAcademicPeriodInput {
  name: string;
  regime: AcademicRegime;
  startDate: string;
  endDate: string;
}

export type UpdateAcademicPeriodInput = Partial<CreateAcademicPeriodInput>;

export interface CreateAcademicTermInput {
  name: string;
  order: number;
  startDate: string;
  endDate: string;
}

export type UpdateAcademicTermInput = Partial<CreateAcademicTermInput>;
