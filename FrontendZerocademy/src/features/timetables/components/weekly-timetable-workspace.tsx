"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useTimetable, useTimetableValidation, useTimetables } from "@/features/timetables/hooks/use-timetables";
import type { ScheduleBlock, ScheduleStructureDetail, Timetable, TimetableConflict, Weekday } from "@/features/timetables/types";
import { ApiError } from "@/lib/api-error";

const weekdayLabels: Record<Weekday, string> = {
  MON: "Lunes",
  TUE: "Martes",
  WED: "Miércoles",
  THU: "Jueves",
  FRI: "Viernes",
};

const blockKindLabels = {
  BREAK: "Recreo",
  NON_TEACHING: "No lectivo",
  TEACHING: "Clase",
} as const;

type Period = { id: string; name: string };

export function WeeklyTimetableWorkspace({
  institutionId,
  period,
  selector,
  structure,
  structureLoading,
  structureError,
}: {
  institutionId: string;
  period: Period;
  selector: ReactNode;
  structure?: ScheduleStructureDetail;
  structureLoading: boolean;
  structureError: unknown;
}) {
  const timetables = useTimetables(institutionId, period.id);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>();
  const timetableItems = timetables.data?.data ?? [];
  const timetableId = selectedTimetableId && timetableItems.some((item) => item.id === selectedTimetableId)
    ? selectedTimetableId
    : timetableItems[0]?.id;
  const detail = useTimetable(timetableId);
  const validation = useTimetableValidation(timetableId);
  const timetable = detail.data ?? timetableItems.find((item) => item.id === timetableId);

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Horario semanal</h2>
          <p className="mt-1 text-sm text-muted-foreground">Consulta la distribución publicada o en borrador sin modificar su contenido.</p>
        </div>
        {selector}
      </header>

      {timetables.isLoading ? <p className="text-sm text-muted-foreground">Cargando los horarios del período…</p> : null}
      {timetables.isError ? <ReadError error={timetables.error} /> : null}
      {!timetables.isLoading && !timetables.isError && timetableItems.length === 0 ? <EmptyTimetable /> : null}

      {timetableItems.length > 1 ? (
        <div className="max-w-sm"><Label htmlFor="weekly-timetable">Horario disponible</Label><Select id="weekly-timetable" value={timetableId} onChange={(event) => setSelectedTimetableId(event.target.value)}>{timetableItems.map((item) => <option key={item.id} value={item.id}>Versión {item.version} · {statusLabel(item.status)}</option>)}</Select></div>
      ) : null}

      {timetable ? <TimetableContent timetable={timetable} structure={structure} structureLoading={structureLoading} structureError={structureError} validation={validation.data} validationLoading={validation.isLoading} validationError={validation.error} /> : null}
    </div>
  );
}

function TimetableContent({ timetable, structure, structureLoading, structureError, validation, validationLoading, validationError }: {
  timetable: Timetable;
  structure?: ScheduleStructureDetail;
  structureLoading: boolean;
  structureError: unknown;
  validation?: ReturnType<typeof useTimetableValidation>["data"];
  validationLoading: boolean;
  validationError: unknown;
}) {
  const [courseId, setCourseId] = useState("all");
  const courses = useMemo(() => Array.from(new Map(timetable.slots.map((slot) => [slot.courseId, slot.courseName || "Curso sin nombre"])).entries()), [timetable.slots]);
  const visibleSlots = courseId === "all" ? timetable.slots : timetable.slots.filter((slot) => slot.courseId === courseId);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center gap-2"><Badge variant={timetable.status === "PUBLISHED" ? "success" : "secondary"}>{statusLabel(timetable.status)}</Badge><span className="text-sm text-muted-foreground">Versión {timetable.version}</span></div>
    {courses.length > 1 ? <div className="max-w-sm"><Label htmlFor="weekly-course">Curso</Label><Select id="weekly-course" value={courseId} onChange={(event) => setCourseId(event.target.value)}><option value="all">Todos los cursos</option>{courses.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</Select></div> : null}
    {structureLoading ? <p className="text-sm text-muted-foreground">Cargando la estructura horaria…</p> : null}
    {structureError ? <ReadError error={structureError} /> : null}
    {!structureLoading && !structureError && !structure ? <p className="rounded-md border border-border p-3 text-sm text-muted-foreground">No hay estructura horaria disponible para representar este horario.</p> : null}
    {structure ? <WeeklyGrid structure={structure} timetable={timetable} slots={visibleSlots} /> : null}
    <ValidationPanel validation={validation} loading={validationLoading} error={validationError} />
  </div>;
}

function WeeklyGrid({ structure, timetable, slots }: { structure: ScheduleStructureDetail; timetable: Timetable; slots: Timetable["slots"] }) {
  const blocks = [...structure.blocks].sort((left, right) => left.position - right.position);
  const byCell = new Map(slots.map((slot) => [`${slot.weekday}:${slot.scheduleBlockId}`, slot]));
  return <Card><CardHeader><CardTitle className="text-lg">Cuadrícula semanal</CardTitle><CardDescription>Período {timetable.academicPeriodId === structure.academicPeriodId ? "seleccionado" : "asociado"}. Los recreos y tiempos no lectivos provienen de la estructura horaria.</CardDescription></CardHeader><CardContent><div role="region" aria-label="Cuadrícula del horario semanal" tabIndex={0} className="overflow-x-auto rounded-md border"><table className="w-full min-w-[700px] border-collapse text-sm"><caption className="sr-only">Horario semanal de solo lectura</caption><thead><tr className="border-b bg-muted/50"><th scope="col" className="min-w-40 px-3 py-2 text-left font-medium">Bloque</th>{structure.enabledWeekdays.map((day) => <th key={day} scope="col" className="min-w-48 px-3 py-2 text-left font-medium">{weekdayLabels[day]}</th>)}</tr></thead><tbody>{blocks.map((block) => <tr key={block.id} className="border-b last:border-0"><th scope="row" className="align-top px-3 py-3 text-left font-medium"><span className="block">{block.name || blockKindLabels[block.kind]}</span><span className="font-normal text-muted-foreground">{block.startTime} – {block.endTime}</span></th>{structure.enabledWeekdays.map((day) => <GridCell key={day} block={block} slot={byCell.get(`${day}:${block.id}`)} />)}</tr>)}</tbody></table></div></CardContent></Card>;
}

function GridCell({ block, slot }: { block: ScheduleBlock; slot?: Timetable["slots"][number] }) {
  if (block.kind !== "TEACHING") return <td className="bg-muted/30 px-3 py-3 align-top text-muted-foreground"><span className="font-medium">{blockKindLabels[block.kind]}</span>{block.name ? <span className="block text-xs">{block.name}</span> : null}</td>;
  if (!slot) return <td className="px-3 py-3 align-top text-muted-foreground">Sin clase</td>;
  return <td className="px-3 py-3 align-top"><p className="font-medium">{slot.subjectName || "Asignatura sin nombre"}</p><p className="text-muted-foreground">{slot.courseName || "Curso sin nombre"}</p><p className="text-muted-foreground">{slot.teacherName || "Docente sin asignar"}</p></td>;
}

function ValidationPanel({ validation, loading, error }: { validation: ReturnType<typeof useTimetableValidation>["data"]; loading: boolean; error: unknown }) {
  if (loading) return <p className="text-sm text-muted-foreground">Validando el horario…</p>;
  if (error) return <ReadError error={error} />;
  if (!validation) return null;
  return <Card><CardHeader><CardTitle className="text-lg">Diagnóstico del horario</CardTitle><CardDescription>Resultado de la validación actual del servidor ({validation.mode === "COMPLETE" ? "completa" : "parcial"}).</CardDescription></CardHeader><CardContent>{validation.valid ? <p className="text-sm text-muted-foreground">El servidor no reporta conflictos para este horario.</p> : <ul className="space-y-3" role="list">{validation.conflicts.map((conflict, index) => <li key={`${conflict.code}-${index}`} className="rounded-md border border-destructive/30 p-3 text-sm"><p className="font-medium text-destructive">{conflictLabel(conflict)}</p><p className="mt-1 text-muted-foreground">{conflict.message}</p></li>)}</ul>}</CardContent></Card>;
}

function EmptyTimetable() { return <Card><CardContent className="p-6 text-sm text-muted-foreground">Todavía no existe un horario generado para este período. Esta vista no genera ni modifica horarios.</CardContent></Card>; }
function ReadError({ error }: { error: unknown }) { return <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">{error instanceof ApiError ? error.message : "No se pudo consultar esta información. Inténtalo de nuevo."}</p>; }
function statusLabel(status: Timetable["status"]) { return status === "PUBLISHED" ? "Publicado" : "Borrador"; }
function conflictLabel(conflict: TimetableConflict) { const labels: Record<string, string> = { TEACHER_CONFLICT: "Conflicto de docente", COURSE_CONFLICT: "Conflicto de curso", INVALID_BLOCK: "Bloque no válido", INVALID_DAY: "Día no válido", CONTEXT_MISMATCH: "Contexto no coincide", LOAD_UNSATISFIED: "Carga incompleta", LOAD_OVERSATISFIED: "Carga excedida", MISSING_TEACHING_LOAD: "Carga lectiva faltante", DUPLICATE_CANDIDATE: "Asignación duplicada" }; return labels[conflict.code] ?? conflict.code; }
