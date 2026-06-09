import { useQuery } from "@tanstack/react-query";
import {
  fetchAdminCoursePerformance,
  fetchAdminInstitutionPerformance,
  fetchAdminStudentPerformance,
  fetchStudentPerformanceSummary,
  fetchStudentSubjectAverages,
  fetchStudentTermAverages,
  fetchTeacherCourseAverages,
  fetchTeacherStudentPerformance,
  fetchTeacherSubjectPerformance,
} from "@/features/academic-performance/api/academic-performance.api";
import { academicPerformanceKeys } from "@/features/academic-performance/api/academic-performance.keys";
import type {
  PerformanceCourseQuery,
  PerformancePeriodQuery,
  PerformanceStudentQuery,
  PerformanceSubjectQuery,
} from "@/features/academic-performance/types";

export function useStudentSubjectAverages(
  query: PerformancePeriodQuery | undefined,
) {
  return useQuery({
    queryKey: academicPerformanceKeys.studentSubjectAverages(query ?? { academicPeriodId: "" }),
    queryFn: () => fetchStudentSubjectAverages(query!),
    enabled: Boolean(query?.academicPeriodId),
  });
}

export function useStudentTermAverages(
  query:
    | (PerformancePeriodQuery & { subjectId?: string; academicTermId?: string })
    | undefined,
) {
  return useQuery({
    queryKey: academicPerformanceKeys.studentTermAverages(
      query ?? { academicPeriodId: "" },
    ),
    queryFn: () => fetchStudentTermAverages(query!),
    enabled: Boolean(query?.academicPeriodId),
  });
}

export function useStudentPerformanceSummary(
  query: PerformancePeriodQuery | undefined,
) {
  return useQuery({
    queryKey: academicPerformanceKeys.studentSummary(query ?? { academicPeriodId: "" }),
    queryFn: () => fetchStudentPerformanceSummary(query!),
    enabled: Boolean(query?.academicPeriodId),
  });
}

export function useTeacherCourseAverages(
  query: PerformanceCourseQuery | undefined,
) {
  return useQuery({
    queryKey: academicPerformanceKeys.teacherCourseAverages(
      query ?? { academicPeriodId: "", courseId: "" },
    ),
    queryFn: () => fetchTeacherCourseAverages(query!),
    enabled: Boolean(query?.academicPeriodId && query?.courseId),
  });
}

export function useTeacherSubjectPerformance(
  query: PerformanceSubjectQuery | undefined,
) {
  return useQuery({
    queryKey: academicPerformanceKeys.teacherSubjectPerformance(
      query ?? { academicPeriodId: "", courseId: "", subjectId: "" },
    ),
    queryFn: () => fetchTeacherSubjectPerformance(query!),
    enabled: Boolean(
      query?.academicPeriodId && query?.courseId && query?.subjectId,
    ),
  });
}

export function useTeacherStudentPerformance(
  query: PerformanceStudentQuery | undefined,
) {
  return useQuery({
    queryKey: academicPerformanceKeys.teacherStudentPerformance(
      query ?? { academicPeriodId: "", studentId: "" },
    ),
    queryFn: () => fetchTeacherStudentPerformance(query!),
    enabled: Boolean(query?.academicPeriodId && query?.studentId),
  });
}

export function useAdminInstitutionPerformance(
  query: (PerformancePeriodQuery & { institutionId?: string }) | undefined,
) {
  return useQuery({
    queryKey: academicPerformanceKeys.adminInstitutionPerformance(
      query ?? { academicPeriodId: "" },
    ),
    queryFn: () => fetchAdminInstitutionPerformance(query!),
    enabled: Boolean(query?.academicPeriodId),
  });
}

export function useAdminCoursePerformance(
  query: PerformanceCourseQuery | undefined,
) {
  return useQuery({
    queryKey: academicPerformanceKeys.adminCoursePerformance(
      query ?? { academicPeriodId: "", courseId: "" },
    ),
    queryFn: () => fetchAdminCoursePerformance(query!),
    enabled: Boolean(query?.academicPeriodId && query?.courseId),
  });
}

export function useAdminStudentPerformance(
  query: PerformanceStudentQuery | undefined,
) {
  return useQuery({
    queryKey: academicPerformanceKeys.adminStudentPerformance(
      query ?? { academicPeriodId: "", studentId: "" },
    ),
    queryFn: () => fetchAdminStudentPerformance(query!),
    enabled: Boolean(query?.academicPeriodId && query?.studentId),
  });
}
