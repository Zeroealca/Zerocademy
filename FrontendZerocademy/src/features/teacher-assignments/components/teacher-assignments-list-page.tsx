"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { useUsers } from "@/features/users/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import type { AcademicPeriod } from "@/features/academic-periods/types";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { useInstitutionAcademicPeriods } from "@/features/academic-periods/hooks/use-institution-academic-periods";
import { TeacherAssignmentsTable } from "@/features/teacher-assignments/components/teacher-assignments-table";
import { useDeleteTeacherAssignment } from "@/features/teacher-assignments/hooks/use-teacher-assignment-mutations";
import { useTeacherAssignments } from "@/features/teacher-assignments/hooks/use-teacher-assignments";
import type {
  TeacherAssignment,
  TeacherAssignmentsFilters,
} from "@/features/teacher-assignments/types";
import {
  canManageAcademicStructure,
  canViewInstitutionOperations,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const DEFAULT_FILTERS: TeacherAssignmentsFilters = {
  page: 1,
  limit: 10,
};

export function TeacherAssignmentsListPage() {
  const currentUser = useAuthStore((state) => state.user);
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const lastEffectivePeriodId = useRef<string | undefined>(undefined);
  const [filters, setFilters] = useState<TeacherAssignmentsFilters>(DEFAULT_FILTERS);
  const { data, isLoading, isError, refetch } = useTeacherAssignments(filters);

  useEffect(() => {
    if (lastEffectivePeriodId.current !== effectivePeriodId) {
      lastEffectivePeriodId.current = effectivePeriodId;
      setFilters((prev) => ({
        ...prev,
        academicPeriodId: effectivePeriodId,
        courseId: undefined,
        page: 1,
      }));
    }
  }, [effectivePeriodId]);
  const { data: periodsData } = useInstitutionAcademicPeriods();
  const removeAssignment = useDeleteTeacherAssignment();

  if (!canViewInstitutionOperations(currentUser?.role)) {
    return <AccessDenied />;
  }

  const canManage = canManageAcademicStructure(currentUser?.role);

  const handleDelete = async (assignment: TeacherAssignment) => {
    if (
      !window.confirm(
        `¿Eliminar la asignación de ${assignment.teacherFirstName} ${assignment.teacherLastName} para ${assignment.subjectName}?`,
      )
    ) {
      return;
    }

    await removeAssignment.mutateAsync(assignment.id);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Asignaciones docentes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Asigna docentes a materias, cursos y períodos académicos.
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/teacher-assignments/new">Nueva asignación</Link>
          </Button>
        ) : null}
      </header>

      <FiltersBar
        filters={filters}
        periods={periodsData?.data ?? []}
        onChange={(next) => setFilters({ ...next, page: 1 })}
      />

      <TeacherAssignmentsTable
        assignments={data?.data ?? []}
        meta={
          data?.meta ?? {
            page: filters.page,
            limit: filters.limit,
            total: 0,
            totalPages: 0,
          }
        }
        isLoading={isLoading}
        isError={isError}
        canManage={canManage}
        onRetry={() => refetch()}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onDelete={handleDelete}
      />
    </div>
  );
}

function FiltersBar({
  filters,
  periods,
  onChange,
}: {
  filters: TeacherAssignmentsFilters;
  periods: AcademicPeriod[];
  onChange: (filters: TeacherAssignmentsFilters) => void;
}) {
  const { data: coursesData, isLoading: coursesLoading, isError: coursesError } = useCourses({
    page: 1,
    limit: 100,
    academicPeriodId: filters.academicPeriodId,
  });
  const { data: teachersData, isLoading: teachersLoading, isError: teachersError } = useUsers({
    page: 1,
    limit: 100,
    role: "TEACHER",
  });
  return (
    <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="search">Buscar</Label>
        <Input
          id="search"
          placeholder="Docente o materia"
          value={filters.search ?? ""}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value || undefined })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="periodFilter">Período</Label>
        <Select
          id="periodFilter"
          value={filters.academicPeriodId ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              academicPeriodId: event.target.value || undefined,
              courseId: undefined,
            })
          }
        >
          <option value="">Todos los períodos</option>
          {periods.map((period) => (
            <option key={period.id} value={period.id}>
              {formatAcademicPeriodOptionLabel(period)}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="courseFilter">Curso</Label>
        <Select
          id="courseFilter"
          value={filters.courseId ?? ""}
          disabled={coursesLoading || coursesError}
          onChange={(event) => onChange({ ...filters, courseId: event.target.value || undefined })}
        >
          <option value="">{coursesLoading ? "Cargando cursos..." : coursesError ? "No se pudieron cargar los cursos" : "Todos los cursos"}</option>
          {(coursesData?.data ?? []).map((course) => (
            <option key={course.id} value={course.id}>{course.name} ({course.section})</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="teacherFilter">Profesor</Label>
        <Select
          id="teacherFilter"
          value={filters.teacherId ?? ""}
          disabled={teachersLoading || teachersError}
          onChange={(event) => onChange({ ...filters, teacherId: event.target.value || undefined })}
        >
          <option value="">{teachersLoading ? "Cargando profesores..." : teachersError ? "No se pudieron cargar los profesores" : "Todos los profesores"}</option>
          {(teachersData?.data ?? []).filter((teacher) => teacher.profileType === "teacher" && teacher.profileId).map((teacher) => (
            <option key={teacher.id} value={teacher.profileId}>{teacher.firstName} {teacher.lastName}</option>
          ))}
        </Select>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
      <p className="text-sm text-muted-foreground">
        No tienes permiso para ver las asignaciones docentes.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Volver al panel</Link>
      </Button>
    </div>
  );
}
