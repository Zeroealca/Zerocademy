"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAcademicLevels } from "@/features/academic-levels/hooks/use-academic-levels";
import { GradeLevelsTable } from "@/features/grade-levels/components/grade-levels-table";
import {
  useActivateGradeLevel,
  useDeactivateGradeLevel,
} from "@/features/grade-levels/hooks/use-grade-level-mutations";
import { useGradeLevels } from "@/features/grade-levels/hooks/use-grade-levels";
import type { GradeLevel, GradeLevelsFilters } from "@/features/grade-levels/types";
import {
  canManagePlatformCatalog,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const DEFAULT_FILTERS: GradeLevelsFilters = {
  page: 1,
  limit: 10,
};

export function GradeLevelsListPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState<GradeLevelsFilters>(DEFAULT_FILTERS);
  const { data, isLoading, isError, refetch } = useGradeLevels(filters);
  const { data: levelsData } = useAcademicLevels({ page: 1, limit: 100 });
  const activate = useActivateGradeLevel();
  const deactivate = useDeactivateGradeLevel();

  if (!canManagePlatformCatalog(currentUser?.role)) {
    return <AccessDenied />;
  }

  const canManage = true;

  const handleToggleActive = async (grade: GradeLevel) => {
    if (
      !window.confirm(
        grade.isActive
          ? `¿Desactivar el grado «${grade.name}»?`
          : `¿Activar el grado «${grade.name}»?`,
      )
    ) {
      return;
    }

    if (grade.isActive) {
      await deactivate.mutateAsync(grade.id);
    } else {
      await activate.mutateAsync(grade.id);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Grados</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra los grados o cursos dentro de cada nivel académico.
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/grade-levels/new">Nuevo grado</Link>
          </Button>
        ) : null}
      </header>

      <FiltersBar
        filters={filters}
        academicLevels={levelsData?.data ?? []}
        onChange={(next) => setFilters({ ...next, page: 1 })}
      />

      <GradeLevelsTable
        grades={data?.data ?? []}
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
  academicLevels,
  onChange,
}: {
  filters: GradeLevelsFilters;
  academicLevels: { id: string; name: string; code: string }[];
  onChange: (filters: GradeLevelsFilters) => void;
}) {
  return (
    <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="search">Buscar</Label>
        <Input
          id="search"
          placeholder="Nombre o código"
          value={filters.search ?? ""}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value || undefined })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="academicLevelFilter">Nivel académico</Label>
        <Select
          id="academicLevelFilter"
          value={filters.academicLevelId ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              academicLevelId: event.target.value || undefined,
            })
          }
        >
          <option value="">Todos los niveles</option>
          {academicLevels.map((level) => (
            <option key={level.id} value={level.id}>
              {level.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="isActiveFilter">Estado</Label>
        <Select
          id="isActiveFilter"
          value={
            filters.isActive === undefined ? "" : filters.isActive ? "true" : "false"
          }
          onChange={(event) => {
            const value = event.target.value;
            onChange({
              ...filters,
              isActive: value === "" ? undefined : value === "true",
            });
          }}
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
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
