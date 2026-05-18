"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AcademicPeriodForm,
  academicPeriodToFormValues,
} from "@/features/academic-periods/components/academic-period-form";
import { useAcademicPeriod } from "@/features/academic-periods/hooks/use-academic-period";
import { useUpdateAcademicPeriod } from "@/features/academic-periods/hooks/use-academic-period-mutations";
import type { CreateAcademicPeriodInput } from "@/features/academic-periods/schemas/academic-period.schema";
import {
  canManageAcademicPeriods,
  canViewAcademicPeriods,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

interface EditAcademicPeriodPageProps {
  periodId: string;
}

export function EditAcademicPeriodPage({ periodId }: EditAcademicPeriodPageProps) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const { data: period, isLoading, isError } = useAcademicPeriod(periodId);
  const updatePeriod = useUpdateAcademicPeriod(periodId);

  if (!canViewAcademicPeriods(currentUser?.role)) {
    return (
      <AccessDeniedBlock href="/dashboard" label="Volver al panel" />
    );
  }

  if (!canManageAcademicPeriods(currentUser?.role)) {
    return (
      <AccessDeniedBlock href="/academic-periods" label="Volver a períodos" />
    );
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Cargando período académico…</p>
    );
  }

  if (isError || !period) {
    return (
      <p className="text-sm text-destructive">
        No se pudo cargar el período académico.
      </p>
    );
  }

  if (period.status === "ACTIVE") {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <p className="text-sm text-muted-foreground">
          Desactiva este período antes de editar los campos del calendario.
        </p>
        <Button asChild variant="outline">
          <Link href={`/academic-periods/${period.id}`}>Volver al detalle</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (values: CreateAcademicPeriodInput) => {
    await updatePeriod.mutateAsync(values);
    router.push(`/academic-periods/${period.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/academic-periods/${period.id}`}>← Volver al detalle</Link>
      </Button>
      <AcademicPeriodForm
        title="Editar período académico"
        description={`Actualiza la configuración del calendario de ${period.name}.`}
        submitLabel="Guardar cambios"
        defaultValues={academicPeriodToFormValues(period)}
        onSubmit={handleSubmit}
        disabled={period.status === "ARCHIVED"}
      />
    </div>
  );
}

function AccessDeniedBlock({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
      <Button asChild variant="outline">
        <Link href={href}>{label}</Link>
      </Button>
    </div>
  );
}
