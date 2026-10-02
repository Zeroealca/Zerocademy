"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  useClassSessionAttendance,
  useReplaceClassSessionAttendance,
} from "@/features/academic-execution/hooks/use-class-sessions";
import type { AttendanceStatus } from "@/features/academic-execution/types";
import { useAcademicPlan } from "@/features/planning";

const labels: Record<AttendanceStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  LATE: "Atraso",
  EXCUSED: "Justificado",
};
type Draft = { status: AttendanceStatus | null; note: string };

export function ClassSessionAttendancePage({
  academicPlanId,
  teacherAssignmentId,
  classSessionId,
}: {
  academicPlanId: string;
  teacherAssignmentId: string;
  classSessionId: string;
}) {
  const query = useClassSessionAttendance(teacherAssignmentId, classSessionId);
  const save = useReplaceClassSessionAttendance();
  const [draft, setDraft] = useState<Record<string, Draft>>({});
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (query.data)
      setDraft(
        Object.fromEntries(
          query.data.records.map((row) => [
            row.enrollmentId,
            { status: row.status, note: row.note ?? "" },
          ]),
        ),
      );
  }, [query.data]);
  const rows = query.data?.records ?? [];
  const incomplete = rows.some((row) => !draft[row.enrollmentId]?.status);
  const dirty = useMemo(
    () =>
      rows.some(
        (row) =>
          draft[row.enrollmentId]?.status !== row.status ||
          draft[row.enrollmentId]?.note !== (row.note ?? ""),
      ),
    [draft, rows],
  );
  const readonly = query.data?.isReadOnly ?? true;
  const update = (id: string, change: Partial<Draft>) =>
    setDraft((current) => ({
      ...current,
      [id]: { ...current[id], ...change },
    }));
  const submit = async () => {
    if (incomplete || readonly) {
      setMessage(
        "Selecciona el estado de todos los estudiantes antes de guardar.",
      );
      return;
    }
    try {
      await save.mutateAsync({
        teacherAssignmentId,
        classSessionId,
        payload: {
          records: rows.map((row) => ({
            enrollmentId: row.enrollmentId,
            status: draft[row.enrollmentId]!.status!,
            note: draft[row.enrollmentId]!.note || null,
          })),
        },
      });
      setMessage("Asistencia guardada correctamente.");
    } catch {
      setMessage(
        "No se pudo guardar la asistencia. Tus cambios permanecen en pantalla.",
      );
    }
  };
  if (query.isLoading)
    return (
      <p className="text-sm text-muted-foreground">Cargando asistencia…</p>
    );
  if (query.isError || !query.data)
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-sm text-destructive">
          <p>No se pudo cargar la asistencia.</p>
          <Button onClick={() => query.refetch()} variant="outline">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Button asChild variant="outline">
        <Link href={`/academic-plans/${academicPlanId}/execution`}>
          Volver a ejecución académica
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Asistencia de la sesión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {query.data.classSession.status === "CANCELLED" ? (
            <p className="text-sm text-muted-foreground">
              La sesión está cancelada y la asistencia no puede modificarse.
            </p>
          ) : null}
          {query.data.classSession.status === "SCHEDULED" ? (
            <p className="text-sm text-muted-foreground">
              La asistencia estará disponible cuando la sesión se complete.
            </p>
          ) : null}
          {!rows.length ? (
            <p className="text-sm text-muted-foreground">
              No hay estudiantes disponibles para registrar asistencia en esta
              clase.
            </p>
          ) : null}
          {!readonly && rows.length ? (
            <Button
              onClick={() =>
                setDraft((current) =>
                  Object.fromEntries(
                    rows.map((row) => [
                      row.enrollmentId,
                      { ...current[row.enrollmentId], status: "PRESENT" },
                    ]),
                  ),
                )
              }
              variant="outline"
            >
              Marcar todos como presentes
            </Button>
          ) : null}
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_10rem]"
                key={row.enrollmentId}
              >
                <div>
                  <p className="font-medium">
                    {row.firstName} {row.lastName}
                  </p>
                  <Label
                    htmlFor={`note-${row.enrollmentId}`}
                    className="sr-only"
                  >
                    Nota para {row.firstName} {row.lastName}
                  </Label>
                  <Input
                    disabled={readonly}
                    id={`note-${row.enrollmentId}`}
                    onChange={(event) =>
                      update(row.enrollmentId, { note: event.target.value })
                    }
                    placeholder="Nota opcional"
                    value={draft[row.enrollmentId]?.note ?? ""}
                  />
                </div>
                <Select
                  aria-label={`Estado de asistencia para ${row.firstName} ${row.lastName}`}
                  disabled={readonly}
                  onChange={(event) =>
                    update(row.enrollmentId, {
                      status: event.target.value as AttendanceStatus,
                    })
                  }
                  value={draft[row.enrollmentId]?.status ?? ""}
                >
                  <option value="">Sin registrar</option>
                  {Object.entries(labels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
          {message ? (
            <p className="text-sm" role="status">
              {message}
            </p>
          ) : null}
          {!readonly ? (
            <Button
              disabled={!dirty || incomplete || save.isPending || !rows.length}
              onClick={submit}
            >
              {save.isPending ? "Guardando…" : "Guardar asistencia"}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function ClassSessionAttendanceRoute({
  academicPlanId,
  classSessionId,
}: {
  academicPlanId: string;
  classSessionId: string;
}) {
  const plan = useAcademicPlan(academicPlanId);
  if (plan.isLoading)
    return (
      <p className="text-sm text-muted-foreground">Cargando asistencia…</p>
    );
  if (plan.isError || !plan.data)
    return (
      <p className="text-sm text-destructive">
        No se pudo cargar el contexto de la sesión.
      </p>
    );
  return (
    <ClassSessionAttendancePage
      academicPlanId={academicPlanId}
      classSessionId={classSessionId}
      teacherAssignmentId={plan.data.teacherAssignmentId}
    />
  );
}
