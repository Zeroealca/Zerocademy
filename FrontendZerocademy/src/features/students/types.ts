export type Gender = "MALE" | "FEMALE" | "OTHER" | "UNSPECIFIED";

export interface Student {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  institutionId?: string | null;
  nationalId?: string | null;
  birthDate?: string | null;
  gender?: Gender | null;
  phone?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  isActive: boolean;
  userIsActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StudentsListResponse {
  data: Student[];
  meta: PaginationMeta;
}

export interface StudentsFilters {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
  academicPeriodId?: string;
  courseId?: string;
  excludeEnrolledInPeriodId?: string;
}

export interface CreateStudentInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  birthDate?: string;
  gender?: Gender;
  phone?: string;
  address?: string;
  emergencyContact?: string;
}

export type UpdateStudentInput = Partial<{
  firstName: string;
  lastName: string;
  nationalId: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  address: string;
  emergencyContact: string;
  isActive: boolean;
  userIsActive: boolean;
}>;

export interface BulkImportStudentsInput {
  csvContent: string;
  courseId: string;
  academicPeriodId: string;
}

export interface BulkImportRowError {
  row: number;
  email: string;
  message: string;
}

export interface BulkImportDuplicateWarning {
  row: number;
  nationalId: string;
  message: string;
}

export interface BulkImportResult {
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: BulkImportRowError[];
  duplicateWarnings: BulkImportDuplicateWarning[];
}
