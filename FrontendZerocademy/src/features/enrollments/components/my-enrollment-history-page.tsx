"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EnrollmentsTable } from "@/features/enrollments/components/enrollments-table";
import { useStudentEnrollmentHistory } from "@/features/enrollments/hooks/use-enrollments";
import type { EnrollmentsFilters } from "@/features/enrollments/types";
import { useMyStudent } from "@/features/students/hooks/use-my-student";
import { canViewOwnEnrollmentHistory } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function MyEnrollmentHistoryPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState<EnrollmentsFilters>({
    page: 1,
    limit: 20,
  });
  const { data: student, isLoading: studentLoading } = useMyStudent();
  const { data, isLoading, isError, refetch } = useStudentEnrollmentHistory(
    student?.id ?? "",
    filters,
  );

  if (!canViewOwnEnrollmentHistory(currentUser?.role)) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Mis matrículas
        </h1>
        <p className="text-sm text-muted-foreground">
          {studentLoading
            ? "Cargando…"
            : student
              ? `${student.firstName} ${student.lastName}`
              : "Historial académico por período y curso"}
        </p>
      </header>

      <EnrollmentsTable
        enrollments={data?.data ?? []}
        meta={
          data?.meta ?? {
            page: filters.page,
            limit: filters.limit,
            total: 0,
            totalPages: 0,
          }
        }
        isLoading={isLoading || studentLoading || !student?.id}
        isError={isError}
        canManage={false}
        onRetry={() => refetch()}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
      />
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
      <Button asChild variant="outline">
        <Link href="/dashboard">Volver al panel</Link>
      </Button>
    </div>
  );
}
