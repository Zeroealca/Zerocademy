"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubjectsTable } from "@/features/subjects/components/subjects-table";
import {
  useActivateSubject,
  useDeactivateSubject,
} from "@/features/subjects/hooks/use-subject-mutations";
import { useSubjects } from "@/features/subjects/hooks/use-subjects";
import type { Subject, SubjectsFilters } from "@/features/subjects/types";
import {
  canManageAcademicStructure,
  canViewAcademicStructure,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const DEFAULT_FILTERS: SubjectsFilters = {
  page: 1,
  limit: 10,
};

export function SubjectsListPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState<SubjectsFilters>(DEFAULT_FILTERS);
  const { data, isLoading, isError, refetch } = useSubjects(filters);
  const activate = useActivateSubject();
  const deactivate = useDeactivateSubject();

  if (!canViewAcademicStructure(currentUser?.role)) {
    return <AccessDenied />;
  }

  const canManage = canManageAcademicStructure(currentUser?.role);

  const handleToggleActive = async (subject: Subject) => {
    if (
      !window.confirm(
        subject.isActive
          ? `¿Desactivar la materia «${subject.name}»?`
          : `¿Activar la materia «${subject.name}»?`,
      )
    ) {
      return;
    }

    if (subject.isActive) {
      await deactivate.mutateAsync(subject.id);
    } else {
      await activate.mutateAsync(subject.id);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Materias</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catálogo reutilizable de materias para asignaciones docentes.
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/subjects/new">Nueva materia</Link>
          </Button>
        ) : null}
      </header>

      <FiltersBar
        filters={filters}
        onChange={(next) => setFilters({ ...next, page: 1 })}
      />

      <SubjectsTable
        subjects={data?.data ?? []}
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
  onChange,
}: {
  filters: SubjectsFilters;
  onChange: (filters: SubjectsFilters) => void;
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
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="isSystemFilter">Ámbito</Label>
        <Select
          id="isSystemFilter"
          value={
            filters.isSystem === undefined ? "" : filters.isSystem ? "true" : "false"
          }
          onChange={(event) => {
            const value = event.target.value;
            onChange({
              ...filters,
              isSystem: value === "" ? undefined : value === "true",
            });
          }}
        >
          <option value="">Todos</option>
          <option value="true">Sistema</option>
          <option value="false">Personalizado</option>
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
        No tienes permiso para ver el catálogo de materias.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Volver al panel</Link>
      </Button>
    </div>
  );
}
