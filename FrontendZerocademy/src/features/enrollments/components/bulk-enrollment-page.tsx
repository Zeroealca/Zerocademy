"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { useInstitutionAcademicPeriods } from "@/features/academic-periods/hooks/use-institution-academic-periods";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { useAvailableStudentsForEnrollment } from "@/features/enrollments/hooks/use-available-students-for-enrollment";
import { useEnrollmentMutations } from "@/features/enrollments/hooks/use-enrollment-mutations";
import type { BulkEnrollmentResult } from "@/features/enrollments/types";
import { formatStudentLabel } from "@/features/students/lib/format-student-label";
import { cn } from "@/lib/utils";
import {
  canManageEnrollments,
  canViewEnrollments,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";
import { ApiError } from "@/lib/api-error";

export function BulkEnrollmentPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const [academicPeriodId, setAcademicPeriodId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<BulkEnrollmentResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { bulkCreateMutation } = useEnrollmentMutations();
  const { data: periodsData } = useInstitutionAcademicPeriods();
  const { data: coursesData } = useCourses({
    page: 1,
    limit: 100,
    academicPeriodId: academicPeriodId || undefined,
    isActive: true,
  });

  useEffect(() => {
    if (effectivePeriodId && !academicPeriodId) {
      setAcademicPeriodId(effectivePeriodId);
    }
  }, [effectivePeriodId, academicPeriodId]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const availableFilters = useMemo(
    () =>
      courseId && academicPeriodId
        ? {
            courseId,
            academicPeriodId,
            search: debouncedSearch || undefined,
            page: 1,
            limit: 200,
          }
        : null,
    [courseId, academicPeriodId, debouncedSearch],
  );

  const {
    data: studentsData,
    isLoading: studentsLoading,
    isError: studentsError,
    refetch,
  } = useAvailableStudentsForEnrollment(availableFilters);

  const students = studentsData?.data ?? [];

  useEffect(() => {
    setSelectedIds(new Set());
    setResult(null);
    setSubmitError(null);
  }, [courseId, academicPeriodId]);

  if (!canViewEnrollments(currentUser?.role)) {
    return <AccessDenied />;
  }

  if (!canManageEnrollments(currentUser?.role)) {
    return <AccessDenied />;
  }

  const allSelected =
    students.length > 0 && students.every((s) => selectedIds.has(s.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(students.map((s) => s.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!courseId || !academicPeriodId || selectedIds.size === 0) return;

    setSubmitError(null);
    setResult(null);

    try {
      const bulkResult = await bulkCreateMutation.mutateAsync({
        courseId,
        academicPeriodId,
        studentIds: [...selectedIds],
      });
      setResult(bulkResult);
      if (bulkResult.enrolledCount > 0) {
        setSelectedIds(new Set());
        void refetch();
      }
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "No se pudo completar la matriculación masiva.",
      );
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Matriculación masiva
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Asigne varios estudiantes sin matrícula en el curso y paralelo
            seleccionados.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/enrollments">Volver a matrículas</Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Curso y período</CardTitle>
          <CardDescription>
            Solo se listan estudiantes activos que aún no están matriculados en
            ese curso.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bulk-academicPeriodId">Período académico</Label>
            <Select
              id="bulk-academicPeriodId"
              value={academicPeriodId}
              onChange={(e) => {
                setAcademicPeriodId(e.target.value);
                setCourseId("");
              }}
            >
              <option value="">Seleccionar período</option>
              {(periodsData?.data ?? []).map((period) => (
                <option key={period.id} value={period.id}>
                  {formatAcademicPeriodOptionLabel(period)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bulk-courseId">Curso / paralelo</Label>
            <Select
              id="bulk-courseId"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={!academicPeriodId}
            >
              <option value="">
                {academicPeriodId
                  ? "Seleccionar curso"
                  : "Seleccione un período primero"}
              </option>
              {(coursesData?.data ?? []).map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.section})
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estudiantes disponibles</CardTitle>
          <CardDescription>
            Nombre, apellido y cédula. Marque los que desea matricular.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student-search">Buscar</Label>
            <input
              id="student-search"
              type="search"
              placeholder="Nombre, apellido o cédula…"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={!courseId}
            />
          </div>

          {!courseId ? (
            <p className="text-sm text-muted-foreground">
              Seleccione un curso para ver estudiantes sin matrícula.
            </p>
          ) : studentsLoading ? (
            <p className="text-sm text-muted-foreground">Cargando estudiantes…</p>
          ) : studentsError ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">
                No se pudo cargar la lista de estudiantes.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          ) : students.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay estudiantes disponibles para matricular en este curso.
            </p>
          ) : (
            <>
              <label
                htmlFor="select-all-students"
                className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 text-sm font-medium"
              >
                <input
                  id="select-all-students"
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={allSelected}
                  onChange={toggleAll}
                />
                Seleccionar todos ({students.length})
              </label>
              <ul className="max-h-[min(24rem,50vh)] space-y-2 overflow-y-auto">
                {students.map((student) => (
                  <li key={student.id}>
                    <label
                      htmlFor={`student-${student.id}`}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm",
                        selectedIds.has(student.id) && "border-primary/50 bg-muted/40",
                      )}
                    >
                      <input
                        id={`student-${student.id}`}
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-border"
                        checked={selectedIds.has(student.id)}
                        onChange={() => toggleOne(student.id)}
                      />
                      <span>{formatStudentLabel(student)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}

          {submitError ? (
            <p className="text-sm text-destructive">{submitError}</p>
          ) : null}

          {result ? (
            <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
              <p>
                Matriculados: <strong>{result.enrolledCount}</strong>
                {result.skippedCount > 0
                  ? ` · Omitidos (ya matriculados): ${result.skippedCount}`
                  : ""}
                {result.failedCount > 0
                  ? ` · Errores: ${result.failedCount}`
                  : ""}
              </p>
              {result.errors.length > 0 ? (
                <ul className="mt-2 list-inside list-disc text-destructive">
                  {result.errors.map((err) => (
                    <li key={err.studentId}>{err.message}</li>
                  ))}
                </ul>
              ) : null}
              {result.enrolledCount > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 h-auto px-0"
                  onClick={() => router.push("/enrollments")}
                >
                  Ver listado de matrículas
                </Button>
              ) : null}
            </div>
          ) : null}

          <Button
            type="button"
            disabled={
              !courseId ||
              selectedIds.size === 0 ||
              bulkCreateMutation.isPending
            }
            onClick={() => void handleSubmit()}
          >
            {bulkCreateMutation.isPending
              ? "Matriculando…"
              : `Matricular seleccionados (${selectedIds.size})`}
          </Button>
        </CardContent>
      </Card>
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
