"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CourseForm } from "@/features/courses/components/course-form";
import { useCreateCourse } from "@/features/courses/hooks/use-course-mutations";
import type { CreateCourseInput } from "@/features/courses/schemas/course.schema";
import {
  canManageAcademicStructure,
  canViewInstitutionOperations,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function CreateCoursePage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const createCourse = useCreateCourse();

  if (!canViewInstitutionOperations(currentUser?.role)) {
    return <AccessDenied href="/dashboard" label="Volver al panel" />;
  }

  if (!canManageAcademicStructure(currentUser?.role)) {
    return (
      <AccessDenied
        href="/courses"
        label="Volver al listado"
        message="Solo los administradores pueden crear cursos."
      />
    );
  }

  const handleSubmit = async (values: CreateCourseInput) => {
    await createCourse.mutateAsync(values);
    router.push("/courses");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/courses">← Volver al listado</Link>
      </Button>
      <CourseForm
        title="Nuevo curso / paralelo"
        description="Asigna un aula o paralelo a un grado y período académico."
        submitLabel="Crear curso"
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
