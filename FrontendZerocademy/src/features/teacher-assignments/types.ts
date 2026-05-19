export interface TeacherAssignment {
  id: string;
  teacherId: string;
  teacherFirstName: string;
  teacherLastName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  courseId: string;
  courseName: string;
  academicPeriodId: string;
  academicPeriodName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TeacherAssignmentsListResponse {
  data: TeacherAssignment[];
  meta: PaginationMeta;
}

export interface TeacherAssignmentsFilters {
  page: number;
  limit: number;
  search?: string;
  teacherId?: string;
  subjectId?: string;
  courseId?: string;
  academicPeriodId?: string;
  gradeLevelId?: string;
}

export interface CreateTeacherAssignmentInput {
  teacherId: string;
  subjectId: string;
  courseId: string;
  academicPeriodId: string;
}

export type UpdateTeacherAssignmentInput = Partial<CreateTeacherAssignmentInput>;
