"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StudentsTable } from "@/features/students/components/students-table";
import { useStudentMutations } from "@/features/students/hooks/use-student-mutations";
import { useStudents } from "@/features/students/hooks/use-students";
import type { Student, StudentsFilters } from "@/features/students/types";
import {
  canManageStudents,
  canViewStudents,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const DEFAULT_FILTERS: StudentsFilters = { page: 1, limit: 10 };

export function StudentsListPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState<StudentsFilters>(DEFAULT_FILTERS);
  const { data, isLoading, isError, refetch } = useStudents(filters);
  const { activateMutation, deactivateMutation } = useStudentMutations();

  if (!canViewStudents(currentUser?.role)) {
    return <AccessDenied />;
  }

  const canManage = canManageStudents(currentUser?.role);

  const handleToggleActive = async (student: Student) => {
    const action = student.isActive ? "desactivar" : "activar";
    if (!window.confirm(`¿Confirmas ${action} a ${student.firstName}?`)) return;
    if (student.isActive) {
      await deactivateMutation.mutateAsync(student.id);
    } else {
      await activateMutation.mutateAsync(student.id);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estudiantes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entidades permanentes con matrículas por período y curso.
          </p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/students/bulk-import">Importar masivamente</Link>
            </Button>
            <Button asChild>
              <Link href="/students/new">Nuevo estudiante</Link>
            </Button>
          </div>
        ) : null}
      </header>

      <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Nombre, correo o cédula"
            value={filters.search ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                search: e.target.value || undefined,
                page: 1,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="isActive">Estado</Label>
          <Select
            id="isActive"
            value={
              filters.isActive === undefined ? "" : String(filters.isActive)
            }
            onChange={(e) => {
              const value = e.target.value;
              setFilters((prev) => ({
                ...prev,
                isActive: value === "" ? undefined : value === "true",
                page: 1,
              }));
            }}
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </Select>
        </div>
      </div>

      <StudentsTable
        students={data?.data ?? []}
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
      />
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
      <p className="text-sm text-muted-foreground">
        No tienes permiso para ver estudiantes.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Volver al panel</Link>
      </Button>
    </div>
  );
}
