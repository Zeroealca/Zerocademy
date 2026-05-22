"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { useInstitutionAcademicPeriods } from "@/features/academic-periods/hooks/use-institution-academic-periods";
import type { AcademicPeriod } from "@/features/academic-periods/types";
import { CoursesTable } from "@/features/courses/components/courses-table";
import {
  useActivateCourse,
  useDeactivateCourse,
} from "@/features/courses/hooks/use-course-mutations";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { useGradeLevels } from "@/features/grade-levels/hooks/use-grade-levels";
import type { Course, CoursesFilters } from "@/features/courses/types";
import {
  canManageAcademicStructure,
  canViewInstitutionOperations,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const DEFAULT_FILTERS: CoursesFilters = {
  page: 1,
  limit: 10,
};

export function CoursesListPage() {
  const currentUser = useAuthStore((state) => state.user);
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const [filters, setFilters] = useState<CoursesFilters>(DEFAULT_FILTERS);
  const { data, isLoading, isError, refetch } = useCourses(filters);

  useEffect(() => {
    if (effectivePeriodId && filters.academicPeriodId !== effectivePeriodId) {
      setFilters((prev) => ({
        ...prev,
        academicPeriodId: effectivePeriodId,
        page: 1,
      }));
    }
  }, [effectivePeriodId, filters.academicPeriodId]);
  const { data: periodsData } = useInstitutionAcademicPeriods();
  const { data: gradesData } = useGradeLevels({ page: 1, limit: 100 });
  const activate = useActivateCourse();
  const deactivate = useDeactivateCourse();

  if (!canViewInstitutionOperations(currentUser?.role)) {
    return <AccessDenied />;
  }

  const canManage = canManageAcademicStructure(currentUser?.role);

  const handleToggleActive = async (course: Course) => {
    if (
      !window.confirm(
        course.isActive
          ? `¿Desactivar el curso «${course.name}»?`
          : `¿Activar el curso «${course.name}»?`,
      )
    ) {
      return;
    }

    if (course.isActive) {
      await deactivate.mutateAsync(course.id);
    } else {
      await activate.mutateAsync(course.id);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Cursos y paralelos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona aulas y paralelos por período y grado.
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/courses/new">Nuevo curso</Link>
          </Button>
        ) : null}
      </header>

      <FiltersBar
        filters={filters}
        periods={periodsData?.data ?? []}
        grades={gradesData?.data ?? []}
        onChange={(next) => setFilters({ ...next, page: 1 })}
      />

      <CoursesTable
        courses={data?.data ?? []}
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
        onToggleActive={handleToggleActive}
      />
    </div>
  );
}

function FiltersBar({
  filters,
  periods,
  grades,
  onChange,
}: {
  filters: CoursesFilters;
  periods: AcademicPeriod[];
  grades: { id: string; name: string; code: string }[];
  onChange: (filters: CoursesFilters) => void;
}) {
  return (
    <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="search">Buscar</Label>
        <Input
          id="search"
          placeholder="Nombre o paralelo"
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

      <div className="space-y-2">
        <Label htmlFor="gradeFilter">Grado</Label>
        <Select
          id="gradeFilter"
          value={filters.gradeLevelId ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              gradeLevelId: event.target.value || undefined,
            })
          }
        >
          <option value="">Todos los grados</option>
          {grades.map((grade) => (
            <option key={grade.id} value={grade.id}>
              {grade.name}
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
        No tienes permiso para ver la estructura académica.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Volver al panel</Link>
      </Button>
    </div>
  );
}
