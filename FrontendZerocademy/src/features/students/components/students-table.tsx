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
import type { PaginationMeta, Student } from "@/features/students/types";

interface StudentsTableProps {
  students: Student[];
  meta: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onToggleActive: (student: Student) => void;
}

export function StudentsTable({
  students,
  meta,
  isLoading,
  isError,
  canManage,
  onRetry,
  onPageChange,
  onToggleActive,
}: StudentsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Estudiantes</CardTitle>
        <CardDescription>
          {meta.total} estudiante{meta.total === 1 ? "" : "s"} registrado
          {meta.total === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando estudiantes…</p>
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">
              No se pudo cargar el listado.
            </p>
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
                    <th className="px-4 py-3 font-medium">Cédula</th>
                    <th className="px-4 py-3 font-medium">Correo</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No hay estudiantes que coincidan con los filtros.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="border-b border-border">
                        <td className="px-4 py-3 font-medium">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {student.nationalId ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {student.email}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={student.isActive ? "success" : "secondary"}
                          >
                            {student.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/students/${student.id}/enrollments`}
                              >
                                Historial
                              </Link>
                            </Button>
                            {canManage ? (
                              <>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/students/${student.id}/edit`}>
                                    Editar
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onToggleActive(student)}
                                >
                                  {student.isActive ? "Desactivar" : "Activar"}
                                </Button>
                              </>
                            ) : null}
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
        )}
      </CardContent>
    </Card>
  );
}
