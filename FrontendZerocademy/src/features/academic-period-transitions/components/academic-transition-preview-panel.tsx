"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AcademicTransitionPreview } from "@/features/academic-period-transitions/types";

interface AcademicTransitionPreviewPanelProps {
  preview: AcademicTransitionPreview | null;
  isLoading: boolean;
  errorMessage?: string;
}

export function AcademicTransitionPreviewPanel({
  preview,
  isLoading,
  errorMessage,
}: AcademicTransitionPreviewPanelProps) {
  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Generando vista previa…</p>
    );
  }

  if (errorMessage) {
    return <p className="text-sm text-destructive">{errorMessage}</p>;
  }

  if (!preview) {
    return (
      <p className="text-sm text-muted-foreground">
        Completa los pasos anteriores y pulsa «Vista previa» para ver el resumen.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Períodos</CardTitle>
          <CardDescription>Origen y destino de la transición</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Origen: </span>
            {preview.fromPeriod.name}
          </p>
          <p>
            <span className="text-muted-foreground">Destino: </span>
            {preview.toPeriod?.name ??
              (preview.willCreateTargetPeriod
                ? "Se creará un período nuevo"
                : "—")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Copias estimadas</CardTitle>
          <CardDescription>Registros que se crearán en el período destino</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Cursos: {preview.estimatedCopies.courses}</p>
          <p>Asignaciones docentes: {preview.estimatedCopies.teacherAssignments}</p>
          <p>Términos académicos: {preview.estimatedCopies.terms}</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Estructura reutilizable</CardTitle>
          <CardDescription>
            Niveles, grados y materias permanecen en catálogo compartido
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
          <p>Niveles: {preview.reusableStructures.academicLevels}</p>
          <p>Grados: {preview.reusableStructures.gradeLevels}</p>
          <p>Materias: {preview.reusableStructures.subjects}</p>
          {preview.structuresReusedNotCopied ? (
            <p className="sm:col-span-3 text-muted-foreground">
              La estructura académica no se duplica; solo se copian entidades
              ligadas al período (cursos, términos y asignaciones opcionales).
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
