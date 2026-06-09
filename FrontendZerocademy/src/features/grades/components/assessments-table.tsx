"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Assessment, PaginationMeta } from "@/features/grades/types";

interface AssessmentsTableProps {
  assessments: Assessment[];
  meta: PaginationMeta;
  canManage: boolean;
  onPageChange: (page: number) => void;
  onDelete?: (assessment: Assessment) => void;
}

export function AssessmentsTable({
  assessments,
  meta,
  canManage,
  onPageChange,
  onDelete,
}: AssessmentsTableProps) {
  if (assessments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No hay evaluaciones registradas con los filtros actuales.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Evaluación</th>
              <th className="px-4 py-3 font-medium">Materia</th>
              <th className="px-4 py-3 font-medium">Trimestre</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Máx.</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((assessment) => (
              <tr key={assessment.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium">{assessment.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {assessment.assessmentCategoryName}
                  </div>
                </td>
                <td className="px-4 py-3">{assessment.subjectName}</td>
                <td className="px-4 py-3">{assessment.academicTermName}</td>
                <td className="px-4 py-3">{assessment.assessmentDate}</td>
                <td className="px-4 py-3">{assessment.maxScore}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/grades/assessments/${assessment.id}`}>
                        Ver
                      </Link>
                    </Button>
                    {canManage ? (
                      <>
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/grades/entry?assessmentId=${assessment.id}`}
                          >
                            Notas
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link
                            href={`/grades/assessments/${assessment.id}/edit`}
                          >
                            Editar
                          </Link>
                        </Button>
                        {onDelete ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => onDelete(assessment)}
                          >
                            Eliminar
                          </Button>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {meta.page} de {meta.totalPages}
          </span>
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
    </div>
  );
}
