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
import {
  ACTIVE_STATUS_LABELS,
  ACTIVE_STATUS_VARIANTS,
} from "@/features/courses/constants";
import type { Course, PaginationMeta } from "@/features/courses/types";

interface CoursesTableProps {
  courses: Course[];
  meta: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onToggleActive: (course: Course) => void;
}

export function CoursesTable({
  courses,
  meta,
  isLoading,
  isError,
  canManage,
  onRetry,
  onPageChange,
  onToggleActive,
}: CoursesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cursos y paralelos</CardTitle>
        <CardDescription>
          {meta.total} curso{meta.total === 1 ? "" : "s"} registrado
          {meta.total === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando cursos…</p>
        ) : null}

        {isError ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              No se pudieron cargar los cursos. Inténtalo de nuevo.
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
                    <th className="px-4 py-3 font-medium">Paralelo</th>
                    <th className="px-4 py-3 font-medium">Capacidad</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No se encontraron cursos ni paralelos.
                      </td>
                    </tr>
                  ) : (
                    courses.map((course) => (
                      <tr
                        key={course.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 font-medium">{course.name}</td>
                        <td className="px-4 py-3">{course.section}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {course.capacity ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              ACTIVE_STATUS_VARIANTS[
                                String(course.isActive) as "true" | "false"
                              ]
                            }
                          >
                            {
                              ACTIVE_STATUS_LABELS[
                                String(course.isActive) as "true" | "false"
                              ]
                            }
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {canManage ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleActive(course)}
                              >
                                {course.isActive ? "Desactivar" : "Activar"}
                              </Button>
                            ) : null}
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/courses/${course.id}/edit`}>
                                Editar
                              </Link>
                            </Button>
                          </div>
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
