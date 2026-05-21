"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AcademicPeriodsTable } from "@/features/academic-periods/components/academic-periods-table";
import {
  ACADEMIC_PERIOD_STATUSES,
  ACADEMIC_REGIMES,
  REGIME_LABELS,
  STATUS_LABELS,
} from "@/features/academic-periods/constants";
import { useAcademicPeriods } from "@/features/academic-periods/hooks/use-academic-periods";
import type { AcademicPeriodsFilters } from "@/features/academic-periods/types";
import { canManageAcademicPeriods } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const DEFAULT_FILTERS: AcademicPeriodsFilters = {
  page: 1,
  limit: 10,
};

export function AcademicPeriodsListPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState<AcademicPeriodsFilters>(DEFAULT_FILTERS);
  const { data, isLoading, isError, refetch } = useAcademicPeriods(filters);

  if (!canManageAcademicPeriods(currentUser?.role)) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
        <p className="text-sm text-muted-foreground">
          No tienes permiso para ver períodos académicos.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    );
  }

  const canManage = canManageAcademicPeriods(currentUser?.role);

  return (
    <div className="space-y-8">
      <PageHeader canManage={canManage} />

      <FiltersBar
        filters={filters}
        onChange={(next) => setFilters({ ...next, page: 1 })}
      />

      <AcademicPeriodsTable
        periods={data?.data ?? []}
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
      />
    </div>
  );
}

function PageHeader({ canManage }: { canManage: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Períodos académicos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona calendarios escolares ecuatorianos por régimen educativo.
        </p>
      </div>
      {canManage ? (
        <Button asChild>
          <Link href="/academic-periods/new">Nuevo período</Link>
        </Button>
      ) : null}
    </div>
  );
}

function FiltersBar({
  filters,
  onChange,
}: {
  filters: AcademicPeriodsFilters;
  onChange: (filters: AcademicPeriodsFilters) => void;
}) {
  return (
    <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="search">Buscar</Label>
        <Input
          id="search"
          placeholder="2025-2026"
          value={filters.search ?? ""}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value || undefined })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="regimeFilter">Régimen</Label>
        <Select
          id="regimeFilter"
          value={filters.regime ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              regime:
                event.target.value === ""
                  ? undefined
                  : (event.target.value as AcademicPeriodsFilters["regime"]),
            })
          }
        >
          <option value="">Todos los regímenes</option>
          {ACADEMIC_REGIMES.map((regime) => (
            <option key={regime} value={regime}>
              {REGIME_LABELS[regime]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="statusFilter">Estado</Label>
        <Select
          id="statusFilter"
          value={filters.status ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              status:
                event.target.value === ""
                  ? undefined
                  : (event.target.value as AcademicPeriodsFilters["status"]),
            })
          }
        >
          <option value="">Todos los estados</option>
          {ACADEMIC_PERIOD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
