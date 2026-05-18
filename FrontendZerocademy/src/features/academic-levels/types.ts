export interface AcademicLevel {
  id: string;
  name: string;
  code: string;
  order: number;
  description?: string | null;
  institutionId?: string | null;
  isSystem: boolean;
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

export interface AcademicLevelsListResponse {
  data: AcademicLevel[];
  meta: PaginationMeta;
}

export interface AcademicLevelsFilters {
  page: number;
  limit: number;
  search?: string;
  institutionId?: string;
  isActive?: boolean;
  isSystem?: boolean;
}

export interface CreateAcademicLevelInput {
  name: string;
  code: string;
  order: number;
  description?: string;
  institutionId?: string;
  isSystem?: boolean;
}

export type UpdateAcademicLevelInput = Partial<CreateAcademicLevelInput>;
