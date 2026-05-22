export type EnrollmentStatus =
  | "ACTIVE"
  | "WITHDRAWN"
  | "COMPLETED"
  | "FAILED"
  | "TRANSFERRED";

export interface EnrollmentStudentSummary {
  id: string;
  userId: string;
  nationalId: string | null;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  academicPeriodId: string;
  enrollmentDate: string;
  status: EnrollmentStatus;
  student: EnrollmentStudentSummary;
  course: { id: string; name: string; section: string };
  academicPeriod: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EnrollmentsListResponse {
  data: Enrollment[];
  meta: PaginationMeta;
}

export interface EnrollmentsFilters {
  page: number;
  limit: number;
  studentId?: string;
  courseId?: string;
  academicPeriodId?: string;
  status?: EnrollmentStatus;
}

export interface CreateEnrollmentInput {
  studentId: string;
  courseId: string;
  academicPeriodId: string;
  enrollmentDate?: string;
  status?: EnrollmentStatus;
}

export interface UpdateEnrollmentInput {
  enrollmentDate?: string;
  status?: EnrollmentStatus;
}

export interface AvailableStudentsFilters {
  courseId: string;
  academicPeriodId: string;
  search?: string;
  page: number;
  limit: number;
}

export interface BulkCreateEnrollmentsInput {
  courseId: string;
  academicPeriodId: string;
  studentIds: string[];
  enrollmentDate?: string;
  status?: EnrollmentStatus;
}

export interface BulkEnrollmentError {
  studentId: string;
  message: string;
}

export interface BulkEnrollmentResult {
  enrolledCount: number;
  skippedCount: number;
  failedCount: number;
  errors: BulkEnrollmentError[];
}
