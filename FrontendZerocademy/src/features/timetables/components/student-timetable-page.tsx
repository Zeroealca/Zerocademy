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
import { Select } from "@/components/ui/select";
import { useAcademicPeriodContext } from "@/features/academic-periods/hooks/use-academic-period-context";
import {
  useRepresentativeStudents,
  useRepresentativeTimetable,
  useRepresentativeTodayTimetable,
  useStudentTimetable,
  useStudentTodayTimetable,
} from "@/features/timetables/hooks/use-timetables";
import type {
  StudentTimetable,
  StudentTimetableSlot,
  Weekday,
} from "@/features/timetables/types";
import { ApiError } from "@/lib/api-error";

const labels: Record<Weekday, string> = {
  MON: "Lunes",
  TUE: "Martes",
  WED: "Miércoles",
  THU: "Jueves",
  FRI: "Viernes",
};

export function StudentTimetablePage({
  representative = false,
}: {
  representative?: boolean;
}) {
  const [view, setView] = useState<"weekly" | "today">("weekly");
  const [studentId, setStudentId] = useState<string>();
  const context = useAcademicPeriodContext();
  const periodId = context.data?.effectivePeriod?.id;
  const students = useRepresentativeStudents(representative);
  const selectedId = studentId ?? students.data?.[0]?.studentId;
  const studentWeekly = useStudentTimetable(periodId);
  const studentToday = useStudentTodayTimetable(periodId);
  const representativeWeekly = useRepresentativeTimetable(selectedId, periodId);
  const representativeToday = useRepresentativeTodayTimetable(
    selectedId,
    periodId,
  );
  const query = representative
    ? view === "weekly"
      ? representativeWeekly
      : representativeToday
    : view === "weekly"
      ? studentWeekly
      : studentToday;
  const selected = students.data?.find(
    (student) => student.studentId === selectedId,
  );

  if (representative && students.isLoading)
    return <Message text="Cargando estudiantes vinculados…" />;
  if (representative && students.isError)
    return (
      <Message text="No se pudieron cargar los estudiantes vinculados." error />
    );
  if (representative && !students.data?.length)
    return (
      <Message text="No tienes estudiantes vinculados para consultar horarios." />
    );
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {representative ? "Horario del estudiante" : "Mi horario"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulta únicamente las clases publicadas.
        </p>
      </header>
      {representative && selected ? (
        <div className="max-w-sm space-y-2">
          <label htmlFor="timetable-student" className="text-sm font-medium">
            Estudiante
          </label>
          <Select
            id="timetable-student"
            value={selectedId}
            onChange={(event) => setStudentId(event.target.value)}
          >
            {students.data?.map((student) => (
              <option key={student.studentId} value={student.studentId}>
                {student.fullName}
                {student.courseName ? ` · ${student.courseName}` : ""}
              </option>
            ))}
          </Select>
          <p className="text-sm text-muted-foreground">
            Mostrando el horario de {selected.fullName}.
          </p>
        </div>
      ) : null}
      <nav aria-label="Vistas del horario" className="border-b">
        <div role="tablist" className="flex gap-1">
          <Button
            role="tab"
            aria-selected={view === "weekly"}
            aria-controls="student-weekly"
            variant={view === "weekly" ? "secondary" : "ghost"}
            onClick={() => setView("weekly")}
          >
            Semana
          </Button>
          <Button
            role="tab"
            aria-selected={view === "today"}
            aria-controls="student-today"
            variant={view === "today" ? "secondary" : "ghost"}
            onClick={() => setView("today")}
          >
            Hoy
          </Button>
        </div>
      </nav>
      {query.isLoading ? <Message text="Cargando el horario…" /> : null}
      {query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : null}
      {query.data ? (
        view === "weekly" ? (
          <Weekly data={query.data.data} />
        ) : (
          <Today data={query.data.data} />
        )
      ) : null}
    </div>
  );
}

function Weekly({ data }: { data: StudentTimetable[] }) {
  const slots = data.flatMap((item) => item.slots);
  if (!slots.length)
    return (
      <Message text="No hay un horario semanal publicado para este período." />
    );
  const days = (Object.keys(labels) as Weekday[]).filter((day) =>
    slots.some((slot) => slot.weekday === day),
  );
  const blocks = [
    ...new Map(slots.map((slot) => [slot.scheduleBlockId, slot])).values(),
  ].sort((a, b) => a.scheduleBlockPosition - b.scheduleBlockPosition);
  return (
    <section id="student-weekly" role="tabpanel">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Horario semanal</CardTitle>
          <CardDescription>
            {data.map((item) => item.academicPeriodName).join(", ")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="region"
            aria-label="Cuadrícula del horario semanal"
            tabIndex={0}
            className="overflow-x-auto rounded-md border"
          >
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Horario semanal publicado</caption>
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left">Hora</th>
                  {days.map((day) => (
                    <th key={day} className="min-w-40 p-3 text-left">
                      {labels[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blocks.map((block) => (
                  <tr key={block.scheduleBlockId} className="border-b">
                    <th className="p-3 text-left align-top">
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
function Today({ data }: { data: StudentTimetable[] }) {
  const slots = data
    .flatMap((item) => item.slots)
    .sort((a, b) => a.scheduleBlockPosition - b.scheduleBlockPosition);
  if (!slots.length)
    return (
      <section id="student-today" role="tabpanel">
        <Message text="No hay clases publicadas para hoy." />
      </section>
    );
  return (
    <section id="student-today" role="tabpanel">
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
                  {slot.teacherName ? ` · ${slot.teacherName}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}
function Cell({ slot }: { slot?: StudentTimetableSlot }) {
  return (
    <td className="p-3 align-top">
      {slot ? (
        <>
          <p className="font-medium">{slot.subjectName}</p>
          <p className="text-muted-foreground">{slot.courseName}</p>
          {slot.teacherName ? (
            <p className="text-sm text-muted-foreground">{slot.teacherName}</p>
          ) : null}
        </>
      ) : (
        <span className="text-muted-foreground">Sin clase</span>
      )}
    </td>
  );
}
function Message({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <Card>
      <CardContent
        className={`flex flex-col items-center gap-3 p-8 text-center text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}
        aria-live="polite"
      >
        <CalendarDays className="h-8 w-8" aria-hidden />
        {text}
      </CardContent>
    </Card>
  );
}
function ErrorState({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div
      role="alert"
      className="space-y-3 rounded-md border border-destructive/40 p-4 text-sm text-destructive"
    >
      <p>
        {error instanceof ApiError
          ? error.message
          : "No se pudo cargar el horario."}
      </p>
      <Button variant="outline" onClick={retry}>
        Reintentar
      </Button>
    </div>
  );
}
