"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAssessment } from "@/features/grades/hooks/use-assessments";
import {
  canManageAssessments,
  canViewAssessments,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

interface AssessmentDetailPageProps {
  assessmentId: string;
}

export function AssessmentDetailPage({ assessmentId }: AssessmentDetailPageProps) {
  const currentUser = useAuthStore((state) => state.user);
  const { data: assessment, isLoading, isError } = useAssessment(assessmentId);

  if (!canViewAssessments(currentUser?.role)) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando evaluación…</p>;
  }

  if (isError || !assessment) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">No se encontró la evaluación.</p>
        <Button asChild variant="outline">
          <Link href="/grades/assessments">Volver al listado</Link>
        </Button>
      </div>
    );
  }

  const canManage = canManageAssessments(currentUser?.role);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/grades/assessments">← Volver al listado</Link>
      </Button>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {assessment.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {assessment.subjectName} · {assessment.academicTermName} ·{" "}
            {assessment.academicPeriodName}
          </p>
        </div>
        {canManage ? (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/grades/entry?assessmentId=${assessment.id}`}>
                Registrar notas
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/grades/assessments/${assessment.id}/edit`}>
                Editar
              </Link>
            </Button>
          </div>
        ) : null}
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Detail label="Categoría" value={assessment.assessmentCategoryName} />
          <Detail label="Fecha" value={assessment.assessmentDate} />
          <Detail label="Nota máxima" value={String(assessment.maxScore)} />
          <Detail label="Peso" value={`${assessment.weight}%`} />
          {assessment.description ? (
            <div className="sm:col-span-2">
              <Detail label="Descripción" value={assessment.description} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
