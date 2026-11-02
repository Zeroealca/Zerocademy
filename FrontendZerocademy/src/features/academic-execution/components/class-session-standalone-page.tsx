"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassSessionEditForm } from "@/features/academic-execution/components/class-session-edit-form";
import { ClassSessionStatusBadge } from "@/features/academic-execution/components/class-session-status-badge";
import { useClassSession } from "@/features/academic-execution/hooks/use-class-sessions";
import {
  canManageAcademicExecution,
  canViewAcademicExecution,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const weekdayLabels: Record<string, string> = {
  MON: "Lunes",
  TUE: "Martes",
  WED: "Miércoles",
  THU: "Jueves",
  FRI: "Viernes",
};

export function ClassSessionStandalonePage({
  teacherAssignmentId,
  classSessionId,
}: {
  teacherAssignmentId: string;
  classSessionId: string;
}) {
  const role = useAuthStore((state) => state.user?.role);
  const session = useClassSession(teacherAssignmentId, classSessionId);
  const [editing, setEditing] = useState(false);

  if (!canViewAcademicExecution(role))
    return (
      <State
        title="Acceso denegado"
        body="No tienes permiso para consultar esta sesión de clase."
      />
    );
  if (session.isLoading)
    return (
      <State
        title="Cargando sesión…"
        body="Estamos consultando la ocurrencia de clase."
      />
    );
  if (session.isError || !session.data)
    return (
      <State
        title="Sesión no disponible"
        body="La sesión no existe o no tienes acceso a ella."
      />
    );

  const item = session.data;
  const canManage = canManageAcademicExecution(role);
  const historicalTime =
    item.originBlockStartTime && item.originBlockEndTime
      ? `${item.originBlockStartTime} – ${item.originBlockEndTime}`
      : "Sin bloque de horario de origen";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sesión de clase
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ocurrencia académica independiente de un plan de clase.
          </p>
        </div>
        <ClassSessionStatusBadge status={item.status} />
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contexto programado</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <Field
            label="Fecha programada"
            value={item.scheduledDate ?? "Sin fecha programada"}
          />
          <Field
            label="Fecha realizada"
            value={item.occurredOn ?? "Sin fecha registrada"}
          />
          <Field label="Horario original" value={historicalTime} />
          <Field
            label="Curso original"
            value={item.originCourseName ?? "Sesión manual o excepcional"}
          />
          <Field
            label="Materia original"
            value={item.originSubjectName ?? "Sesión manual o excepcional"}
          />
          <Field
            label="Institución original"
            value={item.originInstitutionName ?? "Sesión manual o excepcional"}
          />
          <Field
            label="Período original"
            value={
              item.originAcademicPeriodName ?? "Sesión manual o excepcional"
            }
          />
          <Field
            label="Día original"
            value={
              item.originWeekday
                ? weekdayLabels[item.originWeekday]
                : "Sesión manual o excepcional"
            }
          />
          <Field
            label="Origen"
            value={
              item.timetableOccurrenceKey
                ? "Horario publicado"
                : "Sesión manual o excepcional"
            }
          />
          <Field
            label="Estado"
            value={
              item.status === "CANCELLED"
                ? "Cancelada; no se crea un reemplazo automáticamente."
                : item.status === "COMPLETED"
                  ? "Completada"
                  : "Programada"
            }
          />
        </CardContent>
      </Card>
      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gestionar sesión</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <ClassSessionEditForm
                onCancel={() => setEditing(false)}
                onSuccess={() => setEditing(false)}
                session={item}
              />
            ) : (
              <Button onClick={() => setEditing(true)} variant="outline">
                Editar sesión
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}
      <Button asChild variant="outline">
        <Link href="/timetables">Volver a mi horario</Link>
      </Button>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function State({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{body}</p>
      <Button asChild variant="outline">
        <Link href="/timetables">Volver a mi horario</Link>
      </Button>
    </div>
  );
}
