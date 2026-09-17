"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SubjectForm } from "@/features/subjects/components/subject-form";
import { useCreateSubject } from "@/features/subjects/hooks/use-subject-mutations";
import type { CreateSubjectInput } from "@/features/subjects/schemas/subject.schema";
import {
  canCreateSubjects,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function CreateSubjectPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const createSubject = useCreateSubject();

  if (!canCreateSubjects(currentUser?.role)) {
    return (
      <AccessDenied
        href="/subjects"
        label="Volver al listado"
        message="Solo administradores pueden crear materias."
      />
    );
  }

  const handleSubmit = async (values: CreateSubjectInput) => {
    await createSubject.mutateAsync(values);
    router.push("/subjects");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/subjects">← Volver al listado</Link>
      </Button>
      <SubjectForm
        title="Nueva materia"
        description="Registra una materia reutilizable y vincúlala a los grados donde aplica."
        submitLabel="Crear materia"
        allowSystemSubject={currentUser?.role === "SUPER_ADMIN"}
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
