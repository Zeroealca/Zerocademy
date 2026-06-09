"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  canViewAcademicPerformanceAdmin,
  canViewAcademicPerformanceStudent,
  canViewAcademicPerformanceTeacher,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function AcademicPerformancePage() {
  const role = useAuthStore((state) => state.user?.role);

  const canStudent = canViewAcademicPerformanceStudent(role);
  const canTeacher = canViewAcademicPerformanceTeacher(role);
  const canAdmin = canViewAcademicPerformanceAdmin(role);

  if (!canStudent && !canTeacher && !canAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Rendimiento académico
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Promedios calculados según la configuración de evaluación de la
          institución.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {canStudent ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mis promedios</CardTitle>
              <CardDescription>
                Consulta tus promedios por materia, trimestre y resumen general.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/academic-performance/my-averages">
                  Ver mis promedios
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {canTeacher ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Promedios del curso</CardTitle>
                <CardDescription>
                  Promedio por materia del paralelo que impartes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/academic-performance/course-averages">
                    Ver curso
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rendimiento por materia</CardTitle>
                <CardDescription>
                  Detalle de estudiantes en una materia específica.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="/academic-performance/subject-performance">
                    Ver materia
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rendimiento estudiantil</CardTitle>
                <CardDescription>
                  Promedios individuales de un estudiante en el curso.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="/academic-performance/student-performance">
                    Consultar estudiante
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </>
        ) : null}

        {canAdmin ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Institución</CardTitle>
                <CardDescription>
                  Vista agregada del rendimiento por curso en la institución.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/academic-performance/institution">
                    Ver institución
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Curso (administración)</CardTitle>
                <CardDescription>
                  Promedios detallados de un paralelo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="/academic-performance/course-performance">
                    Ver curso
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
      <Button asChild variant="outline">
        <Link href="/dashboard">Volver al panel</Link>
      </Button>
    </div>
  );
}
