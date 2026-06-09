"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AssessmentForm } from "@/features/grades/components/assessment-form";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { useAssessmentMutations } from "@/features/grades/hooks/use-assessment-mutations";
import type { AssessmentFormInput } from "@/features/grades/schemas/assessment.schema";
import { canManageAssessments } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function CreateAssessmentPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const { createMutation } = useAssessmentMutations();

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
    await createMutation.mutateAsync(values);
    router.push("/grades/assessments");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/grades/assessments">← Volver al listado</Link>
      </Button>
      <AssessmentForm
        title="Nueva evaluación"
        description="Define un instrumento de evaluación vinculado a tu asignación docente."
        submitLabel="Crear evaluación"
        academicPeriodId={effectivePeriodId}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
