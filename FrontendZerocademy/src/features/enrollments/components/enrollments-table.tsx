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
import { ENROLLMENT_STATUS_LABELS } from "@/features/enrollments/constants";
import type { Enrollment, PaginationMeta } from "@/features/enrollments/types";

interface EnrollmentsTableProps {
  enrollments: Enrollment[];
  meta: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}

export function EnrollmentsTable({
  enrollments,
  meta,
  isLoading,
  isError,
  canManage,
  onRetry,
  onPageChange,
}: EnrollmentsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Matrículas</CardTitle>
        <CardDescription>
          {meta.total} matrícula{meta.total === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando matrículas…</p>
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">No se pudo cargar el listado.</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Estudiante</th>
                    <th className="px-4 py-3 font-medium">Curso</th>
                    <th className="px-4 py-3 font-medium">Período</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    {canManage ? (
                      <th className="px-4 py-3 text-right font-medium">Acciones</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {enrollments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canManage ? 6 : 5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No hay matrículas registradas.
                      </td>
                    </tr>
                  ) : (
                    enrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="border-b border-border">
                        <td className="px-4 py-3">
                          {enrollment.student.firstName}{" "}
                          {enrollment.student.lastName}
                        </td>
                        <td className="px-4 py-3">
                          {enrollment.course.name} ({enrollment.course.section})
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {enrollment.academicPeriod.name}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">
                            {ENROLLMENT_STATUS_LABELS[enrollment.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {enrollment.enrollmentDate}
                        </td>
                        {canManage ? (
                          <td className="px-4 py-3 text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/enrollments/${enrollment.id}/edit`}>
                                Editar
                              </Link>
                            </Button>
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
        )}
      </CardContent>
    </Card>
  );
}
