import { apiClient, apiDownloadClient } from "@/lib/api-client";
import type { ReportCard } from "@/features/reports/types";

export function fetchMyReportCard(
  academicPeriodId: string,
): Promise<ReportCard> {
  return apiClient<ReportCard>(
    `/v1/report-cards/me?academicPeriodId=${academicPeriodId}`,
  );
}

export function downloadReportCardPdf(
  studentId: string | null,
  academicPeriodId: string,
): Promise<Blob> {
  const path = studentId
    ? `/v1/report-cards/${studentId}/pdf`
    : "/v1/report-cards/me/pdf";
  return apiDownloadClient(
    `${path}?academicPeriodId=${encodeURIComponent(academicPeriodId)}`,
  );
}

export function fetchStudentReportCard(
  studentId: string,
  academicPeriodId: string,
): Promise<ReportCard> {
  return apiClient<ReportCard>(
    `/v1/report-cards/${studentId}?academicPeriodId=${academicPeriodId}`,
  );
}
