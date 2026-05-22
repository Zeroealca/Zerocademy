"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AcademicLevelForm } from "@/features/academic-levels/components/academic-level-form";
import { useCreateAcademicLevel } from "@/features/academic-levels/hooks/use-academic-level-mutations";
import type { CreateAcademicLevelInput } from "@/features/academic-levels/schemas/academic-level.schema";
import {
  canManagePlatformCatalog,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function CreateAcademicLevelPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const createLevel = useCreateAcademicLevel();

  if (!canManagePlatformCatalog(currentUser?.role)) {
    return (
      <AccessDenied
        href="/academic-levels"
        label="Volver al listado"
        message="Solo el super administrador puede crear niveles académicos."
      />
    );
  }

  const handleSubmit = async (values: CreateAcademicLevelInput) => {
    const level = await createLevel.mutateAsync(values);
    router.push(`/academic-levels/${level.id}/edit`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/academic-levels">← Volver al listado</Link>
      </Button>
      <AcademicLevelForm
        title="Nuevo nivel académico"
        description="Define una etapa educativa del catálogo institucional o del sistema."
        submitLabel="Crear nivel"
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
