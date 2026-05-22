"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StudentForm } from "@/features/students/components/student-form";
import { useStudentMutations } from "@/features/students/hooks/use-student-mutations";
import type { CreateStudentInput } from "@/features/students/schemas/student.schema";
import { canManageStudents, canViewStudents } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function CreateStudentPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const { createMutation } = useStudentMutations();

  if (!canViewStudents(currentUser?.role)) {
    return <AccessDenied href="/dashboard" label="Volver al panel" />;
  }

  if (!canManageStudents(currentUser?.role)) {
    return (
      <AccessDenied
        href="/students"
        label="Volver al listado"
        message="Solo los administradores pueden crear estudiantes."
      />
    );
  }

  const handleSubmit = async (values: CreateStudentInput) => {
    await createMutation.mutateAsync(values);
    router.push("/students");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/students">← Volver al listado</Link>
      </Button>
      <StudentForm
        mode="create"
        title="Nuevo estudiante"
        description="Crea la cuenta de usuario y el perfil académico permanente."
        submitLabel="Crear estudiante"
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
