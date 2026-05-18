export interface GradeLevel {
  id: string;
  name: string;
  code: string;
  order: number;
  description?: string | null;
  academicLevelId: string;
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

export interface GradeLevelsListResponse {
  data: GradeLevel[];
  meta: PaginationMeta;
}

export interface GradeLevelsFilters {
  page: number;
  limit: number;
  search?: string;
  institutionId?: string;
  academicLevelId?: string;
  isActive?: boolean;
  isSystem?: boolean;
}

export interface CreateGradeLevelInput {
  name: string;
  code: string;
  order: number;
  description?: string;
  academicLevelId: string;
  institutionId?: string;
  isSystem?: boolean;
}

export type UpdateGradeLevelInput = Partial<CreateGradeLevelInput>;
