"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EnrollmentForm } from "@/features/enrollments/components/enrollment-form";
import { useEnrollment } from "@/features/enrollments/hooks/use-enrollment";
import { useEnrollmentMutations } from "@/features/enrollments/hooks/use-enrollment-mutations";
import type { UpdateEnrollmentInput } from "@/features/enrollments/schemas/enrollment.schema";
import {
  canManageEnrollments,
  canViewEnrollments,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

interface EditEnrollmentPageProps {
  enrollmentId: string;
}

export function EditEnrollmentPage({ enrollmentId }: EditEnrollmentPageProps) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const { data: enrollment, isLoading } = useEnrollment(enrollmentId);
  const { updateMutation } = useEnrollmentMutations();

  if (!canViewEnrollments(currentUser?.role)) {
    return <AccessDenied href="/dashboard" label="Volver al panel" />;
  }

  if (!canManageEnrollments(currentUser?.role)) {
    return (
      <AccessDenied
        href="/enrollments"
        label="Volver al listado"
        message="Solo los administradores pueden editar matrículas."
      />
    );
  }

  const handleSubmit = async (values: UpdateEnrollmentInput) => {
    await updateMutation.mutateAsync({ id: enrollmentId, payload: values });
    router.push("/enrollments");
  };

  if (isLoading || !enrollment) {
    return <p className="text-sm text-muted-foreground">Cargando matrícula…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/enrollments">← Volver al listado</Link>
      </Button>
      <EnrollmentForm
        mode="edit"
        title="Editar matrícula"
        description={`${enrollment.student.firstName} ${enrollment.student.lastName} — ${enrollment.course.name}`}
        submitLabel="Guardar cambios"
        defaultValues={enrollment}
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
