"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AcademicPeriodForm } from "@/features/academic-periods/components/academic-period-form";
import { useCreateAcademicPeriod } from "@/features/academic-periods/hooks/use-academic-period-mutations";
import type { CreateAcademicPeriodInput } from "@/features/academic-periods/schemas/academic-period.schema";
import {
  canManageAcademicPeriods,
  canViewAcademicPeriods,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function CreateAcademicPeriodPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const createPeriod = useCreateAcademicPeriod();

  if (!canViewAcademicPeriods(currentUser?.role)) {
    return (
      <AccessDeniedBlock href="/dashboard" label="Volver al panel" />
    );
  }

  if (!canManageAcademicPeriods(currentUser?.role)) {
    return (
      <AccessDeniedBlock
        href="/academic-periods"
        label="Volver a períodos"
        message="Solo los administradores pueden crear períodos académicos."
      />
    );
  }

  const handleSubmit = async (values: CreateAcademicPeriodInput) => {
    const period = await createPeriod.mutateAsync(values);
    router.push(`/academic-periods/${period.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/academic-periods">← Volver al listado</Link>
      </Button>
      <AcademicPeriodForm
        title="Nuevo período académico"
        description="Define un año lectivo para los regímenes Costa/Galápagos o Sierra/Amazonía."
        submitLabel="Crear período"
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function AccessDeniedBlock({
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
