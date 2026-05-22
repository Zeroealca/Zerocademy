"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AcademicLevelsTable } from "@/features/academic-levels/components/academic-levels-table";
import {
  useActivateAcademicLevel,
  useDeactivateAcademicLevel,
} from "@/features/academic-levels/hooks/use-academic-level-mutations";
import { useAcademicLevels } from "@/features/academic-levels/hooks/use-academic-levels";
import type {
  AcademicLevel,
  AcademicLevelsFilters,
} from "@/features/academic-levels/types";
import {
  canManagePlatformCatalog,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const DEFAULT_FILTERS: AcademicLevelsFilters = {
  page: 1,
  limit: 10,
};

export function AcademicLevelsListPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState<AcademicLevelsFilters>(DEFAULT_FILTERS);
  const { data, isLoading, isError, refetch } = useAcademicLevels(filters);
  const activate = useActivateAcademicLevel();
  const deactivate = useDeactivateAcademicLevel();

  if (!canManagePlatformCatalog(currentUser?.role)) {
    return <AccessDenied />;
  }

  const canManage = true;

  const handleToggleActive = async (level: AcademicLevel) => {
    if (
      !window.confirm(
        level.isActive
          ? `¿Desactivar el nivel «${level.name}»?`
          : `¿Activar el nivel «${level.name}»?`,
      )
    ) {
      return;
    }

    if (level.isActive) {
      await deactivate.mutateAsync(level.id);
    } else {
      await activate.mutateAsync(level.id);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Niveles académicos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configura etapas educativas (inicial, básica, bachillerato, etc.).
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/academic-levels/new">Nuevo nivel</Link>
          </Button>
        ) : null}
      </header>

      <FiltersBar
        filters={filters}
        onChange={(next) => setFilters({ ...next, page: 1 })}
      />

      <AcademicLevelsTable
        levels={data?.data ?? []}
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
  filters: AcademicLevelsFilters;
  onChange: (filters: AcademicLevelsFilters) => void;
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
              isActive:
                value === "" ? undefined : value === "true",
            });
          }}
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
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
              isSystem:
                value === "" ? undefined : value === "true",
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
        No tienes permiso para ver la estructura académica.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Volver al panel</Link>
      </Button>
    </div>
  );
}
