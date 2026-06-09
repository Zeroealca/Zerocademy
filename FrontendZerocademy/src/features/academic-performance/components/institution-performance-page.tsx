"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PerformanceMetricCard } from "@/features/academic-performance/components/performance-metric-card";
import { ScoreBadge } from "@/features/academic-performance/components/score-badge";
import { useAdminInstitutionPerformance } from "@/features/academic-performance/hooks/use-academic-performance";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { canViewAcademicPerformanceAdmin } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function InstitutionPerformancePage() {
  const role = useAuthStore((state) => state.user?.role);
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const [academicPeriodId, setAcademicPeriodId] = useState(
    effectivePeriodId ?? "",
  );

  useEffect(() => {
    if (effectivePeriodId) setAcademicPeriodId(effectivePeriodId);
  }, [effectivePeriodId]);

  const { data, isLoading, isError, refetch } = useAdminInstitutionPerformance(
    academicPeriodId ? { academicPeriodId } : undefined,
  );

  if (!canViewAcademicPerformanceAdmin(role)) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Rendimiento institucional
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vista agregada del rendimiento por curso en la institución.
        </p>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando datos…</p>
      ) : null}

      {isError ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">
            No se pudo cargar el rendimiento institucional.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <PerformanceMetricCard
              title="Promedio institucional"
              value={data.institutionAverage}
            />
            <PerformanceMetricCard
              title="Cursos activos"
              value={data.courseCount}
              variant="count"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Curso</th>
                  <th className="px-4 py-3 text-left font-medium">Promedio</th>
                  <th className="px-4 py-3 text-left font-medium">Estudiantes</th>
                </tr>
              </thead>
              <tbody>
                {data.courses.map((course) => (
                  <tr key={course.courseId} className="border-t border-border">
                    <td className="px-4 py-3">{course.courseName}</td>
                    <td className="px-4 py-3">
                      <ScoreBadge value={course.averagePerformance} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {course.studentCount}
                    </td>
                  </tr>
                ))}
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
