"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useInstitutionAcademicPeriods } from "@/features/academic-periods/hooks/use-institution-academic-periods";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import {
  useAttendanceCourses,
  useBulkAttendanceMutation,
  useDailyAttendance,
} from "@/features/attendance/hooks/use-attendance";
import type {
  AttendanceStatus,
  DailyAttendanceStudent,
} from "@/features/attendance/types";
import { canManageAttendance, canViewAttendance } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  LATE: "Atraso",
  EXCUSED: "Justificado",
};
export function AttendancePage() {
  const role = useAuthStore((state) => state.user?.role);
  const [academicPeriodId, setAcademicPeriodId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState("");
  const [drafts, setDrafts] = useState<
    Record<string, Partial<DailyAttendanceStudent>>
  >({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const periods = useInstitutionAcademicPeriods();
  const courses = useAttendanceCourses(academicPeriodId);
  const daily = useDailyAttendance(academicPeriodId, courseId, date);
  const save = useBulkAttendanceMutation();
  const rows = (daily.data?.students ?? []).map((row) => ({
    ...row,
    ...drafts[row.enrollmentId],
  }));
  const dirty = Object.keys(drafts).length > 0;

  const changeContext = (action: () => void) => {
    if (
      !dirty ||
      window.confirm("Tienes cambios sin guardar. ¿Deseas descartarlos?")
    ) {
      setFeedback(null);
      setDrafts({});
      action();
    }
  };
  const updateRow = (
    enrollmentId: string,
    change: Partial<DailyAttendanceStudent>,
  ) =>
    setDrafts((current) => ({
      ...current,
      [enrollmentId]: { ...current[enrollmentId], ...change },
    }));
  const markAllPresent = () =>
    setDrafts((current) =>
      Object.fromEntries(
        rows.map((row) => [
          row.enrollmentId,
          { ...current[row.enrollmentId], status: "PRESENT" },
        ]),
      ),
    );
  const handleSave = async () => {
    if (
      !academicPeriodId ||
      !courseId ||
      !date ||
      rows.some((row) => !row.status)
    ) {
      setFeedback(
        "Marca la asistencia de todos los estudiantes antes de guardar.",
      );
      return;
    }
    try {
      const result = await save.mutateAsync({
        academicPeriodId,
        courseId,
        date,
        records: rows.map((row) => ({
          enrollmentId: row.enrollmentId,
          status: row.status!,
          notes: row.notes || undefined,
        })),
      });
      setDrafts({});
      setFeedback(
        `Asistencia guardada: ${result.created} creada(s) y ${result.updated} actualizada(s).`,
      );
    } catch {
      setFeedback("No se pudo guardar la asistencia. Inténtalo nuevamente.");
    }
  };
  if (!canViewAttendance(role))
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No tienes acceso a la asistencia.
      </p>
    );
  const readOnly = daily.data?.isReadOnly || !canManageAttendance(role);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Asistencia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registra la asistencia diaria por curso.
        </p>
      </header>
      <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Período académico</Label>
          <Select
            value={academicPeriodId}
            onChange={(event) =>
              changeContext(() => {
                setAcademicPeriodId(event.target.value);
                setCourseId("");
              })
            }
          >
            <option value="">Selecciona un período</option>
            {(periods.data?.data ?? []).map((period) => (
              <option key={period.id} value={period.id}>
                {formatAcademicPeriodOptionLabel(period)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Curso / paralelo</Label>
          <Select
            value={courseId}
            disabled={!academicPeriodId}
            onChange={(event) =>
              changeContext(() => setCourseId(event.target.value))
            }
          >
            <option value="">Selecciona un curso</option>
            {(courses.data ?? []).map((course) => (
              <option key={course.id} value={course.id}>
                {course.gradeLevelName} · {course.name} {course.section}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input
            type="date"
            value={date}
            onChange={(event) =>
              changeContext(() => setDate(event.target.value))
            }
          />
        </div>
      </div>
      {daily.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando estudiantes…</p>
      ) : daily.isError ? (
        <p className="text-sm text-destructive">
          No se pudo cargar la asistencia del curso.
        </p>
      ) : !daily.data ? (
        <p className="text-sm text-muted-foreground">
          Selecciona período, curso y fecha para registrar asistencia.
        </p>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">
                {daily.data.course.gradeLevelName} · {daily.data.course.name}{" "}
                {daily.data.course.section}
              </h2>
              <p className="text-sm text-muted-foreground">
                {date}
                {readOnly ? " · Período de solo lectura" : ""}
              </p>
            </div>
            {!readOnly ? (
              <Button variant="outline" onClick={markAllPresent}>
                Marcar todos presentes
              </Button>
            ) : null}
          </div>
          {rows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No hay estudiantes matriculados para esta fecha.
            </p>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => (
                <article
                  key={row.enrollmentId}
                  className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_180px_1fr]"
                >
                  <p className="self-center font-medium">{row.fullName}</p>
                  <Select
                    value={row.status ?? ""}
                    disabled={readOnly}
                    aria-label={`Asistencia de ${row.fullName}`}
                    onChange={(event) =>
                      updateRow(row.enrollmentId, {
                        status: event.target.value as AttendanceStatus,
                      })
                    }
                  >
                    <option value="">Sin registrar</option>
                    {Object.entries(STATUS_LABELS).map(([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <Input
                    value={row.notes ?? ""}
                    disabled={readOnly}
                    maxLength={500}
                    placeholder="Observación opcional"
                    onChange={(event) =>
                      updateRow(row.enrollmentId, { notes: event.target.value })
                    }
                  />
                </article>
              ))}
            </div>
          )}
          {feedback ? (
            <p
              className={
                feedback.startsWith("No se pudo") ||
                feedback.startsWith("Marca")
                  ? "text-sm text-destructive"
                  : "text-sm text-emerald-700 dark:text-emerald-400"
              }
            >
              {feedback}
            </p>
          ) : null}
          {!readOnly && rows.length > 0 ? (
            <div className="flex justify-end">
              <Button
                disabled={!dirty || save.isPending}
                onClick={() => void handleSave()}
              >
                {save.isPending ? "Guardando…" : "Guardar asistencia"}
              </Button>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
