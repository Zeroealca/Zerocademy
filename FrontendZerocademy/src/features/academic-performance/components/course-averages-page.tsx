"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ScoreBadge } from "@/features/academic-performance/components/score-badge";
import { useTeacherCourseAverages } from "@/features/academic-performance/hooks/use-academic-performance";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { canViewAcademicPerformanceTeacher } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function CourseAveragesPage() {
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

  const { data, isLoading, isError, refetch } = useTeacherCourseAverages(
    academicPeriodId && courseId
      ? { academicPeriodId, courseId }
      : undefined,
  );

  if (!canViewAcademicPerformanceTeacher(role)) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Promedios del curso
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Promedio por materia del paralelo seleccionado.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
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
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando promedios…</p>
      ) : null}

      {isError ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">
            No se pudieron cargar los promedios del curso.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {data ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {data.courseName} · {data.subjects.length} materias con datos
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Materia</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Promedio del curso
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Estudiantes calificados
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Sin calificaciones registradas para este curso.
                    </td>
                  </tr>
                ) : (
                  data.subjects.map((subject) => (
                    <tr key={subject.subjectId} className="border-t border-border">
                      <td className="px-4 py-3">{subject.subjectName}</td>
                      <td className="px-4 py-3">
                        <ScoreBadge value={subject.classAverage} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {subject.gradedStudentCount} / {subject.studentCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
