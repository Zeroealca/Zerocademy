"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  REGIME_LABELS,
  STATUS_LABELS,
  STATUS_VARIANTS,
} from "@/features/academic-periods/constants";
import {
  activateAcademicPeriod,
  deactivateAcademicPeriod,
} from "@/features/academic-periods/api/academic-periods.api";
import { academicPeriodsKeys } from "@/features/academic-periods/api/academic-periods.keys";
import type { AcademicPeriod, PaginationMeta } from "@/features/academic-periods/types";
import { ApiError } from "@/lib/api-error";

interface AcademicPeriodsTableProps {
  periods: AcademicPeriod[];
  meta: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}

export function AcademicPeriodsTable({
  periods,
  meta,
  isLoading,
  isError,
  canManage,
  onRetry,
  onPageChange,
}: AcademicPeriodsTableProps) {
  const queryClient = useQueryClient();

  const handleToggleActive = async (period: AcademicPeriod) => {
    const isActive = period.status === "ACTIVE" && period.isActive;

    if (!isActive) {
      const confirmed = window.confirm(
        `¿Activar el período «${period.name}» (${REGIME_LABELS[period.regime]})?\n\n` +
          "Se desactivará automáticamente cualquier otro período activo del mismo régimen.",
      );
      if (!confirmed) return;

      const previous = queryClient.getQueriesData<{
        data: AcademicPeriod[];
        meta: PaginationMeta;
      }>({ queryKey: academicPeriodsKeys.lists() });

      queryClient.setQueriesData<{
        data: AcademicPeriod[];
        meta: PaginationMeta;
      }>({ queryKey: academicPeriodsKeys.lists() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((p) => {
            if (p.id === period.id) {
              return { ...p, status: "ACTIVE" as const, isActive: true };
            }
            if (p.regime === period.regime && p.status === "ACTIVE") {
              return { ...p, status: "CLOSED" as const, isActive: false };
            }
            return p;
          }),
        };
      });

      try {
        await activateAcademicPeriod(period.id);
        void queryClient.invalidateQueries({ queryKey: academicPeriodsKeys.all });
      } catch (error) {
        previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
        const message =
          error instanceof ApiError
            ? error.message
            : "No se pudo activar el período.";
        window.alert(message);
      }
      return;
    }

    const confirmed = window.confirm(
      `¿Desactivar el período «${period.name}»?`,
    );
    if (!confirmed) return;

    try {
      await deactivateAcademicPeriod(period.id);
      void queryClient.invalidateQueries({ queryKey: academicPeriodsKeys.all });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo desactivar el período.";
      window.alert(message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Períodos académicos</CardTitle>
        <CardDescription>
          {meta.total} período{meta.total === 1 ? "" : "s"} configurado
          {meta.total === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando períodos…</p>
        ) : null}

        {isError ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              No se pudieron cargar los períodos académicos. Inténtalo de nuevo.
            </p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Régimen</th>
                    <th className="px-4 py-3 font-medium">Fechas</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {periods.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No se encontraron períodos académicos.
                      </td>
                    </tr>
                  ) : (
                    periods.map((period) => {
                      const isActive =
                        period.status === "ACTIVE" && period.isActive;

                      return (
                        <tr
                          key={period.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-4 py-3 font-medium">{period.name}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary">
                              {REGIME_LABELS[period.regime]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {period.startDate} → {period.endDate}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={STATUS_VARIANTS[period.status]}>
                              {STATUS_LABELS[period.status]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              {canManage ? (
                                <Button
                                  variant={isActive ? "secondary" : "default"}
                                  size="sm"
                                  onClick={() => void handleToggleActive(period)}
                                  disabled={
                                    period.status === "ARCHIVED" ||
                                    (period.status === "PLANNED" && !isActive
                                      ? false
                                      : false)
                                  }
                                >
                                  {isActive ? "Desactivar" : "Activar"}
                                </Button>
                              ) : null}
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/academic-periods/${period.id}`}>
                                  Ver
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {meta.totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {meta.page} de {meta.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page <= 1}
                    onClick={() => onPageChange(meta.page - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => onPageChange(meta.page + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
