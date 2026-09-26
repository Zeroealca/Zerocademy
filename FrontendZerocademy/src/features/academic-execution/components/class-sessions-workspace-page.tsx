"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClassSessionStatusBadge } from "@/features/academic-execution/components/class-session-status-badge";
import { ClassSessionForm } from "@/features/academic-execution/components/class-session-form";
import { useClassSessions } from "@/features/academic-execution/hooks/use-class-sessions";
import { useAcademicPlan, type AcademicPlan } from "@/features/planning";
import { canManageAcademicExecution, canViewAcademicExecution } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatDateOnly(date: string | null, placeholder: string) {
  if (!date) return placeholder;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return date;

  const [, year, month, day] = match;
  const monthName = MONTHS[Number(month) - 1];
  return monthName ? `${Number(day)} de ${monthName} de ${year}` : date;
}

export function ClassSessionsWorkspacePage({ academicPlanId }: { academicPlanId: string }) {
  const role = useAuthStore((state) => state.user?.role);

  if (!canViewAcademicExecution(role)) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
        <p className="text-sm text-muted-foreground">
          No tienes permiso para consultar la ejecución académica.
        </p>
        <Button asChild variant="outline"><Link href="/dashboard">Volver al panel</Link></Button>
      </div>
    );
  }

  return <ClassSessionsWorkspaceContent academicPlanId={academicPlanId} />;
}

function ClassSessionsWorkspaceContent({ academicPlanId }: { academicPlanId: string }) {
  const planQuery = useAcademicPlan(academicPlanId);

  if (planQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando contexto de ejecución…</p>;
  }

  if (planQuery.isError || !planQuery.data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">No se pudo cargar el contexto de la asignación docente.</p>
        <Button asChild variant="outline">
          <Link href="/academic-plans">Volver a planificación académica</Link>
        </Button>
      </div>
    );
  }

  return <ClassSessionsList academicPlanId={academicPlanId} plan={planQuery.data} />;
}

function ClassSessionsList({ academicPlanId, plan }: { academicPlanId: string; plan: AcademicPlan }) {
  const sessionsQuery = useClassSessions(plan.teacherAssignmentId);
  const role = useAuthStore((state) => state.user?.role);
  const [creating, setCreating] = useState(false);
  const canCreate = canManageAcademicExecution(role);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ejecución académica</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sesiones de {plan.subjectName} · {plan.courseName} {plan.courseSection}
          </p>
          <p className="text-sm text-muted-foreground">{plan.academicPeriodName}</p>
        </div>
        <Button asChild variant="outline"><Link href={`/academic-plans/${academicPlanId}`}>Volver al plan</Link></Button>
      </header>

      <section aria-labelledby="class-sessions-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
          <h2 className="text-xl font-semibold" id="class-sessions-heading">Sesiones de clase</h2>
          <p className="text-sm text-muted-foreground">
            Registro de las ocurrencias de enseñanza de esta asignación.
          </p>
          </div>
          {canCreate && !creating ? <Button onClick={() => setCreating(true)}>Crear sesión</Button> : null}
        </div>
        {creating ? <Card><CardHeader><CardTitle className="text-base">Nueva sesión de clase</CardTitle></CardHeader><CardContent><ClassSessionForm academicPlanId={academicPlanId} onCancel={() => setCreating(false)} onSuccess={() => setCreating(false)} teacherAssignmentId={plan.teacherAssignmentId}/></CardContent></Card> : null}

        {sessionsQuery.isLoading ? <Card><CardContent className="p-6 text-sm text-muted-foreground" aria-live="polite">Cargando sesiones de clase…</CardContent></Card> : null}
        {sessionsQuery.isError ? <Card><CardContent className="space-y-3 p-6 text-sm text-destructive" role="alert"><p>No se pudieron cargar las sesiones de clase.</p><Button onClick={() => sessionsQuery.refetch()} size="sm" variant="outline">Reintentar</Button></CardContent></Card> : null}
        {!sessionsQuery.isLoading && !sessionsQuery.isError && !sessionsQuery.data?.length ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Aún no se han registrado ni programado sesiones de clase para esta asignación.</CardContent></Card> : null}
        {!sessionsQuery.isLoading && !sessionsQuery.isError && sessionsQuery.data?.length ? <div className="grid gap-3 md:grid-cols-2">
          {sessionsQuery.data.map((session) => <Card key={session.id}>
            <CardHeader className="gap-3 p-5 pb-3 sm:flex-row sm:items-start sm:justify-between">
              <div><CardTitle className="text-base">Sesión de clase</CardTitle><CardDescription className="mt-1">{formatDateOnly(session.scheduledDate, "Sin fecha programada")}</CardDescription></div>
              <ClassSessionStatusBadge status={session.status} />
            </CardHeader>
            <CardContent className="grid gap-3 p-5 pt-0 text-sm sm:grid-cols-2">
              <DateField label="Fecha programada" value={formatDateOnly(session.scheduledDate, "Sin fecha programada")} />
              <DateField label="Fecha realizada" value={formatDateOnly(session.occurredOn, "Sin fecha registrada")} />
              <DateField label="Plan de clase" value={session.lessonPlanId ? "Plan de clase asociado" : "Sin planificación asociada"} className="sm:col-span-2" />
            </CardContent>
          </Card>)}
        </div> : null}
      </section>
    </div>
  );
}

function DateField({ className, label, value }: { className?: string; label: string; value: string }) {
  return <div className={className}><p className="text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>;
}
