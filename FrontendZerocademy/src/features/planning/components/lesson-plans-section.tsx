"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LessonPlanForm } from "@/features/planning/components/lesson-plan-form";
import { useCreateLessonPlan, useDeleteLessonPlan, useLessonPlans, useReorderLessonPlans, useUpdateLessonPlan } from "@/features/planning/hooks/use-lesson-plans";
import type { AcademicUnit, LessonPlan, LessonPlanInput } from "@/features/planning/types";
import { ApiError } from "@/lib/api-error";

interface LessonPlansSectionProps { academicPlanId: string; academicUnit: AcademicUnit; canManage: boolean; }

export function LessonPlansSection({ academicPlanId, academicUnit, canManage }: LessonPlansSectionProps) {
  const lessonsQuery = useLessonPlans(academicPlanId, academicUnit.id);
  const createLesson = useCreateLessonPlan();
  const updateLesson = useUpdateLessonPlan();
  const deleteLesson = useDeleteLessonPlan();
  const reorderLessons = useReorderLessonPlans();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<LessonPlan | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const lessons = [...(lessonsQuery.data ?? [])].sort((left, right) => left.position - right.position);
  const closeForm = () => { setCreating(false); setEditing(null); };
  const save = async (values: LessonPlanInput) => {
    setActionError(null);
    if (editing) await updateLesson.mutateAsync({ academicPlanId, academicUnitId: academicUnit.id, lessonPlanId: editing.id, payload: values });
    else await createLesson.mutateAsync({ academicPlanId, academicUnitId: academicUnit.id, payload: values });
    closeForm();
  };
  const remove = async (lesson: LessonPlan) => {
    if (!window.confirm(`¿Eliminar la clase «${lesson.title}»?`)) return;
    setActionError(null);
    try { await deleteLesson.mutateAsync({ academicPlanId, academicUnitId: academicUnit.id, lessonPlanId: lesson.id }); }
    catch (error) { setActionError(error instanceof ApiError ? error.message : "No se pudo eliminar la clase."); }
  };
  const move = async (index: number, direction: -1 | 1) => {
    const nextLessons = [...lessons];
    [nextLessons[index], nextLessons[index + direction]] = [nextLessons[index + direction], nextLessons[index]];
    setActionError(null);
    try { await reorderLessons.mutateAsync({ academicPlanId, academicUnitId: academicUnit.id, payload: { lessonPlanIds: nextLessons.map((lesson) => lesson.id) } }); }
    catch (error) { setActionError(error instanceof ApiError ? error.message : "No se pudo reordenar las clases."); }
  };

  return <section aria-labelledby={`lesson-plans-${academicUnit.id}`} className="border-t pt-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h4 className="font-medium" id={`lesson-plans-${academicUnit.id}`}>Clases planificadas</h4><p className="text-sm text-muted-foreground">Organiza las clases de esta unidad en su orden pedagógico.</p></div>
      {canManage && !creating && !editing ? <Button onClick={() => setCreating(true)} size="sm">Añadir clase</Button> : null}
    </div>
    {creating || editing ? <Card className="mt-4"><CardHeader><CardTitle className="text-base">{editing ? "Editar clase" : "Nueva clase"}</CardTitle></CardHeader><CardContent><LessonPlanForm academicUnitEndDate={academicUnit.endDate} academicUnitStartDate={academicUnit.startDate} lessonPlan={editing ?? undefined} onCancel={closeForm} onSubmit={save} submitLabel={editing ? "Guardar cambios" : "Crear clase"} /></CardContent></Card> : null}
    {actionError ? <p className="mt-3 text-sm text-destructive" role="alert">{actionError}</p> : null}
    {lessonsQuery.isLoading ? <p className="mt-4 text-sm text-muted-foreground">Cargando clases…</p> : null}
    {lessonsQuery.isError ? <p className="mt-4 text-sm text-destructive" role="alert">No se pudieron cargar las clases. <Button onClick={() => lessonsQuery.refetch()} variant="link">Reintentar</Button></p> : null}
    {!lessonsQuery.isLoading && !lessonsQuery.isError && !lessons.length ? <div className="mt-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground">Esta unidad todavía no tiene clases planificadas.{canManage ? <div className="mt-3"><Button onClick={() => setCreating(true)} size="sm">Crear primera clase</Button></div> : null}</div> : null}
    {!lessonsQuery.isLoading && !lessonsQuery.isError && lessons.length ? <ol className="mt-4 space-y-3">{lessons.map((lesson, index) => <li className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-start sm:justify-between" key={lesson.id}><div className="min-w-0 space-y-1"><p className="text-sm font-medium text-muted-foreground">Clase {lesson.position}</p><h5 className="font-medium">{lesson.title}</h5><p className="text-sm text-muted-foreground">{lesson.lessonDate}{lesson.durationMinutes ? ` · ${lesson.durationMinutes} min` : ""}</p></div>{canManage ? <div className="flex flex-wrap gap-2 sm:justify-end"><Button aria-label={`Subir ${lesson.title}`} disabled={index === 0 || reorderLessons.isPending} onClick={() => move(index, -1)} size="sm" variant="outline">Subir</Button><Button aria-label={`Bajar ${lesson.title}`} disabled={index === lessons.length - 1 || reorderLessons.isPending} onClick={() => move(index, 1)} size="sm" variant="outline">Bajar</Button><Button onClick={() => setEditing(lesson)} size="sm" variant="outline">Editar</Button><Button disabled={deleteLesson.isPending} onClick={() => remove(lesson)} size="sm" variant="destructive">Eliminar</Button></div> : null}</li>)}</ol> : null}
  </section>;
}
