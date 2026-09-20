"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useInstitutionAcademicPeriods } from "@/features/academic-periods/hooks/use-institution-academic-periods";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import {
  useAttendanceCourses,
  useCourseAttendanceReport,
  useCreateAttendanceJustification,
  useMyAttendanceHistory,
  usePendingAttendanceJustifications,
  useRepresentativeStudentAttendanceHistory,
  useReviewAttendanceJustification,
} from "@/features/attendance/hooks/use-attendance";
import type {
  AttendanceHistoryItem,
  AttendanceCounts,
} from "@/features/attendance/types";
import { useMyRepresentativeStudents } from "@/features/representatives/hooks/use-representatives";
import { useAuthStore } from "@/stores/use-auth-store";

const statusLabels = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
} as const;

export function AttendanceReportsPage() {
  const searchParams = useSearchParams();
  const role = useAuthStore((state) => state.user?.role);
  const student = role === "STUDENT";
  const representative = role === "REPRESENTATIVE";
  const selfService = student || representative;
  const representativeStudentId = representative
    ? (searchParams.get("studentId") ?? "")
    : "";
  const [period, setPeriod] = useState(
    () => searchParams.get("academicPeriodId") ?? "",
  );
  const [course, setCourse] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const periods = useInstitutionAcademicPeriods();
  const courses = useAttendanceCourses(period);
  const mine = useMyAttendanceHistory(period, start, end, student);
  const representativeHistory = useRepresentativeStudentAttendanceHistory(
    representativeStudentId,
    period,
    start,
    end,
    representative,
  );
  const representativeStudents = useMyRepresentativeStudents(representative);
  const report = useCourseAttendanceReport(period, course, start, end);
  const submitJustification = useCreateAttendanceJustification();
  const pendingJustifications = usePendingAttendanceJustifications(
    role === "ADMIN",
  );
  const reviewJustification = useReviewAttendanceJustification();
  const history = student
    ? mine.data
    : representative
      ? representativeHistory.data
      : undefined;
  const selectedStudent = representativeStudents.data?.find(
    (item) => item.studentId === representativeStudentId,
  );

  if (representative && !representativeStudentId) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Selecciona un estudiante desde Mis estudiantes para consultar su
        asistencia.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">
          {student
            ? "Mi asistencia"
            : representative
              ? "Asistencia del estudiante"
              : "Reportes de asistencia"}
        </h1>
        <p className="text-sm text-muted-foreground">
          El porcentaje usa solo días registrados; no se infieren ausencias.
        </p>
      </header>
      {representative ? (
        <section className="rounded-lg border bg-card p-4 text-sm">
          <p className="text-muted-foreground">Estudiante</p>
          <p className="font-semibold">
            {selectedStudent?.fullName ?? "Cargando estudiante…"}
          </p>
          {selectedStudent?.academicPeriodName ? (
            <p className="text-muted-foreground">
              {selectedStudent.academicPeriodName}
            </p>
          ) : null}
        </section>
      ) : null}
      <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label>Período</Label>
          <Select
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value);
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
        {!selfService ? (
          <div>
            <Label>Curso</Label>
            <Select
              value={course}
              onChange={(event) => setCourse(event.target.value)}
            >
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
            onChange={(event) => setStart(event.target.value)}
          />
        </div>
        <div>
          <Label>Hasta</Label>
          <Input
            type="date"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </div>
      </div>
      {history ? (
        <AttendanceHistory
          summary={history.summary}
          records={history.records}
          reasons={reasons}
          setReasons={setReasons}
          isSubmitting={submitJustification.isPending}
          onSubmit={(attendanceRecordId, reason) =>
            submitJustification.mutate({ attendanceRecordId, reason })
          }
        />
      ) : null}
      {role === "ADMIN" ? (
        <ReviewQueue
          items={pendingJustifications.data ?? []}
          isReviewing={reviewJustification.isPending}
          onReview={(justificationId, decision, comment) =>
            reviewJustification.mutate({ justificationId, decision, comment })
          }
        />
      ) : null}
      {!selfService && report.data ? <CourseReport /> : null}
    </div>
  );

  function CourseReport() {
    return (
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
            {report.data?.students.map((item) => (
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
    );
  }
}

type AttendanceHistoryProps = {
  summary: AttendanceCounts;
  records: AttendanceHistoryItem[];
  reasons: Record<string, string>;
  setReasons: Dispatch<SetStateAction<Record<string, string>>>;
  isSubmitting: boolean;
  onSubmit: (attendanceRecordId: string, reason: string) => void;
};
function AttendanceHistory({
  summary,
  records,
  reasons,
  setReasons,
  isSubmitting,
  onSubmit,
}: AttendanceHistoryProps) {
  return (
    <>
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
      <div className="space-y-2">
        {records.map((item) => (
          <article key={item.id} className="rounded-lg border p-3 text-sm">
            <b>{item.date}</b> · {item.status}
            <span className="block text-muted-foreground">
              {item.courseName}
              {item.notes ? ` · ${item.notes}` : ""}
            </span>
            {item.justification ? (
              <p className="mt-2 text-muted-foreground">
                Justificación: {statusLabels[item.justification.status]}
              </p>
            ) : null}
            {item.canSubmitJustification ? (
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
                  disabled={!reasons[item.id]?.trim() || isSubmitting}
                  onClick={() => onSubmit(item.id, reasons[item.id].trim())}
                >
                  Enviar justificación
                </Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}

type ReviewQueueProps = {
  items: {
    id: string;
    reason: string;
    submittedByUser: {
      firstName: string;
      lastName: string;
      role: "STUDENT" | "REPRESENTATIVE";
    };
    attendanceRecord: {
      id: string;
      date: string;
      course: { name: string; section: string };
      enrollment: {
        student: { user: { firstName: string; lastName: string } };
      };
    };
  }[];
  isReviewing: boolean;
  onReview: (
    justificationId: string,
    decision: "APPROVE" | "REJECT",
    comment?: string,
  ) => void;
};
function ReviewQueue({ items, isReviewing, onReview }: ReviewQueueProps) {
  return (
    <section className="space-y-3 rounded-lg border p-4">
      <div>
        <h2 className="font-semibold">Justificaciones pendientes</h2>
        <p className="text-sm text-muted-foreground">
          Al aprobar, la ausencia pasa a justificada.
        </p>
      </div>
      {items.map((item) => {
        const studentName = `${item.attendanceRecord.enrollment.student.user.lastName} ${item.attendanceRecord.enrollment.student.user.firstName}`;
        const submitterName = `${item.submittedByUser.firstName} ${item.submittedByUser.lastName}`;
        return (
          <article key={item.id} className="rounded border p-3 text-sm">
            <b>{studentName}</b> · {item.attendanceRecord.course.name}{" "}
            {item.attendanceRecord.course.section} ·{" "}
            {item.attendanceRecord.date.slice(0, 10)}
            <p className="mt-1 text-muted-foreground">
              Presentada por:{" "}
              {item.submittedByUser.role === "REPRESENTATIVE"
                ? "Representante"
                : "Estudiante"}{" "}
              ({submitterName})
            </p>
            <p className="mt-1 text-muted-foreground">{item.reason}</p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                disabled={isReviewing}
                onClick={() => onReview(item.id, "APPROVE")}
              >
                Aprobar
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isReviewing}
                onClick={() => {
                  const comment = window.prompt(
                    "Indica el motivo del rechazo:",
                  );
                  if (comment?.trim())
                    onReview(item.id, "REJECT", comment.trim());
                }}
              >
                Rechazar
              </Button>
            </div>
          </article>
        );
      })}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay justificaciones pendientes.
        </p>
      ) : null}
    </section>
  );
}
