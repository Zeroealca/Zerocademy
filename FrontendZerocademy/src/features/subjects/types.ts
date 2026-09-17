export interface SubjectGradeLevelRef {
  id: string;
  code: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  gradeLevels?: SubjectGradeLevelRef[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SubjectsListResponse {
  data: Subject[];
  meta: PaginationMeta;
}

export interface SubjectsFilters {
  institutionId?: string;
  page: number;
  limit: number;
  search?: string;
  gradeLevelId?: string;
  isActive?: boolean;
  isSystem?: boolean;
}

export interface CreateSubjectInput {
  name: string;
  code: string;
  description?: string;
  isSystem?: boolean;
  gradeLevelIds?: string[];
}

export type UpdateSubjectInput = Partial<CreateSubjectInput>;
