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
import { canViewGrades } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function GradesPage() {
  const currentUser = useAuthStore((state) => state.user);

  if (!canViewGrades(currentUser?.role)) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Notas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulta tus calificaciones del período académico seleccionado.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Próximamente</CardTitle>
          <CardDescription>
            El módulo de notas estará disponible en una próxima versión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Mientras tanto, puedes revisar tu historial de matrículas desde el
            menú lateral.
          </p>
        </CardContent>
      </Card>
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
