"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { InstitutionsTable } from "@/features/institutions/components/institutions-table";
import {
  ACADEMIC_REGIMES,
  INSTITUTION_REGIONS,
  REGIME_LABELS,
  REGION_LABELS,
} from "@/features/institutions/constants";
import { useInstitutionMutations } from "@/features/institutions/hooks/use-institution-mutations";
import { useInstitutions } from "@/features/institutions/hooks/use-institutions";
import type { Institution, InstitutionsFilters } from "@/features/institutions/types";
import {
  canManageInstitutions,
  canViewAcademicTransitions,
  canViewInstitutionMemberships,
  canViewInstitutions,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const DEFAULT_FILTERS: InstitutionsFilters = {
  page: 1,
  limit: 10,
};

export function InstitutionsListPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState<InstitutionsFilters>(DEFAULT_FILTERS);
  const { data, isLoading, isError, refetch } = useInstitutions(filters);
  const { activateMutation, deactivateMutation } = useInstitutionMutations();

  if (!canViewInstitutions(currentUser?.role)) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
        <p className="text-sm text-muted-foreground">
          No tienes permiso para ver instituciones educativas.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    );
  }

  const canManage = canManageInstitutions(currentUser?.role);
  const canViewMembers = canViewInstitutionMemberships(currentUser?.role);
  const canViewTransitions = canViewAcademicTransitions(currentUser?.role);

  const handleToggleActive = async (institution: Institution) => {
    const action = institution.isActive ? "desactivar" : "activar";
    const confirmed = window.confirm(
      `¿Confirmas que deseas ${action} la institución «${institution.name}»?`,
    );

    if (!confirmed) {
      return;
    }

    if (institution.isActive) {
      await deactivateMutation.mutateAsync(institution.id);
    } else {
      await activateMutation.mutateAsync(institution.id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Instituciones educativas
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona colegios e instituciones con configuración y marca propias.
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/institutions/new">Nueva institución</Link>
          </Button>
        ) : null}
      </div>

      <FiltersBar
        filters={filters}
        onChange={(next) => setFilters({ ...next, page: 1 })}
      />

      <InstitutionsTable
        institutions={data?.data ?? []}
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
        canViewMembers={canViewMembers}
        canViewTransitions={canViewTransitions}
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
  filters: InstitutionsFilters;
  onChange: (filters: InstitutionsFilters) => void;
}) {
  return (
    <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="search">Buscar</Label>
        <Input
          id="search"
          placeholder="Nombre, código o correo"
          value={filters.search ?? ""}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value || undefined })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="region">Región</Label>
        <Select
          id="region"
          value={filters.region ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              region: event.target.value
                ? (event.target.value as InstitutionsFilters["region"])
                : undefined,
            })
          }
        >
          <option value="">Todas</option>
          {INSTITUTION_REGIONS.map((region) => (
            <option key={region} value={region}>
              {REGION_LABELS[region]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="isActive">Estado</Label>
        <Select
          id="isActive"
          value={
            filters.isActive === undefined ? "" : String(filters.isActive)
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
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </Select>
      </div>

      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor="regime">Régimen académico</Label>
        <Select
          id="regime"
          value={filters.regime ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              regime: event.target.value
                ? (event.target.value as InstitutionsFilters["regime"])
                : undefined,
            })
          }
        >
          <option value="">Todos</option>
          {ACADEMIC_REGIMES.map((regime) => (
            <option key={regime} value={regime}>
              {REGIME_LABELS[regime]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
