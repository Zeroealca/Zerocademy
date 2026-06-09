"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PerformanceMetricCard } from "@/features/academic-performance/components/performance-metric-card";
import { ScoreBadge } from "@/features/academic-performance/components/score-badge";
import { useTeacherSubjectPerformance } from "@/features/academic-performance/hooks/use-academic-performance";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { useTeacherAssignments } from "@/features/teacher-assignments/hooks/use-teacher-assignments";
import { canViewAcademicPerformanceTeacher } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function SubjectPerformancePage() {
  const role = useAuthStore((state) => state.user?.role);
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const [academicPeriodId, setAcademicPeriodId] = useState(
    effectivePeriodId ?? "",
  );
  const [courseId, setCourseId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  useEffect(() => {
    if (effectivePeriodId) setAcademicPeriodId(effectivePeriodId);
  }, [effectivePeriodId]);

  const { data: coursesData } = useCourses({
    page: 1,
    limit: 100,
    academicPeriodId: academicPeriodId || undefined,
  });

  const { data: assignmentsData } = useTeacherAssignments({
    page: 1,
    limit: 100,
    academicPeriodId: academicPeriodId || undefined,
    courseId: courseId || undefined,
  });

  const subjects = useMemo(() => {
    const map = new Map<string, string>();
    for (const assignment of assignmentsData?.data ?? []) {
      map.set(assignment.subjectId, assignment.subjectName);
    }
    return [...map.entries()];
  }, [assignmentsData?.data]);

  const { data, isLoading, isError, refetch } = useTeacherSubjectPerformance(
    academicPeriodId && courseId && subjectId
      ? { academicPeriodId, courseId, subjectId }
      : undefined,
  );

  if (!canViewAcademicPerformanceTeacher(role)) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Rendimiento por materia
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Promedio del curso y detalle por estudiante en la materia seleccionada.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Curso / paralelo</Label>
          <Select
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setSubjectId("");
            }}
          >
            <option value="">Selecciona un curso</option>
            {(coursesData?.data ?? []).map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} {course.section}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Materia</Label>
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Selecciona una materia</option>
            {subjects.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando rendimiento…</p>
      ) : null}

      {isError ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">
            No se pudo cargar el rendimiento de la materia.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {data ? (
        <>
          <PerformanceMetricCard
            title={`Promedio de ${data.subjectName}`}
            value={data.classAverage}
            subtitle={`${data.students.length} estudiantes en el curso`}
          />

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Estudiante</th>
                  <th className="px-4 py-3 text-left font-medium">Promedio</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((student) => (
                  <tr key={student.studentId} className="border-t border-border">
                    <td className="px-4 py-3">{student.studentName}</td>
                    <td className="px-4 py-3">
                      <ScoreBadge
                        value={student.subjectAverage}
                        isPassing={student.isPassing}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {student.isPassing === true
                        ? "Aprobado"
                        : student.isPassing === false
                          ? "Requiere refuerzo"
                          : "—"}
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
