"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EnrollmentsTable } from "@/features/enrollments/components/enrollments-table";
import { useStudentEnrollmentHistory } from "@/features/enrollments/hooks/use-enrollments";
import type { EnrollmentsFilters } from "@/features/enrollments/types";
import { useStudent } from "@/features/students/hooks/use-student";
import {
  canManageEnrollments,
  canViewStudents,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

interface StudentEnrollmentsPageProps {
  studentId: string;
}

export function StudentEnrollmentsPage({ studentId }: StudentEnrollmentsPageProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [filters] = useState<EnrollmentsFilters>({ page: 1, limit: 20 });
  const { data: student, isLoading: studentLoading } = useStudent(studentId);
  const { data, isLoading, isError, refetch } = useStudentEnrollmentHistory(
    studentId,
    filters,
  );

  if (!canViewStudents(currentUser?.role)) {
    return <AccessDenied />;
  }

  const canManage = canManageEnrollments(currentUser?.role);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/students">← Estudiantes</Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          Historial académico
        </h1>
        <p className="text-sm text-muted-foreground">
          {studentLoading
            ? "Cargando…"
            : student
              ? `${student.firstName} ${student.lastName}`
              : "Estudiante"}
        </p>
      </header>

      <EnrollmentsTable
        enrollments={data?.data ?? []}
        meta={
          data?.meta ?? {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          }
        }
        isLoading={isLoading}
        isError={isError}
        canManage={canManage}
        onRetry={() => refetch()}
        onPageChange={() => undefined}
      />
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
      <Button asChild variant="outline">
        <Link href="/students">Volver a estudiantes</Link>
      </Button>
    </div>
  );
}
