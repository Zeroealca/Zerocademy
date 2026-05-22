"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SubjectForm } from "@/features/subjects/components/subject-form";
import {
  useDeleteSubject,
  useUpdateSubject,
} from "@/features/subjects/hooks/use-subject-mutations";
import { useSubject } from "@/features/subjects/hooks/use-subject";
import type { CreateSubjectInput } from "@/features/subjects/schemas/subject.schema";
import {
  canManagePlatformCatalog,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

interface EditSubjectPageProps {
  subjectId: string;
}

export function EditSubjectPage({ subjectId }: EditSubjectPageProps) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const { data: subject, isLoading, isError } = useSubject(subjectId);
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  if (!canManagePlatformCatalog(currentUser?.role)) {
    return (
      <AccessDenied
        href="/subjects"
        label="Volver al listado"
        message="Solo el super administrador puede editar materias."
      />
    );
  }

  const handleSubmit = async (values: CreateSubjectInput) => {
    await updateSubject.mutateAsync({ id: subjectId, payload: values });
    router.push("/subjects");
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "¿Eliminar esta materia? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    await deleteSubject.mutateAsync(subjectId);
    router.push("/subjects");
  };

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Cargando materia…</p>
    );
  }

  if (isError || !subject) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">
          No se pudo cargar la materia.
        </p>
        <Button asChild variant="outline">
          <Link href="/subjects">Volver al listado</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/subjects">← Volver al listado</Link>
      </Button>
      <SubjectForm
        title="Editar materia"
        description="Actualiza el catálogo y los grados donde aplica la materia."
        submitLabel="Guardar cambios"
        defaultValues={{
          name: subject.name,
          code: subject.code,
          description: subject.description ?? "",
          isSystem: subject.isSystem,
          gradeLevelIds: subject.gradeLevels?.map((grade) => grade.id) ?? [],
        }}
        onSubmit={handleSubmit}
      />
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">Zona de peligro</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Elimina la materia solo si no tiene asignaciones docentes.
        </p>
        <Button
          variant="destructive"
          size="sm"
          className="mt-3"
          onClick={handleDelete}
          disabled={deleteSubject.isPending}
        >
          Eliminar materia
        </Button>
      </div>
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
