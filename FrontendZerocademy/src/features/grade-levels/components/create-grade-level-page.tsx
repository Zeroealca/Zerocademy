"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GradeLevelForm } from "@/features/grade-levels/components/grade-level-form";
import { useCreateGradeLevel } from "@/features/grade-levels/hooks/use-grade-level-mutations";
import type { CreateGradeLevelInput } from "@/features/grade-levels/schemas/grade-level.schema";
import {
  canManageAcademicStructure,
  canViewAcademicStructure,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function CreateGradeLevelPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const createGrade = useCreateGradeLevel();

  if (!canViewAcademicStructure(currentUser?.role)) {
    return <AccessDenied href="/dashboard" label="Volver al panel" />;
  }

  if (!canManageAcademicStructure(currentUser?.role)) {
    return (
      <AccessDenied
        href="/grade-levels"
        label="Volver al listado"
        message="Solo los administradores pueden crear grados."
      />
    );
  }

  const handleSubmit = async (values: CreateGradeLevelInput) => {
    const grade = await createGrade.mutateAsync(values);
    router.push(`/grade-levels/${grade.id}/edit`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/grade-levels">← Volver al listado</Link>
      </Button>
      <GradeLevelForm
        title="Nuevo grado"
        description="Asocia un grado o curso a un nivel académico del catálogo."
        submitLabel="Crear grado"
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function AccessDenied({
  href,
  label,
  message,
}: {
  href: string;
  label: string;
  message?: string;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
      <Button asChild variant="outline">
        <Link href={href}>{label}</Link>
      </Button>
    </div>
  );
}
