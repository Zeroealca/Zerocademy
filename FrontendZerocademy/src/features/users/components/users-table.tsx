"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROLE_LABELS } from "@/features/users/constants";
import type {
  PaginationMeta,
  User,
  UserSortField,
  UserSortOrder,
} from "@/features/users/types";

interface UsersTableProps {
  users: User[];
  meta: PaginationMeta;
  sortBy?: UserSortField;
  sortOrder?: UserSortOrder;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onSort: (field: UserSortField) => void;
}

export function UsersTable({
  users,
  meta,
  sortBy,
  sortOrder,
  isLoading,
  isError,
  onRetry,
  onPageChange,
  onSort,
}: UsersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Directorio</CardTitle>
        <CardDescription>
          {meta.total} cuenta{meta.total === 1 ? "" : "s"} en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando usuarios…</p>
        ) : null}

        {isError ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              No se pudieron cargar los usuarios. Inténtalo de nuevo.
            </p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Correo</th>
                    <SortableColumnHeader
                      label="Rol"
                      field="role"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={onSort}
                    />
                    <SortableColumnHeader
                      label="Estado"
                      field="isActive"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={onSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 font-medium">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {user.email}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={user.isActive ? "success" : "muted"}
                          >
                            {user.isActive ? "Activo" : "Inactivo"}
                          </Badge>
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

function SortableColumnHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  field: UserSortField;
  sortBy?: UserSortField;
  sortOrder?: UserSortOrder;
  onSort: (field: UserSortField) => void;
}) {
  const active = sortBy === field;
  const ariaSort = !active
    ? "none"
    : sortOrder === "desc"
      ? "descending"
      : "ascending";
  const nextDirection =
    active && sortOrder === "asc" ? "descendente" : "ascendente";

  return (
    <th className="px-4 py-3 font-medium" aria-sort={ariaSort}>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onSort(field)}
        aria-label={`Ordenar por ${label}, ${nextDirection}`}
      >
        {label}
        {active ? (
          sortOrder === "desc" ? (
            <ArrowDown className="size-3.5" aria-hidden />
          ) : (
            <ArrowUp className="size-3.5" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="size-3.5 text-muted-foreground" aria-hidden />
        )}
      </button>
    </th>
  );
}
