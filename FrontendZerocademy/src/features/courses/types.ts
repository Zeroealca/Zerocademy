export interface Course {
  id: string;
  name: string;
  section: string;
  capacity?: number | null;
  academicPeriodId: string;
  gradeLevelId: string;
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

export interface CoursesListResponse {
  data: Course[];
  meta: PaginationMeta;
}

export interface CoursesFilters {
  page: number;
  limit: number;
  search?: string;
  academicPeriodId?: string;
  gradeLevelId?: string;
  academicLevelId?: string;
  isActive?: boolean;
}

export interface CreateCourseInput {
  name: string;
  section: string;
  capacity?: number;
  academicPeriodId: string;
  gradeLevelId: string;
}

export type UpdateCourseInput = Partial<CreateCourseInput>;
