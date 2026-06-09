"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { AssessmentsTable } from "@/features/grades/components/assessments-table";
import { useAssessmentMutations } from "@/features/grades/hooks/use-assessment-mutations";
import { useAssessments } from "@/features/grades/hooks/use-assessments";
import type { Assessment, AssessmentsFilters } from "@/features/grades/types";
import {
  canManageAssessments,
  canViewAssessments,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const DEFAULT_FILTERS: AssessmentsFilters = { page: 1, limit: 10 };

export function AssessmentsListPage() {
  const currentUser = useAuthStore((state) => state.user);
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const [filters, setFilters] = useState<AssessmentsFilters>(DEFAULT_FILTERS);
  const { data, isLoading, isError, refetch } = useAssessments(filters);
  const { deleteMutation } = useAssessmentMutations();

  useEffect(() => {
    if (effectivePeriodId && filters.academicPeriodId !== effectivePeriodId) {
      setFilters((prev) => ({
        ...prev,
        academicPeriodId: effectivePeriodId,
        page: 1,
      }));
    }
  }, [effectivePeriodId, filters.academicPeriodId]);

  if (!canViewAssessments(currentUser?.role)) {
    return <AccessDenied />;
  }

  const canManage = canManageAssessments(currentUser?.role);

  const handleDelete = async (assessment: Assessment) => {
    if (
      !window.confirm(
        `¿Eliminar la evaluación "${assessment.title}"? Solo es posible si no tiene notas registradas.`,
      )
    ) {
      return;
    }
    await deleteMutation.mutateAsync(assessment.id);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Evaluaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea y administra instrumentos de evaluación por materia y trimestre.
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/grades/assessments/new">Nueva evaluación</Link>
          </Button>
        ) : null}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Título de la evaluación"
            value={filters.search ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                search: event.target.value || undefined,
                page: 1,
              }))
            }
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando evaluaciones…</p>
      ) : isError ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">
            No se pudieron cargar las evaluaciones.
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <AssessmentsTable
          assessments={data?.data ?? []}
          meta={
            data?.meta ?? {
              page: filters.page,
              limit: filters.limit,
              total: 0,
              totalPages: 0,
            }
          }
          canManage={canManage}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          onDelete={canManage ? handleDelete : undefined}
        />
      )}
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
