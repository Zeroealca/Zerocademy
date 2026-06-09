"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AssessmentForm } from "@/features/grades/components/assessment-form";
import { useAssessment } from "@/features/grades/hooks/use-assessments";
import { useAssessmentMutations } from "@/features/grades/hooks/use-assessment-mutations";
import type { AssessmentFormInput } from "@/features/grades/schemas/assessment.schema";
import { canManageAssessments } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

interface EditAssessmentPageProps {
  assessmentId: string;
}

export function EditAssessmentPage({ assessmentId }: EditAssessmentPageProps) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const { data: assessment, isLoading, isError } = useAssessment(assessmentId);
  const { updateMutation } = useAssessmentMutations();

  if (!canManageAssessments(currentUser?.role)) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
        <Button asChild variant="outline">
          <Link href="/grades/assessments">Volver al listado</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (values: AssessmentFormInput) => {
    await updateMutation.mutateAsync({ id: assessmentId, payload: values });
    router.push(`/grades/assessments/${assessmentId}`);
  };

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/grades/assessments/${assessmentId}`}>← Volver al detalle</Link>
      </Button>
      <AssessmentForm
        title="Editar evaluación"
        description="Actualiza los datos del instrumento de evaluación."
        submitLabel="Guardar cambios"
        initialAssessment={assessment}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
