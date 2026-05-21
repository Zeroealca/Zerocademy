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
import {
  MEMBERSHIP_ROLE_LABELS,
  MEMBERSHIP_STATUS_LABELS,
} from "@/features/institution-memberships/constants";
import type {
  InstitutionMembership,
  PaginationMeta,
} from "@/features/institution-memberships/types";

interface InstitutionMembersTableProps {
  memberships: InstitutionMembership[];
  meta: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onToggleActive: (membership: InstitutionMembership) => void;
  onRemove: (membership: InstitutionMembership) => void;
}

export function InstitutionMembersTable({
  memberships,
  meta,
  isLoading,
  isError,
  canManage,
  onRetry,
  onPageChange,
  onToggleActive,
  onRemove,
}: InstitutionMembersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Miembros de la institución</CardTitle>
        <CardDescription>
          {meta.total} miembro{meta.total === 1 ? "" : "s"} registrado
          {meta.total === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando miembros…</p>
        ) : null}

        {isError ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              No se pudieron cargar los miembros. Inténtalo de nuevo.
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
                    <th className="px-4 py-3 font-medium">Correo</th>
                    <th className="px-4 py-3 font-medium">Rol</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    {canManage ? (
                      <th className="px-4 py-3 font-medium text-right">Acciones</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {memberships.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canManage ? 5 : 4}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No hay miembros asignados a esta institución.
                      </td>
                    </tr>
                  ) : (
                    memberships.map((membership) => (
                      <tr
                        key={membership.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 font-medium">
                          {membership.userFirstName} {membership.userLastName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {membership.userEmail}
                        </td>
                        <td className="px-4 py-3">
                          {MEMBERSHIP_ROLE_LABELS[membership.role]}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={membership.isActive ? "default" : "secondary"}
                          >
                            {membership.isActive
                              ? MEMBERSHIP_STATUS_LABELS.active
                              : MEMBERSHIP_STATUS_LABELS.inactive}
                          </Badge>
                        </td>
                        {canManage ? (
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onToggleActive(membership)}
                              >
                                {membership.isActive ? "Desactivar" : "Activar"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRemove(membership)}
                              >
                                Quitar
                              </Button>
                            </div>
                          </td>
                        ) : null}
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
