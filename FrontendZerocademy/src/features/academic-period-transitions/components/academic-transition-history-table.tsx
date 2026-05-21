"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  AcademicTransitionRecord,
  PaginationMeta,
} from "@/features/academic-period-transitions/types";

interface AcademicTransitionHistoryTableProps {
  transitions: AcademicTransitionRecord[];
  meta: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}

export function AcademicTransitionHistoryTable({
  transitions,
  meta,
  isLoading,
  isError,
  onRetry,
  onPageChange,
}: AcademicTransitionHistoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historial de transiciones</CardTitle>
        <CardDescription>
          Registro de cambios de año lectivo sin sobrescribir datos históricos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando historial…</p>
        ) : null}

        {isError ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              No se pudo cargar el historial. Inténtalo de nuevo.
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
                    <th className="px-4 py-3 font-medium">Origen</th>
                    <th className="px-4 py-3 font-medium">Destino</th>
                    <th className="px-4 py-3 font-medium">Copias</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {transitions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        Aún no hay transiciones registradas.
                      </td>
                    </tr>
                  ) : (
                    transitions.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3">{row.fromPeriod.name}</td>
                        <td className="px-4 py-3">{row.toPeriod.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {row.copiedCourses ? (
                              <Badge variant="secondary">Cursos</Badge>
                            ) : null}
                            {row.copiedAssignments ? (
                              <Badge variant="secondary">Asignaciones</Badge>
                            ) : null}
                            {row.copiedTerms ? (
                              <Badge variant="secondary">Términos</Badge>
                            ) : null}
                            {row.copiedStructures ? (
                              <Badge variant="outline">Estructuras reutilizadas</Badge>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(row.createdAt).toLocaleString("es-EC")}
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
