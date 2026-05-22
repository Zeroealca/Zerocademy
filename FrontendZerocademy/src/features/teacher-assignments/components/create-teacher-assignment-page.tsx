"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TeacherAssignmentForm } from "@/features/teacher-assignments/components/teacher-assignment-form";
import { useCreateTeacherAssignment } from "@/features/teacher-assignments/hooks/use-teacher-assignment-mutations";
import type { CreateTeacherAssignmentInput } from "@/features/teacher-assignments/schemas/teacher-assignment.schema";
import {
  canManageAcademicStructure,
  canViewInstitutionOperations,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function CreateTeacherAssignmentPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const createAssignment = useCreateTeacherAssignment();

  if (!canViewInstitutionOperations(currentUser?.role)) {
    return <AccessDenied href="/dashboard" label="Volver al panel" />;
  }

  if (!canManageAcademicStructure(currentUser?.role)) {
    return (
      <AccessDenied
        href="/teacher-assignments"
        label="Volver al listado"
        message="Solo los administradores pueden crear asignaciones."
      />
    );
  }

  const handleSubmit = async (values: CreateTeacherAssignmentInput) => {
    await createAssignment.mutateAsync(values);
    router.push("/teacher-assignments");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/teacher-assignments">← Volver al listado</Link>
      </Button>
      <TeacherAssignmentForm
        title="Nueva asignación docente"
        description="Vincula un docente con una materia, curso y período académico."
        submitLabel="Crear asignación"
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
