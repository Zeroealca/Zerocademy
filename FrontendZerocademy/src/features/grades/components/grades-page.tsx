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
import { StudentGradesPage } from "@/features/grades/components/student-grades-page";
import {
  canManageAssessments,
  canManageGrades,
  canViewAssessments,
  canViewGradeEntry,
  canViewGradesMonitoring,
  canViewOwnGrades,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function GradesPage() {
  const currentUser = useAuthStore((state) => state.user);
  const role = currentUser?.role;

  if (canViewOwnGrades(role) && role === "STUDENT") {
    return <StudentGradesPage />;
  }

  if (
    !canViewAssessments(role) &&
    !canViewGradeEntry(role) &&
    !canViewGradesMonitoring(role)
  ) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Notas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestión de evaluaciones y registro de calificaciones.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {canViewAssessments(role) ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evaluaciones</CardTitle>
              <CardDescription>
                Crea y administra instrumentos de evaluación por materia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/grades/assessments">Ver evaluaciones</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {canViewGradeEntry(role) ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Registro de notas</CardTitle>
              <CardDescription>
                Ingresa calificaciones por curso, materia y evaluación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant={canManageGrades(role) ? "default" : "outline"}>
                <Link href="/grades/entry">
                  {canManageGrades(role) ? "Registrar notas" : "Consultar hoja"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {canViewGradesMonitoring(role) ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monitoreo</CardTitle>
              <CardDescription>
                Supervisa evaluaciones y calificaciones de la institución.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Usa el listado de evaluaciones y la hoja de notas en modo lectura.
            </CardContent>
          </Card>
        ) : null}

        {(canViewGradesMonitoring(role) || role === "STUDENT") ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rendimiento académico</CardTitle>
              <CardDescription>
                Promedios por materia, trimestre y resumen de rendimiento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/academic-performance">Ver promedios</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {canManageAssessments(role) ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nueva evaluación</CardTitle>
              <CardDescription>
                Acceso rápido para crear un instrumento de evaluación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/grades/assessments/new">Crear evaluación</Link>
              </Button>
            </CardContent>
          </Card>
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
