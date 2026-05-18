"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  GradeLevelForm,
  gradeLevelToFormValues,
} from "@/features/grade-levels/components/grade-level-form";
import { useGradeLevel } from "@/features/grade-levels/hooks/use-grade-level";
import { useUpdateGradeLevel } from "@/features/grade-levels/hooks/use-grade-level-mutations";
import type { CreateGradeLevelInput } from "@/features/grade-levels/schemas/grade-level.schema";
import {
  canManageAcademicStructure,
  canViewAcademicStructure,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

interface EditGradeLevelPageProps {
  gradeId: string;
}

export function EditGradeLevelPage({ gradeId }: EditGradeLevelPageProps) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const { data: grade, isLoading, isError } = useGradeLevel(gradeId);
  const updateGrade = useUpdateGradeLevel(gradeId);

  if (!canViewAcademicStructure(currentUser?.role)) {
    return <AccessDenied href="/dashboard" label="Volver al panel" />;
  }

  if (!canManageAcademicStructure(currentUser?.role)) {
    return <AccessDenied href="/grade-levels" label="Volver al listado" />;
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando grado…</p>;
  }

  if (isError || !grade) {
    return (
      <p className="text-sm text-destructive">No se pudo cargar el grado.</p>
    );
  }

  const handleSubmit = async (values: CreateGradeLevelInput) => {
    await updateGrade.mutateAsync(values);
    router.push("/grade-levels");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/grade-levels">← Volver al listado</Link>
      </Button>
      <GradeLevelForm
        title="Editar grado"
        description={`Actualiza la configuración de ${grade.name}.`}
        submitLabel="Guardar cambios"
        defaultValues={gradeLevelToFormValues(grade)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function AccessDenied({ href, label }: { href: string; label: string }) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
      <Button asChild variant="outline">
        <Link href={href}>{label}</Link>
      </Button>
    </div>
  );
}
