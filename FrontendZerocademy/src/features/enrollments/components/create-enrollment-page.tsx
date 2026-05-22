"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EnrollmentForm } from "@/features/enrollments/components/enrollment-form";
import { useEnrollmentMutations } from "@/features/enrollments/hooks/use-enrollment-mutations";
import type { CreateEnrollmentInput } from "@/features/enrollments/schemas/enrollment.schema";
import {
  canManageEnrollments,
  canViewEnrollments,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function CreateEnrollmentPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const { createMutation } = useEnrollmentMutations();

  if (!canViewEnrollments(currentUser?.role)) {
    return <AccessDenied href="/dashboard" label="Volver al panel" />;
  }

  if (!canManageEnrollments(currentUser?.role)) {
    return (
      <AccessDenied
        href="/enrollments"
        label="Volver al listado"
        message="Solo los administradores pueden crear matrículas."
      />
    );
  }

  const handleSubmit = async (values: CreateEnrollmentInput) => {
    await createMutation.mutateAsync(values);
    router.push("/enrollments");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/enrollments">← Volver al listado</Link>
      </Button>
      <EnrollmentForm
        mode="create"
        title="Nueva matrícula"
        description="Vincula un estudiante a un curso en un período académico."
        submitLabel="Crear matrícula"
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
