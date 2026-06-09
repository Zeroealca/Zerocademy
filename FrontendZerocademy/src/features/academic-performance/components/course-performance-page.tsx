"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PerformanceMetricCard } from "@/features/academic-performance/components/performance-metric-card";
import { ScoreBadge } from "@/features/academic-performance/components/score-badge";
import { useAdminCoursePerformance } from "@/features/academic-performance/hooks/use-academic-performance";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { canViewAcademicPerformanceAdmin } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function CoursePerformancePage() {
  const role = useAuthStore((state) => state.user?.role);
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const [academicPeriodId, setAcademicPeriodId] = useState(
    effectivePeriodId ?? "",
  );
  const [courseId, setCourseId] = useState("");

  useEffect(() => {
    if (effectivePeriodId) setAcademicPeriodId(effectivePeriodId);
  }, [effectivePeriodId]);

  const { data: coursesData } = useCourses({
    page: 1,
    limit: 100,
    academicPeriodId: academicPeriodId || undefined,
  });

  const { data, isLoading, isError, refetch } = useAdminCoursePerformance(
    academicPeriodId && courseId
      ? { academicPeriodId, courseId }
      : undefined,
  );

  if (!canViewAcademicPerformanceAdmin(role)) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Rendimiento del curso
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Promedios por materia y promedio general del paralelo.
        </p>
      </header>

      <div className="max-w-sm space-y-2">
        <Label>Curso / paralelo</Label>
        <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">Selecciona un curso</option>
          {(coursesData?.data ?? []).map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} {course.section}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando rendimiento…</p>
      ) : null}

      {isError ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">
            No se pudo cargar el rendimiento del curso.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {data ? (
        <>
          <PerformanceMetricCard
            title={data.courseName}
            value={data.courseAverage}
            subtitle="Promedio general del curso"
          />

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Materia</th>
                  <th className="px-4 py-3 text-left font-medium">Promedio</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Estudiantes calificados
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((subject) => (
                  <tr key={subject.subjectId} className="border-t border-border">
                    <td className="px-4 py-3">{subject.subjectName}</td>
                    <td className="px-4 py-3">
                      <ScoreBadge value={subject.classAverage} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {subject.gradedStudentCount} / {subject.studentCount}
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
