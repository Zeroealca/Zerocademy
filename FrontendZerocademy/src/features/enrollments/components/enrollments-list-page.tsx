"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { useInstitutionAcademicPeriods } from "@/features/academic-periods/hooks/use-institution-academic-periods";
import { ENROLLMENT_STATUSES, ENROLLMENT_STATUS_LABELS } from "@/features/enrollments/constants";
import { EnrollmentsTable } from "@/features/enrollments/components/enrollments-table";
import { useEnrollments } from "@/features/enrollments/hooks/use-enrollments";
import type { EnrollmentsFilters } from "@/features/enrollments/types";
import {
  canManageEnrollments,
  canViewEnrollments,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const DEFAULT_FILTERS: EnrollmentsFilters = { page: 1, limit: 10 };

export function EnrollmentsListPage() {
  const currentUser = useAuthStore((state) => state.user);
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const [filters, setFilters] = useState<EnrollmentsFilters>(DEFAULT_FILTERS);
  const { data, isLoading, isError, refetch } = useEnrollments(filters);
  const { data: periodsData } = useInstitutionAcademicPeriods();

  useEffect(() => {
    if (effectivePeriodId && filters.academicPeriodId !== effectivePeriodId) {
      setFilters((prev) => ({
        ...prev,
        academicPeriodId: effectivePeriodId,
        page: 1,
      }));
    }
  }, [effectivePeriodId, filters.academicPeriodId]);

  if (!canViewEnrollments(currentUser?.role)) {
    return <AccessDenied />;
  }

  const canManage = canManageEnrollments(currentUser?.role);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Matrículas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Relación estudiante ↔ curso ↔ período académico.
          </p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/enrollments/bulk">Matriculación masiva</Link>
            </Button>
            <Button asChild>
              <Link href="/enrollments/new">Nueva matrícula</Link>
            </Button>
          </div>
        ) : null}
      </header>

      <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="academicPeriodId">Período</Label>
          <Select
            id="academicPeriodId"
            value={filters.academicPeriodId ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                academicPeriodId: e.target.value || undefined,
                page: 1,
              }))
            }
          >
            <option value="">Todos</option>
            {(periodsData?.data ?? []).map((period) => (
              <option key={period.id} value={period.id}>
                {formatAcademicPeriodOptionLabel(period)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select
            id="status"
            value={filters.status ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: (e.target.value || undefined) as EnrollmentsFilters["status"],
                page: 1,
              }))
            }
          >
            <option value="">Todos</option>
            {ENROLLMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ENROLLMENT_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <EnrollmentsTable
        enrollments={data?.data ?? []}
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
