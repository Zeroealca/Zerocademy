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
  REGION_LABELS,
  STATUS_LABELS,
} from "@/features/institutions/constants";
import type { Institution, PaginationMeta } from "@/features/institutions/types";

interface InstitutionsTableProps {
  institutions: Institution[];
  meta: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onToggleActive: (institution: Institution) => void;
}

export function InstitutionsTable({
  institutions,
  meta,
  isLoading,
  isError,
  canManage,
  onRetry,
  onPageChange,
  onToggleActive,
}: InstitutionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Instituciones educativas</CardTitle>
        <CardDescription>
          {meta.total} institución{meta.total === 1 ? "" : "es"} registrada
          {meta.total === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando instituciones…</p>
        ) : null}

        {isError ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              No se pudieron cargar las instituciones. Inténtalo de nuevo.
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
                    <th className="px-4 py-3 font-medium">Código</th>
                    <th className="px-4 py-3 font-medium">Región</th>
                    <th className="px-4 py-3 font-medium">Régimen</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No hay instituciones registradas.
                      </td>
                    </tr>
                  ) : (
                    institutions.map((institution) => (
                      <tr
                        key={institution.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 font-medium">
                          {institution.name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {institution.code}
                        </td>
                        <td className="px-4 py-3">
                          {institution.region
                            ? REGION_LABELS[institution.region]
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {institution.regime
                            ? REGIME_LABELS[institution.regime]
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              institution.isActive ? "default" : "secondary"
                            }
                          >
                            {institution.isActive
                              ? STATUS_LABELS.active
                              : STATUS_LABELS.inactive}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/institutions/${institution.id}/settings`}
                              >
                                Configuración
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/institutions/${institution.id}/members`}
                              >
                                Miembros
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/institutions/${institution.id}/transitions`}
                              >
                                Transiciones
                              </Link>
                            </Button>
                            {canManage ? (
                              <>
                                <Button variant="outline" size="sm" asChild>
                                  <Link
                                    href={`/institutions/${institution.id}/edit`}
                                  >
                                    Editar
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onToggleActive(institution)}
                                >
                                  {institution.isActive
                                    ? "Desactivar"
                                    : "Activar"}
                                </Button>
                              </>
                            ) : null}
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
