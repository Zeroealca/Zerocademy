"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useUpdateClassSession } from "@/features/academic-execution/hooks/use-class-sessions";
import type {
  ClassSession,
  ClassSessionStatus,
  UpdateClassSessionInput,
} from "@/features/academic-execution/types";
import { useAcademicPlanLessonPlans } from "@/features/planning";
import { ApiError } from "@/lib/api-error";

type Props = {
  academicPlanId: string;
  onCancel: () => void;
  onSuccess: () => void;
  session: ClassSession;
};

const dateValue = (value: string | null) => value ?? "";

export function ClassSessionEditForm({
  academicPlanId,
  onCancel,
  onSuccess,
  session,
}: Props) {
  const update = useUpdateClassSession();
  const lessonPlansQuery = useAcademicPlanLessonPlans(academicPlanId);
  const [status, setStatus] = useState<ClassSessionStatus>(session.status);
  const [scheduledDate, setScheduledDate] = useState(dateValue(session.scheduledDate));
  const [occurredOn, setOccurredOn] = useState(dateValue(session.occurredOn));
  const [lessonPlanId, setLessonPlanId] = useState(session.lessonPlanId ?? "");
  const [error, setError] = useState<string | null>(null);
  const requiresScheduledDate = status === "SCHEDULED" || status === "CANCELLED";
  const scheduledChanged = scheduledDate !== dateValue(session.scheduledDate);
  const occurredChanged = occurredOn !== dateValue(session.occurredOn);
  const lessonPlanChanged = lessonPlanId !== (session.lessonPlanId ?? "");
  const hasChanges = status !== session.status || scheduledChanged || occurredChanged || lessonPlanChanged;
  const currentLessonPlanUnavailable = Boolean(
    session.lessonPlanId
      && !lessonPlansQuery.isLoading
      && !lessonPlansQuery.isError
      && !lessonPlansQuery.data?.some((lessonPlan) => lessonPlan.id === session.lessonPlanId),
  );
  const lessonPlanSelectionDisabled = lessonPlansQuery.isLoading
    || (lessonPlansQuery.isError && Boolean(session.lessonPlanId));
  const updateDate = (
    nextValue: string,
    originalValue: string | null,
    setValue: (value: string) => void,
    label: string,
  ) => {
    if (!nextValue && originalValue) {
      setError(`La API no permite eliminar la ${label}; restaura una fecha válida.`);
      return;
    }
    setValue(nextValue);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const finalScheduledDate = scheduledDate || session.scheduledDate;
    const finalOccurredOn = occurredOn || session.occurredOn;

    if (requiresScheduledDate && !finalScheduledDate) {
      setError("Indica la fecha programada.");
      return;
    }
    if (status === "COMPLETED" && !finalOccurredOn) {
      setError("Indica la fecha realizada.");
      return;
    }
    if (!hasChanges) return;

    const payload: UpdateClassSessionInput = {
      ...(status !== session.status ? { status } : {}),
      ...(scheduledChanged ? { scheduledDate } : {}),
      ...(occurredChanged ? { occurredOn } : {}),
      ...(lessonPlanChanged ? { lessonPlanId: lessonPlanId || null } : {}),
    };

    setError(null);
    try {
      await update.mutateAsync({
        teacherAssignmentId: session.teacherAssignmentId,
        classSessionId: session.id,
        payload,
      });
      onSuccess();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo actualizar la sesión de clase.");
    }
  };

  const fieldId = (name: string) => `class-session-${session.id}-${name}`;

  return <form className="grid gap-4 border-t pt-4 sm:grid-cols-2" onSubmit={submit}>
    <div className="space-y-2"><Label htmlFor={fieldId("status")}>Estado</Label><Select id={fieldId("status")} onChange={(event) => setStatus(event.target.value as ClassSessionStatus)} value={status}><option value="SCHEDULED">Programada</option><option value="COMPLETED">Completada</option><option value="CANCELLED">Cancelada</option></Select></div>
    <div className="space-y-2"><Label htmlFor={fieldId("scheduled")}>Fecha programada{requiresScheduledDate ? " *" : ""}</Label><Input id={fieldId("scheduled")} onChange={(event) => updateDate(event.target.value, session.scheduledDate, setScheduledDate, "fecha programada")} required={requiresScheduledDate} type="date" value={scheduledDate}/></div>
    <div className="space-y-2"><Label htmlFor={fieldId("occurred")}>Fecha realizada{status === "COMPLETED" ? " *" : ""}</Label><Input id={fieldId("occurred")} onChange={(event) => updateDate(event.target.value, session.occurredOn, setOccurredOn, "fecha realizada")} required={status === "COMPLETED"} type="date" value={occurredOn}/></div>
    <div className="space-y-2 sm:col-span-2"><Label htmlFor={fieldId("lesson-plan")}>Lección asociada</Label><Select disabled={lessonPlanSelectionDisabled} id={fieldId("lesson-plan")} onChange={(event) => setLessonPlanId(event.target.value)} value={lessonPlanId}><option value="">{lessonPlansQuery.isLoading ? "Cargando lecciones…" : "Sin lección asociada"}</option>{currentLessonPlanUnavailable ? <option value={session.lessonPlanId ?? ""}>Lección asociada actual no disponible</option> : null}{lessonPlansQuery.data?.map((lessonPlan) => <option key={lessonPlan.id} value={lessonPlan.id}>{lessonPlan.academicUnitTitle} — {lessonPlan.title}</option>)}</Select>{lessonPlansQuery.isError ? <p className="text-sm text-destructive" role="alert">No se pudieron cargar las lecciones disponibles. La asociación actual se conservará.</p> : null}{!lessonPlansQuery.isLoading && !lessonPlansQuery.isError && !lessonPlansQuery.data?.length ? <p className="text-sm text-muted-foreground">Este plan no tiene lecciones disponibles.</p> : null}</div>
    {error ? <p className="text-sm text-destructive sm:col-span-2" role="alert">{error}</p> : null}
    <div className="flex gap-2 sm:col-span-2"><Button disabled={!hasChanges || update.isPending} type="submit">{update.isPending ? "Guardando…" : "Guardar cambios"}</Button><Button disabled={update.isPending} onClick={onCancel} type="button" variant="outline">Cancelar</Button></div>
  </form>;
}
