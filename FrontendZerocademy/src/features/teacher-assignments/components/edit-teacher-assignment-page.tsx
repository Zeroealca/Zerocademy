"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  TeacherAssignmentForm,
  assignmentToFormValues,
} from "@/features/teacher-assignments/components/teacher-assignment-form";
import { useUpdateTeacherAssignment } from "@/features/teacher-assignments/hooks/use-teacher-assignment-mutations";
import { useTeacherAssignment } from "@/features/teacher-assignments/hooks/use-teacher-assignment";
import type { CreateTeacherAssignmentInput } from "@/features/teacher-assignments/schemas/teacher-assignment.schema";
import {
  canManageAcademicStructure,
  canViewInstitutionOperations,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

interface EditTeacherAssignmentPageProps {
  assignmentId: string;
}

export function EditTeacherAssignmentPage({
  assignmentId: id,
}: EditTeacherAssignmentPageProps) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const { data: assignment, isLoading, isError } = useTeacherAssignment(id);
  const updateAssignment = useUpdateTeacherAssignment();

  if (!canViewInstitutionOperations(currentUser?.role)) {
    return <AccessDenied href="/dashboard" label="Volver al panel" />;
  }

  if (!canManageAcademicStructure(currentUser?.role)) {
    return (
      <AccessDenied
        href="/teacher-assignments"
        label="Volver al listado"
        message="Solo los administradores pueden editar asignaciones."
      />
    );
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Cargando asignación…</p>
    );
  }

  if (isError || !assignment) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">
          No se pudo cargar la asignación.
        </p>
        <Button asChild variant="outline">
          <Link href="/teacher-assignments">Volver al listado</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (values: CreateTeacherAssignmentInput) => {
    await updateAssignment.mutateAsync({ id, payload: {
      courseId: values.courseId,
      subjectId: values.subjectId,
    } });
    router.push("/teacher-assignments");
  };

  const label =
    assignment.subjectName && assignment.courseName
      ? `${assignment.subjectName} — ${assignment.courseName}`
      : assignment.id;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/teacher-assignments">← Volver al listado</Link>
      </Button>
      <TeacherAssignmentForm
        mode="edit"
        assignment={assignment}
        title="Editar asignación docente"
        description={`Actualiza la asignación «${label}».`}
        submitLabel="Guardar cambios"
        defaultValues={assignmentToFormValues(assignment)}
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
