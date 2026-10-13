"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAcademicPeriodContext } from "@/features/academic-periods/hooks/use-academic-period-context";
import { REGIME_LABELS, STATUS_LABELS, STATUS_VARIANTS } from "@/features/academic-periods/constants";
import { useScheduleStructure, useScheduleStructureMutations, useScheduleStructureValidation } from "@/features/timetables/hooks/use-schedule-structure";
import type { ScheduleBlock, ScheduleBlockInput, ScheduleBlockKind, Weekday } from "@/features/timetables/types";
import { ApiError } from "@/lib/api-error";
import { canManageScheduleStructures } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const weekdays: Array<{ value: Weekday; label: string }> = [
  { value: "MON", label: "Lunes" }, { value: "TUE", label: "Martes" }, { value: "WED", label: "Miércoles" }, { value: "THU", label: "Jueves" }, { value: "FRI", label: "Viernes" },
];
const kindLabels: Record<ScheduleBlockKind, string> = { TEACHING: "Clase", BREAK: "Recreo", NON_TEACHING: "No lectivo" };
const emptyBlock: ScheduleBlockInput = { name: "", startTime: "07:00", endTime: "07:40", kind: "TEACHING" };

export function TimetablesPage() {
  const role = useAuthStore((state) => state.user?.role);
  const { data: context, isLoading: contextLoading, isError: contextError } = useAcademicPeriodContext();
  const period = context?.effectivePeriod;
  const institutionId = context?.institutionId;
  const canManage = canManageScheduleStructures(role);
  const immutable = period?.status === "CLOSED" || period?.status === "ARCHIVED";
  const { data: structure, isLoading, isError, error, refetch } = useScheduleStructure(institutionId, period?.id);
  const { data: validation } = useScheduleStructureValidation(institutionId, period?.id);

  if (!canManage) return <AccessDenied />;
  if (contextLoading) return <p className="text-sm text-muted-foreground">Cargando el contexto académico…</p>;
  if (contextError || !period || !institutionId) return <ContextRequired />;
  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando la estructura horaria…</p>;
  if (isError || !structure) return <LoadError message={messageFor(error)} onRetry={() => void refetch()} />;

  return <ScheduleStructureWorkspace structure={structure} period={period} immutable={immutable} validation={validation} />;
}

function ScheduleStructureWorkspace({ structure, period, immutable, validation }: { structure: NonNullable<ReturnType<typeof useScheduleStructure>["data"]>; period: NonNullable<ReturnType<typeof useAcademicPeriodContext>["data"]>["effectivePeriod"] & {}; immutable: boolean; validation: ReturnType<typeof useScheduleStructureValidation>["data"] }) {
  const mutations = useScheduleStructureMutations(structure.institutionId, structure.academicPeriodId);
  const [draftDays, setDraftDays] = useState<Weekday[]>(structure.enabledWeekdays);
  const [editor, setEditor] = useState<{ block?: ScheduleBlock; value: ScheduleBlockInput } | null>(null);
  const saveDays = async () => { await mutations.saveWeekdays.mutateAsync(draftDays); };
  const saveBlock = async () => {
    if (!editor) return;
    if (editor.value.startTime >= editor.value.endTime) return;
    if (editor.block) await mutations.updateBlock.mutateAsync({ id: editor.block.id, payload: editor.value });
    else await mutations.createBlock.mutateAsync(editor.value);
    setEditor(null);
  };
  const reorder = async (index: number, delta: -1 | 1) => {
    const ids = structure.blocks.map((block) => block.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    await mutations.reorder.mutateAsync(ids);
  };
  const remove = async (block: ScheduleBlock) => {
    if (window.confirm(`¿Eliminar el bloque ${block.name ?? `#${block.position}`}?`)) await mutations.deleteBlock.mutateAsync(block.id);
  };
  const busy = mutations.saveWeekdays.isPending || mutations.createBlock.isPending || mutations.updateBlock.isPending || mutations.deleteBlock.isPending || mutations.reorder.isPending;
  const mutationError = [mutations.saveWeekdays.error, mutations.createBlock.error, mutations.updateBlock.error, mutations.deleteBlock.error, mutations.reorder.error].find(Boolean);

  return <div className="space-y-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 className="text-2xl font-semibold tracking-tight">Horario semanal</h1><p className="mt-1 text-sm text-muted-foreground">Define las celdas de tiempo que se usarán después para cargas docentes y horarios.</p></div>
      <div className="flex flex-wrap gap-2"><Badge variant={STATUS_VARIANTS[period.status]}>{STATUS_LABELS[period.status]}</Badge><Badge variant="secondary">{REGIME_LABELS[period.regime]}</Badge></div>
    </header>
    {immutable ? <p className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">Este período está {STATUS_LABELS[period.status].toLowerCase()}. La estructura se muestra en modo de solo lectura.</p> : null}
    {mutationError ? <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">{messageFor(mutationError)}</p> : null}
    <Card><CardHeader><CardTitle className="text-lg">Días lectivos</CardTitle><CardDescription>Selecciona todos los días que forman la jornada semanal.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-2">{weekdays.map((day) => <label key={day.value} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"><input type="checkbox" checked={draftDays.includes(day.value)} disabled={immutable || busy} onChange={() => setDraftDays((current) => current.includes(day.value) ? current.filter((value) => value !== day.value) : [...current, day.value])} />{day.label}</label>)}</div><Button disabled={immutable || busy} onClick={() => void saveDays()}>{mutations.saveWeekdays.isPending ? "Guardando…" : "Guardar días"}</Button></CardContent></Card>
    <Card><CardHeader><div className="flex items-center justify-between gap-4"><div><CardTitle className="text-lg">Bloques horarios</CardTitle><CardDescription>{structure.blocks.length ? "Ordena los bloques y configura sus horarios." : "Aún no hay bloques configurados."}</CardDescription></div><Button disabled={immutable || busy} onClick={() => setEditor({ value: emptyBlock })}><Plus aria-hidden className="h-4 w-4" />Añadir bloque</Button></div></CardHeader><CardContent className="space-y-4">
      {editor ? <BlockForm value={editor.value} onChange={(value) => setEditor((current) => current ? { ...current, value } : current)} onCancel={() => setEditor(null)} onSave={() => void saveBlock()} saving={busy} /> : null}
      {structure.blocks.length === 0 ? <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Añade períodos de clase, recreos o tiempos no lectivos para empezar.</div> : <div className="divide-y rounded-md border">{structure.blocks.map((block, index) => <div key={block.id} className="flex flex-wrap items-center gap-3 p-3"><span className="w-6 text-sm text-muted-foreground">{block.position}</span><div className="min-w-40 flex-1"><p className="font-medium">{block.name ?? kindLabels[block.kind]}</p><p className="text-sm text-muted-foreground">{block.startTime} – {block.endTime}</p></div><Badge variant={block.kind === "TEACHING" ? "success" : "muted"}>{kindLabels[block.kind]}</Badge><div className="ml-auto flex gap-1"><Button size="icon" variant="ghost" aria-label="Subir bloque" disabled={immutable || busy || index === 0} onClick={() => void reorder(index, -1)}><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Bajar bloque" disabled={immutable || busy || index === structure.blocks.length - 1} onClick={() => void reorder(index, 1)}><ArrowDown className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Editar bloque" disabled={immutable || busy} onClick={() => setEditor({ block, value: { name: block.name ?? "", startTime: block.startTime, endTime: block.endTime, kind: block.kind } })}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Eliminar bloque" disabled={immutable || busy} onClick={() => void remove(block)}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div>}
      {validation && !validation.structurallyReady ? <ul className="space-y-1 text-sm text-destructive">{validation.issues.map((issue) => <li key={`${issue.status}-${issue.scheduleBlockId ?? "general"}`}>{issue.message}</li>)}</ul> : <p className="text-sm text-muted-foreground">Capacidad semanal por curso: {structure.capacity.weeklyTeachingSlotsPerCourse} bloques lectivos.</p>}
    </CardContent></Card>
  </div>;
}

function BlockForm({ value, onChange, onCancel, onSave, saving }: { value: ScheduleBlockInput; onChange: (value: ScheduleBlockInput) => void; onCancel: () => void; onSave: () => void; saving: boolean }) {
  const invalid = value.startTime >= value.endTime;
  return <div className="grid gap-3 rounded-md border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-5"><div><Label htmlFor="block-name">Nombre</Label><Input id="block-name" value={value.name ?? ""} maxLength={120} onChange={(event) => onChange({ ...value, name: event.target.value })} /></div><div><Label htmlFor="block-start">Inicio</Label><Input id="block-start" type="time" value={value.startTime} onChange={(event) => onChange({ ...value, startTime: event.target.value })} /></div><div><Label htmlFor="block-end">Fin</Label><Input id="block-end" type="time" value={value.endTime} onChange={(event) => onChange({ ...value, endTime: event.target.value })} /></div><div><Label htmlFor="block-kind">Tipo</Label><Select id="block-kind" value={value.kind} onChange={(event) => onChange({ ...value, kind: event.target.value as ScheduleBlockKind })}><option value="TEACHING">Clase</option><option value="BREAK">Recreo</option><option value="NON_TEACHING">No lectivo</option></Select></div><div className="flex items-end gap-2"><Button disabled={saving || invalid} onClick={onSave}>Guardar</Button><Button variant="outline" disabled={saving} onClick={onCancel}>Cancelar</Button></div>{invalid ? <p className="text-sm text-destructive sm:col-span-2 lg:col-span-5">La hora de fin debe ser posterior a la hora de inicio.</p> : null}</div>;
}

function messageFor(error: unknown) { return error instanceof ApiError ? error.message : "No se pudo completar la solicitud. Inténtalo de nuevo."; }
function AccessDenied() { return <div className="mx-auto max-w-lg space-y-4 py-12 text-center"><h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1><p className="text-sm text-muted-foreground">Solo las personas administradoras de la institución pueden gestionar la estructura horaria.</p></div>; }
function ContextRequired() { return <div className="mx-auto max-w-lg space-y-3 py-12 text-center"><CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" /><h1 className="text-2xl font-semibold tracking-tight">Selecciona un período académico</h1><p className="text-sm text-muted-foreground">No hay un período institucional disponible para configurar el horario.</p></div>; }
function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="space-y-4"><p className="text-sm text-destructive">{message}</p><Button variant="outline" onClick={onRetry}>Reintentar</Button></div>; }
