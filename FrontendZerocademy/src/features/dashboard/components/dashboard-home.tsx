"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROLE_LABELS } from "@/features/users/constants";
import { useAuthStore } from "@/stores/use-auth-store";
import type { UserRole } from "@/stores/use-auth-store";

export function DashboardHome() {
  const user = useAuthStore((state) => state.user);

  const roleLabel =
    user?.role && user.role in ROLE_LABELS
      ? ROLE_LABELS[user.role as UserRole]
      : user?.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Panel principal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Base de gestión académica — los módulos aparecerán aquí a medida que
          se implementen.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sesión activa</CardTitle>
            <CardDescription>Usuario conectado</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{user?.email}</p>
            <p className="mt-1 text-sm text-muted-foreground">{roleLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado de la plataforma</CardTitle>
            <CardDescription>Versión fundacional</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Autenticación, usuarios y control de acceso por roles están
              activos. Los dominios académicos (estudiantes, notas, asistencia)
              aún no están implementados.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
