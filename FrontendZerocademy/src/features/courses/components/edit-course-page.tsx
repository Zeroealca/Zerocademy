"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CourseForm,
  courseToFormValues,
} from "@/features/courses/components/course-form";
import { useCourse } from "@/features/courses/hooks/use-course";
import { useUpdateCourse } from "@/features/courses/hooks/use-course-mutations";
import type { CreateCourseInput } from "@/features/courses/schemas/course.schema";
import {
  canManageAcademicStructure,
  canViewInstitutionOperations,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

interface EditCoursePageProps {
  courseId: string;
}

export function EditCoursePage({ courseId }: EditCoursePageProps) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const { data: course, isLoading, isError } = useCourse(courseId);
  const updateCourse = useUpdateCourse(courseId);

  if (!canViewInstitutionOperations(currentUser?.role)) {
    return <AccessDenied href="/dashboard" label="Volver al panel" />;
  }

  if (!canManageAcademicStructure(currentUser?.role)) {
    return <AccessDenied href="/courses" label="Volver al listado" />;
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando curso…</p>;
  }

  if (isError || !course) {
    return (
      <p className="text-sm text-destructive">No se pudo cargar el curso.</p>
    );
  }

  const handleSubmit = async (values: CreateCourseInput) => {
    await updateCourse.mutateAsync(values);
    router.push("/courses");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/courses">← Volver al listado</Link>
      </Button>
      <CourseForm
        title="Editar curso / paralelo"
        description={`Actualiza la configuración de ${course.name}.`}
        submitLabel="Guardar cambios"
        defaultValues={courseToFormValues(course)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function AccessDenied({ href, label }: { href: string; label: string }) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
      <Button asChild variant="outline">
        <Link href={href}>{label}</Link>
      </Button>
    </div>
  );
}
