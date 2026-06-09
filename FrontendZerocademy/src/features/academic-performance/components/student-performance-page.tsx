"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PerformanceMetricCard } from "@/features/academic-performance/components/performance-metric-card";
import { ScoreBadge } from "@/features/academic-performance/components/score-badge";
import {
  useAdminStudentPerformance,
  useTeacherStudentPerformance,
} from "@/features/academic-performance/hooks/use-academic-performance";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { useStudents } from "@/features/students/hooks/use-students";
import {
  canViewAcademicPerformanceAdmin,
  canViewAcademicPerformanceTeacher,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function StudentPerformancePage() {
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = canViewAcademicPerformanceAdmin(role);
  const isTeacher = canViewAcademicPerformanceTeacher(role);
  const effectivePeriodId = useEffectiveAcademicPeriodId();

  const [academicPeriodId, setAcademicPeriodId] = useState(
    effectivePeriodId ?? "",
  );
  const [courseId, setCourseId] = useState("");
  const [studentId, setStudentId] = useState("");

  useEffect(() => {
    if (effectivePeriodId) setAcademicPeriodId(effectivePeriodId);
  }, [effectivePeriodId]);

  const { data: coursesData } = useCourses({
    page: 1,
    limit: 100,
    academicPeriodId: academicPeriodId || undefined,
  });

  const { data: studentsData } = useStudents({
    page: 1,
    limit: 100,
    isActive: true,
  });

  const query =
    academicPeriodId && studentId
      ? {
          academicPeriodId,
          studentId,
          ...(courseId ? { courseId } : {}),
        }
      : undefined;

  const teacherQuery = useTeacherStudentPerformance(
    isTeacher && !isAdmin ? query : undefined,
  );
  const adminQuery = useAdminStudentPerformance(isAdmin ? query : undefined);

  const { data, isLoading, isError, refetch } = isAdmin
    ? adminQuery
    : teacherQuery;

  if (!isTeacher && !isAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Rendimiento estudiantil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Promedios por materia de un estudiante en el período seleccionado.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Curso / paralelo</Label>
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Todos (admin)</option>
            {(coursesData?.data ?? []).map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} {course.section}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Estudiante</Label>
          <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Selecciona un estudiante</option>
            {(studentsData?.data ?? []).map((student) => (
              <option key={student.id} value={student.id}>
                {student.lastName} {student.firstName}
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
            No se pudo cargar el rendimiento del estudiante.
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
              title={data.studentName}
              value={data.overallAverage}
              subtitle="Promedio general del período"
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
                {data.subjects.map((subject) => (
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
