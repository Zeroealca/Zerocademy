import { apiClient } from "@/lib/api-client";
import type {
  AdminCoursePerformance,
  AdminInstitutionPerformance,
  PerformanceCourseQuery,
  PerformancePeriodQuery,
  PerformanceStudentQuery,
  PerformanceSubjectQuery,
  StudentPerformanceSummary,
  StudentSubjectAverages,
  StudentTermAverages,
  TeacherCourseAverages,
  TeacherStudentPerformance,
  TeacherSubjectPerformance,
} from "@/features/academic-performance/types";

function buildQuery(
  params: {
    academicPeriodId: string;
    courseId?: string;
    subjectId?: string;
    studentId?: string;
    institutionId?: string;
    academicTermId?: string;
  },
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  return search.toString();
}

export function fetchStudentSubjectAverages(
  query: PerformancePeriodQuery,
): Promise<StudentSubjectAverages> {
  return apiClient<StudentSubjectAverages>(
    `/v1/academic-performance/student/subject-averages?${buildQuery(query)}`,
  );
}

export function fetchStudentTermAverages(
  query: PerformancePeriodQuery & { subjectId?: string; academicTermId?: string },
): Promise<StudentTermAverages> {
  return apiClient<StudentTermAverages>(
    `/v1/academic-performance/student/term-averages?${buildQuery(query)}`,
  );
}

export function fetchStudentPerformanceSummary(
  query: PerformancePeriodQuery,
): Promise<StudentPerformanceSummary> {
  return apiClient<StudentPerformanceSummary>(
    `/v1/academic-performance/student/summary?${buildQuery(query)}`,
  );
}

export function fetchTeacherCourseAverages(
  query: PerformanceCourseQuery,
): Promise<TeacherCourseAverages> {
  return apiClient<TeacherCourseAverages>(
    `/v1/academic-performance/teacher/course-averages?${buildQuery(query)}`,
  );
}

export function fetchTeacherSubjectPerformance(
  query: PerformanceSubjectQuery,
): Promise<TeacherSubjectPerformance> {
  return apiClient<TeacherSubjectPerformance>(
    `/v1/academic-performance/teacher/subject-performance?${buildQuery(query)}`,
  );
}

export function fetchTeacherStudentPerformance(
  query: PerformanceStudentQuery,
): Promise<TeacherStudentPerformance> {
  return apiClient<TeacherStudentPerformance>(
    `/v1/academic-performance/teacher/student-performance?${buildQuery(query)}`,
  );
}

export function fetchAdminInstitutionPerformance(
  query: PerformancePeriodQuery & { institutionId?: string },
): Promise<AdminInstitutionPerformance> {
  return apiClient<AdminInstitutionPerformance>(
    `/v1/academic-performance/admin/institution-performance?${buildQuery(query)}`,
  );
}

export function fetchAdminCoursePerformance(
  query: PerformanceCourseQuery,
): Promise<AdminCoursePerformance> {
  return apiClient<AdminCoursePerformance>(
    `/v1/academic-performance/admin/course-performance?${buildQuery(query)}`,
  );
}

export function fetchAdminStudentPerformance(
  query: PerformanceStudentQuery,
): Promise<TeacherStudentPerformance> {
  return apiClient<TeacherStudentPerformance>(
    `/v1/academic-performance/admin/student-performance?${buildQuery(query)}`,
  );
}
