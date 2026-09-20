"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { useInstitutionAcademicPeriods } from "@/features/academic-periods/hooks/use-institution-academic-periods";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import {
  useStudentReportCard,
  useMyReportCard,
} from "@/features/reports/hooks/use-report-card";
import { ReportCardTable } from "@/features/reports/components/report-card-table";
import { downloadReportCardPdf } from "@/features/reports/api/report-cards.api";
import { useStudents } from "@/features/students/hooks/use-students";
import { canViewOwnReportCard, canViewReportCards } from "@/lib/permissions";
import { resolveAssetUrl } from "@/lib/resolve-asset-url";
import { useAuthStore } from "@/stores/use-auth-store";

export function ReportCardsPage() {
  const role = useAuthStore((state) => state.user?.role);
  const searchParams = useSearchParams();
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const [academicPeriodId, setAcademicPeriodId] = useState("");
  const selectedAcademicPeriodId = academicPeriodId || effectivePeriodId || "";
  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const { data: periods } = useInstitutionAcademicPeriods();
  const students = useStudents({
    page: 1,
    limit: 20,
    academicPeriodId: selectedAcademicPeriodId,
    search: studentSearch || undefined,
  });
  const mine = useMyReportCard(selectedAcademicPeriodId);
  const requestedStudentId =
    role === "REPRESENTATIVE" ? searchParams.get("studentId") ?? "" : "";
  const resolvedStudentId = studentId || requestedStudentId;
  const selected = useStudentReportCard(resolvedStudentId, selectedAcademicPeriodId);
  const isStudent = canViewOwnReportCard(role);
  const report = isStudent ? mine : selected;


  const downloadPdf = async () => {
    if (!report.data) return;
    setDownloadError(null);
    try {
      const blob = await downloadReportCardPdf(
        isStudent ? null : report.data.student.id,
        selectedAcademicPeriodId,
      );
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `libreta-academica-${report.data.academicPeriod.name}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      setDownloadError("No se pudo descargar el PDF. Inténtalo nuevamente.");
    }
  };

  if (!canViewReportCards(role))
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No tienes acceso a los reportes académicos.
      </p>
    );

  return (
    <div className="space-y-8">
      <header className="print:hidden">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isStudent ? "Mi reporte académico" : "Reportes académicos"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Promedios generados con la configuración académica del período
          seleccionado.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 print:hidden">
        <div className="space-y-2">
          <Label htmlFor="academic-period">Período académico</Label>
          <Select
            id="academic-period"
            value={selectedAcademicPeriodId}
            onChange={(event) => {
              setAcademicPeriodId(event.target.value);
              setStudentId("");
            }}
          >
            <option value="">Selecciona un período</option>
            {(periods?.data ?? []).map((period) => (
              <option key={period.id} value={period.id}>
                {formatAcademicPeriodOptionLabel(period)}
              </option>
            ))}
          </Select>
        </div>
        {!isStudent ? (
          <div className="space-y-2">
            <Label htmlFor="student">Estudiante</Label>
            <Input
              id="student-search"
              value={studentSearch}
              onChange={(event) => {
                setStudentSearch(event.target.value);
                setStudentId("");
              }}
              placeholder="Buscar por nombre o identificación"
              disabled={!selectedAcademicPeriodId}
            />
            <Select
              id="student"
              value={resolvedStudentId}
              onChange={(event) => setStudentId(event.target.value)}
              disabled={!selectedAcademicPeriodId || students.isLoading}
            >
              <option value="">Selecciona un estudiante</option>
              {(students.data?.data ?? []).map((student) => (
                <option key={student.id} value={student.id}>
                  {student.lastName} {student.firstName}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>
      {report.isLoading ? (
        <p className="text-sm text-muted-foreground">
          Cargando reporte académico…
        </p>
      ) : report.isError ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">
            No se pudo cargar el reporte académico.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void report.refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : report.data ? (
        <section className="report-card-document space-y-4">
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" onClick={() => window.print()}>
              Imprimir
            </Button>
            <Button onClick={() => void downloadPdf()}>Descargar PDF</Button>
          </div>
          {downloadError ? (
            <p className="text-sm text-destructive print:hidden">{downloadError}</p>
          ) : null}
          <div className="rounded-lg border border-border bg-card p-5 text-sm print:border-0 print:bg-white">
            <div className="flex items-center gap-4">
              {report.data.institution.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveAssetUrl(report.data.institution.logoUrl) ?? ""}
                  alt=""
                  className="h-12 w-12 object-contain"
                />
              ) : null}
              <div>
                <p className="font-semibold">{report.data.institution.name}</p>
                <p className="text-muted-foreground print:text-black">
                  Libreta académica · {report.data.academicPeriod.name}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border p-4 text-sm">
            <p className="font-semibold">{report.data.student.fullName}</p>
            <p className="text-muted-foreground">
              {report.data.enrollment.gradeLevelName} ·{" "}
              {report.data.enrollment.courseName}{" "}
              {report.data.enrollment.section} ·{" "}
              {report.data.academicPeriod.name}
            </p>
          </div>
          <ReportCardTable reportCard={report.data} />
          <p className="text-sm font-medium">
            Promedio general:{" "}
            {report.data.overallAverage === null
              ? "No disponible"
              : report.data.overallAverage.toFixed(2)}
            {report.data.overallQualitativeResult
              ? ` (${report.data.overallQualitativeResult.code})`
              : ""}
          </p>
        </section>
      ) : (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Selecciona un período
          {isStudent
            ? " para consultar tu reporte."
            : " y un estudiante para consultar el reporte."}
        </p>
      )}
    </div>
  );
}
