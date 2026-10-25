"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAcademicPeriodContext } from "@/features/academic-periods/hooks/use-academic-period-context";
import {
  useMyTimetable,
  useMyTodayTimetable,
} from "@/features/timetables/hooks/use-timetables";
import type {
  TeacherTimetable,
  TeacherTimetableSlot,
  Weekday,
} from "@/features/timetables/types";
import { ApiError } from "@/lib/api-error";

const weekdayLabels: Record<Weekday, string> = {
  MON: "Lunes",
  TUE: "Martes",
  WED: "Miércoles",
  THU: "Jueves",
  FRI: "Viernes",
};

export function TeacherTimetablePage() {
  const [view, setView] = useState<"weekly" | "today">("weekly");
  const context = useAcademicPeriodContext();
  const academicPeriodId = context.data?.effectivePeriod?.id;
  const weekly = useMyTimetable(academicPeriodId);
  const today = useMyTodayTimetable(academicPeriodId);
  const query = view === "weekly" ? weekly : today;

  if (context.isLoading)
    return <Loading label="Cargando el contexto académico…" />;
  if (context.isError || !academicPeriodId) return <ContextError />;
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mi horario</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta las clases publicadas para el período académico
            seleccionado.
          </p>
        </div>
      </header>
      <nav aria-label="Vistas de mi horario" className="border-b">
        <div
          role="tablist"
          aria-label="Vistas del horario"
          className="flex gap-1"
        >
          <Button
            role="tab"
            variant={view === "weekly" ? "secondary" : "ghost"}
            aria-selected={view === "weekly"}
            aria-controls="teacher-weekly-panel"
            id="teacher-weekly-tab"
            onClick={() => setView("weekly")}
          >
            Semana
          </Button>
          <Button
            role="tab"
            variant={view === "today" ? "secondary" : "ghost"}
            aria-selected={view === "today"}
            aria-controls="teacher-today-panel"
            id="teacher-today-tab"
            onClick={() => setView("today")}
          >
            Hoy
          </Button>
        </div>
      </nav>
      {query.isLoading ? <Loading label="Cargando tu horario…" /> : null}
      {query.isError ? (
        <QueryError error={query.error} onRetry={() => void query.refetch()} />
      ) : null}
      {query.data ? (
        view === "weekly" ? (
          <Weekly timetable={query.data.data} />
        ) : (
          <Today timetable={query.data.data} />
        )
      ) : null}
    </div>
  );
}

function Weekly({ timetable }: { timetable: TeacherTimetable[] }) {
  const slots = timetable.flatMap((item) => item.slots);
  if (!slots.length)
    return (
      <Empty text="No tienes un horario semanal publicado para este período." />
    );
  const days = (Object.keys(weekdayLabels) as Weekday[]).filter((day) =>
    slots.some((slot) => slot.weekday === day),
  );
  const blocks = [
    ...new Map(slots.map((slot) => [slot.scheduleBlockId, slot])).values(),
  ].sort((a, b) => a.scheduleBlockPosition - b.scheduleBlockPosition);
  const today = currentWeekday();
  return (
    <section
      id="teacher-weekly-panel"
      role="tabpanel"
      aria-labelledby="teacher-weekly-tab"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Horario semanal</CardTitle>
          <CardDescription>
            {timetable.map((item) => item.academicPeriodName).join(", ")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="region"
            aria-label="Cuadrícula de mi horario semanal"
            tabIndex={0}
            className="overflow-x-auto rounded-md border"
          >
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <caption className="sr-only">Horario semanal publicado</caption>
              <thead>
                <tr className="border-b bg-muted/50">
                  <th scope="col" className="px-3 py-2 text-left">
                    Hora
                  </th>
                  {days.map((day) => (
                    <th
                      key={day}
                      scope="col"
                      aria-current={today === day ? "date" : undefined}
                      className="min-w-40 px-3 py-2 text-left"
                    >
                      {weekdayLabels[day]}
                      {today === day ? " (hoy)" : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blocks.map((block) => (
                  <tr
                    key={block.scheduleBlockId}
                    className="border-b last:border-0"
                  >
                    <th
                      scope="row"
                      className="px-3 py-3 text-left align-top font-medium"
                    >
                      {block.scheduleBlockStartTime} –{" "}
                      {block.scheduleBlockEndTime}
                    </th>
                    {days.map((day) => (
                      <Cell
                        key={day}
                        slot={slots.find(
                          (slot) =>
                            slot.weekday === day &&
                            slot.scheduleBlockId === block.scheduleBlockId,
                        )}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function Today({ timetable }: { timetable: TeacherTimetable[] }) {
  const slots = timetable
    .flatMap((item) => item.slots)
    .sort((a, b) => a.scheduleBlockPosition - b.scheduleBlockPosition);
  if (!slots.length)
    return (
      <section
        id="teacher-today-panel"
        role="tabpanel"
        aria-labelledby="teacher-today-tab"
      >
        <Empty text="No tienes clases publicadas para hoy." />
      </section>
    );
  return (
    <section
      id="teacher-today-panel"
      role="tabpanel"
      aria-labelledby="teacher-today-tab"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Clases de hoy</CardTitle>
          <CardDescription>
            Las clases se muestran en orden cronológico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {slots.map((slot) => (
              <li key={slot.id} className="rounded-md border p-4">
                <p className="font-medium">
                  {slot.scheduleBlockStartTime} – {slot.scheduleBlockEndTime}
                </p>
                <p>{slot.subjectName}</p>
                <p className="text-sm text-muted-foreground">
                  {slot.courseName}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}

function Cell({ slot }: { slot?: TeacherTimetableSlot }) {
  return (
    <td className="px-3 py-3 align-top">
      {slot ? (
        <>
          <p className="font-medium">{slot.subjectName}</p>
          <p className="text-muted-foreground">{slot.courseName}</p>
        </>
      ) : (
        <span className="text-muted-foreground">Sin clase</span>
      )}
    </td>
  );
}
function currentWeekday(): Weekday | undefined {
  const short = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "America/Guayaquil",
  }).format(new Date());
  return (
    { Mon: "MON", Tue: "TUE", Wed: "WED", Thu: "THU", Fri: "FRI" } as Record<
      string,
      Weekday
    >
  )[short];
}
function Loading({ label }: { label: string }) {
  return (
    <p className="text-sm text-muted-foreground" aria-live="polite">
      {label}
    </p>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-muted-foreground">
        <CalendarDays className="h-8 w-8" aria-hidden />
        {text}
      </CardContent>
    </Card>
  );
}
function ContextError() {
  return (
    <Empty text="No hay un período académico seleccionado para consultar tu horario." />
  );
}
function QueryError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="space-y-3 rounded-md border border-destructive/40 p-4 text-sm text-destructive"
    >
      <p>
        {error instanceof ApiError
          ? error.message
          : "No se pudo cargar tu horario."}
      </p>
      <Button variant="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}
