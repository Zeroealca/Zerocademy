"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchMyReportCard,
  fetchStudentReportCard,
} from "@/features/reports/api/report-cards.api";
import { reportCardsKeys } from "@/features/reports/api/report-cards.keys";

export function useMyReportCard(academicPeriodId: string) {
  return useQuery({
    queryKey: reportCardsKeys.mine(academicPeriodId),
    queryFn: () => fetchMyReportCard(academicPeriodId),
    enabled: Boolean(academicPeriodId),
  });
}

export function useStudentReportCard(
  studentId: string,
  academicPeriodId: string,
) {
  return useQuery({
    queryKey: reportCardsKeys.student(studentId, academicPeriodId),
    queryFn: () => fetchStudentReportCard(studentId, academicPeriodId),
    enabled: Boolean(studentId && academicPeriodId),
  });
}
