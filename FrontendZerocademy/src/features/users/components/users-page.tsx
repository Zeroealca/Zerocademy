"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CreateUserForm } from "@/features/users/components/create-user-form";
import { UsersTable } from "@/features/users/components/users-table";
import { ROLE_LABELS, USER_ROLES, nextUsersSort } from "@/features/users/constants";
import { useUsers } from "@/features/users/hooks/use-users";
import type { UsersFilters } from "@/features/users/types";
import { canManageUsers } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";
import type { UserRole } from "@/stores/use-auth-store";

const DEFAULT_FILTERS: UsersFilters = {
  page: 1,
  limit: 10,
};

const SEARCH_DEBOUNCE_MS = 500;

export function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState<UsersFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const { data, isLoading, isError, refetch } = useUsers(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      const search = searchInput.trim() || undefined;
      setFilters((prev) => {
        if (prev.search === search) {
          return prev;
        }
        return { ...prev, search, page: 1 };
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchInput]);

  if (!canManageUsers(currentUser?.role)) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
        <p className="text-sm text-muted-foreground">
          No tienes permiso para gestionar usuarios. Contacta a un super
          administrador si necesitas acceso.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Gestión de usuarios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea cuentas y asigna roles para tu institución.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,380px)_1fr] xl:items-start">
        <CreateUserForm />
        <div className="space-y-4">
          <UsersFiltersBar
            search={searchInput}
            filters={filters}
            canViewSuperAdmins={currentUser?.role === "SUPER_ADMIN"}
            onSearchChange={setSearchInput}
            onFilterChange={(next) => setFilters({ ...next, page: 1 })}
          />
          <UsersTable
            users={data?.data ?? []}
            meta={
              data?.meta ?? {
                page: filters.page,
                limit: filters.limit,
                total: 0,
                totalPages: 0,
              }
            }
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            onSort={(field) =>
              setFilters((prev) => ({
                ...prev,
                ...nextUsersSort(field, prev.sortBy, prev.sortOrder),
                page: 1,
              }))
            }
          />
        </div>
      </div>
    </div>
  );
}

function UsersFiltersBar({
  search,
  filters,
  canViewSuperAdmins,
  onSearchChange,
  onFilterChange,
}: {
  search: string;
  filters: UsersFilters;
  canViewSuperAdmins: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (filters: UsersFilters) => void;
}) {
  const roleOptions = USER_ROLES.filter(
    (role) => role !== "SUPER_ADMIN" || canViewSuperAdmins,
  );

  return (
    <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="users-search">Buscar</Label>
        <Input
          id="users-search"
          type="search"
          placeholder="Nombre o correo"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="users-role">Rol</Label>
        <Select
          id="users-role"
          value={filters.role ?? ""}
          onChange={(event) =>
            onFilterChange({
              ...filters,
              role: event.target.value
                ? (event.target.value as UserRole)
                : undefined,
            })
          }
        >
          <option value="">Todos</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="users-status">Estado</Label>
        <Select
          id="users-status"
          value={
            filters.isActive === undefined ? "" : String(filters.isActive)
          }
          onChange={(event) => {
            const value = event.target.value;
            onFilterChange({
              ...filters,
              isActive: value === "" ? undefined : value === "true",
            });
          }}
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </Select>
      </div>
    </div>
  );
}
