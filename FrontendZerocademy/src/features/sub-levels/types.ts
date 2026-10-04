export interface SubLevel {
  id: string;
  name: string;
  code: string;
  order: number;
  description?: string;
  academicLevelId: string;
  institutionId?: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubLevelsFilters {
  page: number;
  limit: number;
  institutionId?: string;
  academicLevelId?: string;
  isActive?: boolean;
  isSystem?: boolean;
  search?: string;
}

export interface SubLevelsListResponse {
  data: SubLevel[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
