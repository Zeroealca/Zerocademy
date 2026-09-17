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
} from "@/features/subjects/constants";
import type { PaginationMeta, Subject } from "@/features/subjects/types";

interface SubjectsTableProps {
  subjects: Subject[];
  meta: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  canEdit?: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onToggleActive: (subject: Subject) => void;
}

export function SubjectsTable({
  subjects,
  meta,
  isLoading,
  isError,
  canManage,
  canEdit = false,
  onRetry,
  onPageChange,
  onToggleActive,
}: SubjectsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Materias</CardTitle>
        <CardDescription>
          {meta.total} materia{meta.total === 1 ? "" : "s"} registrada
          {meta.total === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando materias…</p>
        ) : null}

        {isError ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              No se pudieron cargar las materias. Inténtalo de nuevo.
            </p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Código</th>
                    <th className="px-4 py-3 font-medium">Grados</th>
                    <th className="px-4 py-3 font-medium">Ámbito</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    {canManage || canEdit ? <th className="px-4 py-3 font-medium text-right">
                      Acciones
                    </th> : null}
                  </tr>
                </thead>
                <tbody>
                  {subjects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canManage || canEdit ? 6 : 5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No se encontraron materias.
                      </td>
                    </tr>
                  ) : (
                    subjects.map((subject) => (
                      <tr
                        key={subject.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 font-medium">{subject.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {subject.code}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {subject.gradeLevels?.length
                            ? subject.gradeLevels
                                .map((grade) => grade.code)
                                .join(", ")
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">
                            {
                              SYSTEM_SCOPE_LABELS[
                                String(subject.isSystem) as "true" | "false"
                              ]
                            }
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              ACTIVE_STATUS_VARIANTS[
                                String(subject.isActive) as "true" | "false"
                              ]
                            }
                          >
                            {
                              ACTIVE_STATUS_LABELS[
                                String(subject.isActive) as "true" | "false"
                              ]
                            }
                          </Badge>
                        </td>
                        {canManage || canEdit ? <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {canManage ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleActive(subject)}
                              >
                                {subject.isActive ? "Desactivar" : "Activar"}
                              </Button>
                            ) : null}
                            {canManage || (canEdit && !subject.isSystem && subject.institutionId) ? (
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/subjects/${subject.id}/edit`}>
                                  Editar
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        </td> : null}
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
