"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  InstitutionForm,
  formValuesToPayload,
} from "@/features/institutions/components/institution-form";
import { useInstitutionMutations } from "@/features/institutions/hooks/use-institution-mutations";
import type { InstitutionFormValues } from "@/features/institutions/schemas/institution.schema";
import { canManageInstitutions } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function CreateInstitutionPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const { createMutation } = useInstitutionMutations();

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

  const handleSubmit = async (values: InstitutionFormValues) => {
    const institution = await createMutation.mutateAsync(
      formValuesToPayload(values),
    );
    router.push(`/institutions/${institution.id}/settings`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/institutions">Volver</Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          Nueva institución
        </h1>
      </div>

      <InstitutionForm
        title="Datos de la institución"
        description="Registra una institución educativa con su configuración inicial."
        submitLabel="Crear institución"
        onSubmit={handleSubmit}
        disabled={createMutation.isPending}
      />
    </div>
  );
}
