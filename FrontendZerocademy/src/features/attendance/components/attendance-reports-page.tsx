"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useInstitutionAcademicPeriods } from "@/features/academic-periods/hooks/use-institution-academic-periods";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import {
  useAttendanceCourses,
  useCourseAttendanceReport,
  useMyAttendanceHistory,
  useCreateAttendanceJustification,
  usePendingAttendanceJustifications,
  useReviewAttendanceJustification,
} from "@/features/attendance/hooks/use-attendance";
import { useAuthStore } from "@/stores/use-auth-store";

export function AttendanceReportsPage() {
  const role = useAuthStore((state) => state.user?.role);
  const student = role === "STUDENT";
  const [period, setPeriod] = useState("");
  const [course, setCourse] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const periods = useInstitutionAcademicPeriods();
  const courses = useAttendanceCourses(period);
  const mine = useMyAttendanceHistory(period, start, end);
  const report = useCourseAttendanceReport(period, course, start, end);
  const submitJustification = useCreateAttendanceJustification();
  const pendingJustifications = usePendingAttendanceJustifications(
    role === "ADMIN",
  );
  const reviewJustification = useReviewAttendanceJustification();
  const summary = student ? mine.data?.summary : undefined;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">
          {student ? "Mi asistencia" : "Reportes de asistencia"}
        </h1>
        <p className="text-sm text-muted-foreground">
          El porcentaje usa solo días registrados; no se infieren ausencias.
        </p>
      </header>
      <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label>Período</Label>
          <Select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setCourse("");
            }}
          >
            <option value="">Selecciona un período</option>
            {(periods.data?.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {formatAcademicPeriodOptionLabel(item)}
              </option>
            ))}
          </Select>
        </div>
        {!student ? (
          <div>
            <Label>Curso</Label>
            <Select value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="">Selecciona un curso</option>
              {(courses.data ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.gradeLevelName} · {item.name} {item.section}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <div>
          <Label>Desde</Label>
          <Input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div>
          <Label>Hasta</Label>
          <Input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>
      {summary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Registrados", summary.recordedDays],
            ["Presente", summary.present],
            ["Ausente", summary.absent],
            ["Atraso", summary.late],
            ["Justificado", summary.excused],
            [
              "Asistencia",
              summary.attendancePercentage === null
                ? "—"
                : `${summary.attendancePercentage}%`,
            ],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground">{label}</p>
              <b>{value}</b>
            </div>
          ))}
        </div>
      ) : null}
      {student && mine.data ? (
        <div className="space-y-2">
          {mine.data.records.map((item) => (
            <article
              key={`${item.date}-${item.courseName}`}
              className="rounded-lg border p-3 text-sm"
            >
              <b>{item.date}</b> · {item.status}
              <span className="block text-muted-foreground">
                {item.courseName}
                {item.notes ? ` · ${item.notes}` : ""}
              </span>
              {item.status === "ABSENT" ? (
                item.pendingJustification ? (
                  <p className="mt-2 text-amber-700">
                    Justificación en revisión
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    <Label htmlFor={`reason-${item.id}`}>
                      Motivo de justificación
                    </Label>
                    <Textarea
                      id={`reason-${item.id}`}
                      value={reasons[item.id] ?? ""}
                      maxLength={1000}
                      onChange={(event) =>
                        setReasons((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      disabled={
                        !reasons[item.id]?.trim() ||
                        submitJustification.isPending
                      }
                      onClick={() =>
                        submitJustification.mutate({
                          attendanceRecordId: item.id,
                          reason: reasons[item.id].trim(),
                        })
                      }
                    >
                      Enviar justificación
                    </Button>
                  </div>
                )
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
      {role === "ADMIN" ? (
        <section className="space-y-3 rounded-lg border p-4">
          <div>
            <h2 className="font-semibold">Justificaciones pendientes</h2>
            <p className="text-sm text-muted-foreground">
              Al aprobar, la ausencia pasa a justificada.
            </p>
          </div>
          {(pendingJustifications.data ?? []).map((item) => {
            const studentName = `${item.attendanceRecord.enrollment.student.user.lastName} ${item.attendanceRecord.enrollment.student.user.firstName}`;
            return (
              <article key={item.id} className="rounded border p-3 text-sm">
                <b>{studentName}</b> · {item.attendanceRecord.course.name}{" "}
                {item.attendanceRecord.course.section} ·{" "}
                {item.attendanceRecord.date.slice(0, 10)}
                <p className="mt-1 text-muted-foreground">{item.reason}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    disabled={reviewJustification.isPending}
                    onClick={() =>
                      reviewJustification.mutate({
                        justificationId: item.id,
                        decision: "APPROVE",
                      })
                    }
                  >
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reviewJustification.isPending}
                    onClick={() => {
                      const comment = window.prompt(
                        "Indica el motivo del rechazo:",
                      );
                      if (comment?.trim())
                        reviewJustification.mutate({
                          justificationId: item.id,
                          decision: "REJECT",
                          comment: comment.trim(),
                        });
                    }}
                  >
                    Rechazar
                  </Button>
                </div>
              </article>
            );
          })}
          {pendingJustifications.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay justificaciones pendientes.
            </p>
          ) : null}
        </section>
      ) : null}
      {!student && report.data ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Presente</th>
                <th>Ausente</th>
                <th>Atraso</th>
                <th>Justificado</th>
                <th>Registrados</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {report.data.students.map((item) => (
                <tr key={item.enrollmentId}>
                  <td>{item.fullName}</td>
                  <td>{item.present}</td>
                  <td>{item.absent}</td>
                  <td>{item.late}</td>
                  <td>{item.excused}</td>
                  <td>{item.recordedDays}</td>
                  <td>{item.attendancePercentage ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
