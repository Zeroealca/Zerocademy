"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import type { AcademicPeriod } from "@/features/academic-periods/types";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { useAcademicPeriods } from "@/features/academic-periods/hooks/use-academic-periods";
import { TeacherAssignmentsTable } from "@/features/teacher-assignments/components/teacher-assignments-table";
import { useDeleteTeacherAssignment } from "@/features/teacher-assignments/hooks/use-teacher-assignment-mutations";
import { useTeacherAssignments } from "@/features/teacher-assignments/hooks/use-teacher-assignments";
import type {
  TeacherAssignment,
  TeacherAssignmentsFilters,
} from "@/features/teacher-assignments/types";
import {
  canManageAcademicStructure,
  canViewAcademicStructure,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const DEFAULT_FILTERS: TeacherAssignmentsFilters = {
  page: 1,
  limit: 10,
};

export function TeacherAssignmentsListPage() {
  const currentUser = useAuthStore((state) => state.user);
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const [filters, setFilters] = useState<TeacherAssignmentsFilters>(DEFAULT_FILTERS);
  const { data, isLoading, isError, refetch } = useTeacherAssignments(filters);

  useEffect(() => {
    if (effectivePeriodId && filters.academicPeriodId !== effectivePeriodId) {
      setFilters((prev) => ({
        ...prev,
        academicPeriodId: effectivePeriodId,
        page: 1,
      }));
    }
  }, [effectivePeriodId, filters.academicPeriodId]);
  const { data: periodsData } = useAcademicPeriods({ page: 1, limit: 100 });
  const removeAssignment = useDeleteTeacherAssignment();

  if (!canViewAcademicStructure(currentUser?.role)) {
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
