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
import type {
  PaginationMeta,
  TeacherAssignment,
} from "@/features/teacher-assignments/types";

interface TeacherAssignmentsTableProps {
  assignments: TeacherAssignment[];
  meta: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onDelete: (assignment: TeacherAssignment) => void;
}

export function TeacherAssignmentsTable({
  assignments,
  meta,
  isLoading,
  isError,
  canManage,
  onRetry,
  onPageChange,
  onDelete,
}: TeacherAssignmentsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Asignaciones docentes</CardTitle>
        <CardDescription>
          {meta.total} asignación{meta.total === 1 ? "" : "es"} registrada
          {meta.total === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando asignaciones…</p>
        ) : null}

        {isError ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              No se pudieron cargar las asignaciones. Inténtalo de nuevo.
            </p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Docente</th>
                    <th className="px-4 py-3 font-medium">Materia</th>
                    <th className="px-4 py-3 font-medium">Curso</th>
                    <th className="px-4 py-3 font-medium">Período</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No se encontraron asignaciones docentes.
                      </td>
                    </tr>
                  ) : (
                    assignments.map((assignment) => (
                      <tr
                        key={assignment.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 font-medium">
                          {assignment.teacherFirstName}{" "}
                          {assignment.teacherLastName}
                        </td>
                        <td className="px-4 py-3">
                          <div>{assignment.subjectName}</div>
                          <Badge variant="outline" className="mt-1">
                            {assignment.subjectCode}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{assignment.courseName}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {assignment.academicPeriodName}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canManage ? (
                            <>
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`/teacher-assignments/${assignment.id}/edit`}
                                >
                                  Editar
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(assignment)}
                              >
                                Eliminar
                              </Button>
                            </>
                          ) : null}
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
