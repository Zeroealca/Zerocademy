import type {
  PerformanceCourseQuery,
  PerformancePeriodQuery,
  PerformanceStudentQuery,
  PerformanceSubjectQuery,
} from "@/features/academic-performance/types";

export const academicPerformanceKeys = {
  all: ["academic-performance"] as const,
  studentSubjectAverages: (query: PerformancePeriodQuery) =>
    [...academicPerformanceKeys.all, "student-subject-averages", query] as const,
  studentTermAverages: (
    query: PerformancePeriodQuery & { subjectId?: string; academicTermId?: string },
  ) =>
    [...academicPerformanceKeys.all, "student-term-averages", query] as const,
  studentSummary: (query: PerformancePeriodQuery) =>
    [...academicPerformanceKeys.all, "student-summary", query] as const,
  teacherCourseAverages: (query: PerformanceCourseQuery) =>
    [...academicPerformanceKeys.all, "teacher-course-averages", query] as const,
  teacherSubjectPerformance: (query: PerformanceSubjectQuery) =>
    [...academicPerformanceKeys.all, "teacher-subject-performance", query] as const,
  teacherStudentPerformance: (query: PerformanceStudentQuery) =>
    [...academicPerformanceKeys.all, "teacher-student-performance", query] as const,
  adminInstitutionPerformance: (
    query: PerformancePeriodQuery & { institutionId?: string },
  ) =>
    [...academicPerformanceKeys.all, "admin-institution-performance", query] as const,
  adminCoursePerformance: (query: PerformanceCourseQuery) =>
    [...academicPerformanceKeys.all, "admin-course-performance", query] as const,
  adminStudentPerformance: (query: PerformanceStudentQuery) =>
    [...academicPerformanceKeys.all, "admin-student-performance", query] as const,
};
