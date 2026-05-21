"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  InstitutionForm,
  formValuesToPayload,
  institutionToFormValues,
} from "@/features/institutions/components/institution-form";
import { InstitutionLogoUpload } from "@/features/institutions/components/institution-logo-upload";
import { useInstitution } from "@/features/institutions/hooks/use-institution";
import { useInstitutionMutations } from "@/features/institutions/hooks/use-institution-mutations";
import type { InstitutionFormValues } from "@/features/institutions/schemas/institution.schema";
import { canManageInstitutions } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

interface EditInstitutionPageProps {
  institutionId: string;
}

export function EditInstitutionPage({ institutionId }: EditInstitutionPageProps) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const {
    data: institution,
    isLoading,
    isError,
    refetch,
  } = useInstitution(institutionId);
  const { updateMutation } = useInstitutionMutations();

  if (!canManageInstitutions(currentUser?.role)) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
        <Button asChild variant="outline">
          <Link href="/institutions">Volver</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Cargando institución…</p>
    );
  }

  if (isError || !institution) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">
          No se pudo cargar la institución.
        </p>
        <Button asChild variant="outline">
          <Link href="/institutions">Volver</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (values: InstitutionFormValues) => {
    await updateMutation.mutateAsync({
      id: institutionId,
      payload: formValuesToPayload(values),
    });
    router.push(`/institutions/${institutionId}/settings`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/institutions/${institutionId}/settings`}>Volver</Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          Editar {institution.name}
        </h1>
      </div>

      <InstitutionForm
        title="Datos generales"
        description="Actualiza la información principal de la institución."
        submitLabel="Guardar cambios"
        codeDisabled
        defaultValues={institutionToFormValues(institution)}
        onSubmit={handleSubmit}
        disabled={updateMutation.isPending}
      />

      <InstitutionLogoUpload
        institutionId={institutionId}
        currentLogoUrl={institution.logoUrl}
        disabled={updateMutation.isPending}
        onUploaded={() => {
          void refetch();
        }}
      />
    </div>
  );
}
