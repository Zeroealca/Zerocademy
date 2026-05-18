"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AcademicLevelForm,
  academicLevelToFormValues,
} from "@/features/academic-levels/components/academic-level-form";
import { useAcademicLevel } from "@/features/academic-levels/hooks/use-academic-level";
import { useUpdateAcademicLevel } from "@/features/academic-levels/hooks/use-academic-level-mutations";
import type { CreateAcademicLevelInput } from "@/features/academic-levels/schemas/academic-level.schema";
import {
  canManageAcademicStructure,
  canViewAcademicStructure,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

interface EditAcademicLevelPageProps {
  levelId: string;
}

export function EditAcademicLevelPage({ levelId }: EditAcademicLevelPageProps) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const { data: level, isLoading, isError } = useAcademicLevel(levelId);
  const updateLevel = useUpdateAcademicLevel(levelId);

  if (!canViewAcademicStructure(currentUser?.role)) {
    return <AccessDenied href="/dashboard" label="Volver al panel" />;
  }

  if (!canManageAcademicStructure(currentUser?.role)) {
    return (
      <AccessDenied href="/academic-levels" label="Volver al listado" />
    );
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Cargando nivel académico…</p>
    );
  }

  if (isError || !level) {
    return (
      <p className="text-sm text-destructive">
        No se pudo cargar el nivel académico.
      </p>
    );
  }

  const handleSubmit = async (values: CreateAcademicLevelInput) => {
    await updateLevel.mutateAsync(values);
    router.push("/academic-levels");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/academic-levels">← Volver al listado</Link>
      </Button>
      <AcademicLevelForm
        title="Editar nivel académico"
        description={`Actualiza la configuración de ${level.name}.`}
        submitLabel="Guardar cambios"
        defaultValues={academicLevelToFormValues(level)}
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
