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
  ACTIVE_STATUS_LABELS,
  ACTIVE_STATUS_VARIANTS,
  SYSTEM_SCOPE_LABELS,
} from "@/features/academic-levels/constants";
import type {
  AcademicLevel,
  PaginationMeta,
} from "@/features/academic-levels/types";

interface AcademicLevelsTableProps {
  levels: AcademicLevel[];
  meta: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onToggleActive: (level: AcademicLevel) => void;
}

export function AcademicLevelsTable({
  levels,
  meta,
  isLoading,
  isError,
  canManage,
  onRetry,
  onPageChange,
  onToggleActive,
}: AcademicLevelsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Niveles académicos</CardTitle>
        <CardDescription>
          {meta.total} nivel{meta.total === 1 ? "" : "es"} registrado
          {meta.total === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando niveles…</p>
        ) : null}

        {isError ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              No se pudieron cargar los niveles académicos. Inténtalo de nuevo.
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
                    <th className="px-4 py-3 font-medium">Código</th>
                    <th className="px-4 py-3 font-medium">Orden</th>
                    <th className="px-4 py-3 font-medium">Ámbito</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {levels.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No se encontraron niveles académicos.
                      </td>
                    </tr>
                  ) : (
                    levels.map((level) => (
                      <tr
                        key={level.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 font-medium">{level.name}</td>
                        <td className="px-4 py-3">{level.code}</td>
                        <td className="px-4 py-3">{level.order}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">
                            {SYSTEM_SCOPE_LABELS[String(level.isSystem) as "true" | "false"]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              ACTIVE_STATUS_VARIANTS[
                                String(level.isActive) as "true" | "false"
                              ]
                            }
                          >
                            {
                              ACTIVE_STATUS_LABELS[
                                String(level.isActive) as "true" | "false"
                              ]
                            }
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {canManage ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleActive(level)}
                              >
                                {level.isActive ? "Desactivar" : "Activar"}
                              </Button>
                            ) : null}
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/academic-levels/${level.id}/edit`}>
                                Editar
                              </Link>
                            </Button>
                          </div>
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
