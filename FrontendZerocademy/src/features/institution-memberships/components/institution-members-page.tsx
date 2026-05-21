"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { InstitutionContextNav } from "@/features/institutions/components/institution-context-nav";
import { useInstitution } from "@/features/institutions/hooks/use-institution";
import { AssignInstitutionMemberForm } from "@/features/institution-memberships/components/assign-institution-member-form";
import { InstitutionMembersTable } from "@/features/institution-memberships/components/institution-members-table";
import { MEMBERSHIP_ROLE_LABELS } from "@/features/institution-memberships/constants";
import { useInstitutionMembershipMutations } from "@/features/institution-memberships/hooks/use-institution-membership-mutations";
import { useInstitutionMemberships } from "@/features/institution-memberships/hooks/use-institution-memberships";
import type {
  InstitutionMembership,
  InstitutionMembershipsFilters,
} from "@/features/institution-memberships/types";
import {
  canManageInstitutionMemberships,
  canViewInstitutionMemberships,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const DEFAULT_FILTERS: InstitutionMembershipsFilters = {
  page: 1,
  limit: 10,
};

interface InstitutionMembersPageProps {
  institutionId: string;
}

export function InstitutionMembersPage({ institutionId }: InstitutionMembersPageProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState<InstitutionMembershipsFilters>(DEFAULT_FILTERS);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const { data: institution, isLoading: institutionLoading } =
    useInstitution(institutionId);
  const { data, isLoading, isError, refetch } = useInstitutionMemberships(
    institutionId,
    filters,
  );
  const { activateMutation, deactivateMutation, removeMutation } =
    useInstitutionMembershipMutations(institutionId);

  if (!canViewInstitutionMemberships(currentUser?.role)) {
    return <AccessDenied />;
  }

  const canManage = canManageInstitutionMemberships(currentUser?.role);

  const handleToggleActive = async (membership: InstitutionMembership) => {
    const action = membership.isActive ? "desactivar" : "activar";
    const confirmed = window.confirm(
      `¿Confirmas que deseas ${action} a ${membership.userFirstName} ${membership.userLastName}?`,
    );
    if (!confirmed) return;

    if (membership.isActive) {
      await deactivateMutation.mutateAsync(membership.id);
    } else {
      await activateMutation.mutateAsync(membership.id);
    }
  };

  const handleRemove = async (membership: InstitutionMembership) => {
    const confirmed = window.confirm(
      `¿Quitar a ${membership.userFirstName} ${membership.userLastName} de esta institución?`,
    );
    if (!confirmed) return;
    await removeMutation.mutateAsync(membership.id);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              <Link href="/institutions" className="hover:text-foreground">
                Instituciones
              </Link>
              {" / "}
              {institutionLoading ? "…" : institution?.name}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Miembros de la institución
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Asigna administradores y docentes a esta institución educativa.
            </p>
          </div>
          {canManage ? (
            <Button onClick={() => setShowAssignForm((prev) => !prev)}>
              {showAssignForm ? "Ocultar formulario" : "Asignar miembro"}
            </Button>
          ) : null}
        </div>
        <InstitutionContextNav institutionId={institutionId} />
      </header>

      {showAssignForm && canManage ? (
        <AssignInstitutionMemberForm
          institutionId={institutionId}
          onSuccess={() => setShowAssignForm(false)}
        />
      ) : null}

      <FiltersBar filters={filters} onChange={(next) => setFilters({ ...next, page: 1 })} />

      <InstitutionMembersTable
        memberships={data?.data ?? []}
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
        canManage={canManage}
        onRetry={() => refetch()}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onToggleActive={handleToggleActive}
        onRemove={handleRemove}
      />
    </div>
  );
}

function FiltersBar({
  filters,
  onChange,
}: {
  filters: InstitutionMembershipsFilters;
  onChange: (filters: InstitutionMembershipsFilters) => void;
}) {
  return (
    <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-3">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="search">Buscar</Label>
        <Input
          id="search"
          placeholder="Nombre o correo"
          value={filters.search ?? ""}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value || undefined })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select
          id="role"
          value={filters.role ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              role:
                event.target.value === ""
                  ? undefined
                  : (event.target.value as InstitutionMembershipsFilters["role"]),
            })
          }
        >
          <option value="">Todos</option>
          <option value="ADMIN">{MEMBERSHIP_ROLE_LABELS.ADMIN}</option>
          <option value="TEACHER">{MEMBERSHIP_ROLE_LABELS.TEACHER}</option>
        </Select>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
      <p className="text-sm text-muted-foreground">
        No tienes permiso para ver los miembros de la institución.
      </p>
      <Button asChild variant="outline">
        <Link href="/institutions">Volver a instituciones</Link>
      </Button>
    </div>
  );
}
