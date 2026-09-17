"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PerformanceMetricCard } from "@/features/academic-performance/components/performance-metric-card";
import { ScoreBadge } from "@/features/academic-performance/components/score-badge";
import { useStudentPerformanceSummary } from "@/features/academic-performance/hooks/use-academic-performance";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { useInstitutionAcademicPeriods } from "@/features/academic-periods/hooks/use-institution-academic-periods";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import { canViewAcademicPerformanceStudent } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function StudentAveragesPage() {
  const role = useAuthStore((state) => state.user?.role);
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const [academicPeriodId, setAcademicPeriodId] = useState(
    effectivePeriodId ?? "",
  );

  useEffect(() => {
    if (effectivePeriodId) setAcademicPeriodId(effectivePeriodId);
  }, [effectivePeriodId]);

  const { data: periodsData } = useInstitutionAcademicPeriods();
  const { data, isLoading, isError, refetch } = useStudentPerformanceSummary(
    academicPeriodId ? { academicPeriodId } : undefined,
  );

  if (!canViewAcademicPerformanceStudent(role)) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Mis promedios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Resumen de tu rendimiento académico calculado dinámicamente.
        </p>
      </header>

      <div className="max-w-sm space-y-2">
        <Label htmlFor="period-select">Período académico</Label>
        <Select
          id="period-select"
          value={academicPeriodId}
          onChange={(event) => setAcademicPeriodId(event.target.value)}
        >
          <option value="">Selecciona un período</option>
          {(periodsData?.data ?? []).map((period) => (
            <option key={period.id} value={period.id}>
              {formatAcademicPeriodOptionLabel(period)}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando promedios…</p>
      ) : null}

      {isError ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">
            No se pudieron cargar los promedios.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <PerformanceMetricCard
              title="Promedio general"
              value={data.overallAverage}
            />
            <PerformanceMetricCard
              title="Materias evaluadas"
              value={data.subjectCount}
              variant="count"
              subtitle={`${data.passingSubjectCount} en nivel aprobatorio`}
            />
            <PerformanceMetricCard
              title="Materias aprobadas"
              value={data.passingSubjectCount}
              variant="count"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Materia</th>
                  <th className="px-4 py-3 text-left font-medium">Promedio</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Aún no hay calificaciones registradas en este período.
                    </td>
                  </tr>
                ) : (
                  data.subjects.map((subject) => (
                    <tr key={subject.subjectId} className="border-t border-border">
                      <td className="px-4 py-3">{subject.subjectName}</td>
                      <td className="px-4 py-3">
                        <ScoreBadge
                          value={subject.average}
                          isPassing={subject.isPassing}
                        />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {subject.isPassing === true
                          ? "Aprobado"
                          : subject.isPassing === false
                            ? "Requiere refuerzo"
                            : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
      <Button asChild variant="outline">
        <Link href="/dashboard">Volver al panel</Link>
      </Button>
    </div>
  );
}
