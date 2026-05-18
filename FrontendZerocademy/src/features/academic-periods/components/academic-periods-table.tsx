"use client";

import Link from "next/link";
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
import type { AcademicPeriod, PaginationMeta } from "@/features/academic-periods/types";

interface AcademicPeriodsTableProps {
  periods: AcademicPeriod[];
  meta: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}

export function AcademicPeriodsTable({
  periods,
  meta,
  isLoading,
  isError,
  onRetry,
  onPageChange,
}: AcademicPeriodsTableProps) {
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
              <table className="w-full min-w-[720px] text-left text-sm">
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
                    periods.map((period) => (
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
                        <td className="px-4 py-3 text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/academic-periods/${period.id}`}>
                              Ver
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))
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
