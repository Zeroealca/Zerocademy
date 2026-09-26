"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useCreateClassSession } from "@/features/academic-execution/hooks/use-class-sessions";
import type { ClassSessionStatus, CreateClassSessionInput } from "@/features/academic-execution/types";
import { ApiError } from "@/lib/api-error";

export function ClassSessionForm({ onCancel, onSuccess, teacherAssignmentId }: { onCancel: () => void; onSuccess: () => void; teacherAssignmentId: string }) {
  const create = useCreateClassSession();
  const [status, setStatus] = useState<ClassSessionStatus>("SCHEDULED");
  const [scheduledDate, setScheduledDate] = useState("");
  const [occurredOn, setOccurredOn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const requiresScheduledDate = status === "SCHEDULED" || status === "CANCELLED";
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (requiresScheduledDate && !scheduledDate) return setError("Indica la fecha programada.");
    if (status === "COMPLETED" && !occurredOn) return setError("Indica la fecha realizada.");
    const payload: CreateClassSessionInput = { status, scheduledDate: scheduledDate || undefined, occurredOn: occurredOn || undefined };
    setError(null);
    try {
      await create.mutateAsync({ teacherAssignmentId, payload });
      onSuccess();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo crear la sesión de clase.");
    }
  };
  return <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
    <div className="space-y-2"><Label htmlFor="class-session-status">Estado</Label><Select id="class-session-status" onChange={(event) => setStatus(event.target.value as ClassSessionStatus)} value={status}><option value="SCHEDULED">Programada</option><option value="COMPLETED">Completada</option><option value="CANCELLED">Cancelada</option></Select></div>
    <div className="space-y-2"><Label htmlFor="class-session-scheduled">Fecha programada{requiresScheduledDate ? " *" : ""}</Label><Input id="class-session-scheduled" onChange={(event) => setScheduledDate(event.target.value)} required={requiresScheduledDate} type="date" value={scheduledDate}/></div>
    <div className="space-y-2"><Label htmlFor="class-session-occurred">Fecha realizada{status === "COMPLETED" ? " *" : ""}</Label><Input id="class-session-occurred" onChange={(event) => setOccurredOn(event.target.value)} required={status === "COMPLETED"} type="date" value={occurredOn}/></div>
    <p className="self-end text-sm text-muted-foreground">La planificación de clase puede asociarse en una actualización posterior.</p>
    {error ? <p className="text-sm text-destructive sm:col-span-2" role="alert">{error}</p> : null}
    <div className="flex gap-2 sm:col-span-2"><Button disabled={create.isPending} type="submit">{create.isPending ? "Creando…" : "Crear sesión"}</Button><Button onClick={onCancel} type="button" variant="outline">Cancelar</Button></div>
  </form>;
}
