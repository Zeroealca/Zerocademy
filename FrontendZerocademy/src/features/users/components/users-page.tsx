"use client";

import { useState } from "react";
import { CreateUserForm } from "@/features/users/components/create-user-form";
import { UsersTable } from "@/features/users/components/users-table";
import { useUsers } from "@/features/users/hooks/use-users";
import type { UsersFilters } from "@/features/users/types";
import { canManageUsers } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const DEFAULT_FILTERS: UsersFilters = {
  page: 1,
  limit: 10,
};

export function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState<UsersFilters>(DEFAULT_FILTERS);
  const { data, isLoading, isError, refetch } = useUsers(filters);

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

      <div className="grid gap-8 xl:grid-cols-[minmax(0,380px)_1fr]">
        <CreateUserForm />
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
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        />
      </div>
    </div>
  );
}
