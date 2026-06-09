"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { useAcademicTerms } from "@/features/academic-periods/hooks/use-academic-terms";
import { useAssessments } from "@/features/grades/hooks/use-assessments";
import { useGradeEntrySheet } from "@/features/grades/hooks/use-grades";
import { useGradeMutations } from "@/features/grades/hooks/use-grade-mutations";
import { useTeacherAssignments } from "@/features/teacher-assignments/hooks/use-teacher-assignments";
import { useCourses } from "@/features/courses/hooks/use-courses";
import {
  canManageGrades,
  canViewGradeEntry,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

interface DraftRow {
  enrollmentId: string;
  score: string;
  observations: string;
}

export function GradeEntryPage() {
  const currentUser = useAuthStore((state) => state.user);
  const searchParams = useSearchParams();
  const effectivePeriodId = useEffectiveAcademicPeriodId();

  const [academicPeriodId, setAcademicPeriodId] = useState(
    effectivePeriodId ?? "",
  );
  const [courseId, setCourseId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [academicTermId, setAcademicTermId] = useState("");
  const [assessmentId, setAssessmentId] = useState(
    searchParams.get("assessmentId") ?? "",
  );
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (effectivePeriodId) setAcademicPeriodId(effectivePeriodId);
  }, [effectivePeriodId]);

  const { data: coursesData } = useCourses({
    page: 1,
    limit: 100,
    academicPeriodId: academicPeriodId || undefined,
  });

  const { data: assignmentsData } = useTeacherAssignments({
    page: 1,
    limit: 100,
    academicPeriodId: academicPeriodId || undefined,
    courseId: courseId || undefined,
    subjectId: subjectId || undefined,
  });

  const { data: terms } = useAcademicTerms(academicPeriodId);
  const teacherAssignmentId = assignmentsData?.data[0]?.id;

  const { data: assessmentsData } = useAssessments({
    page: 1,
    limit: 100,
    academicPeriodId: academicPeriodId || undefined,
    courseId: courseId || undefined,
    subjectId: subjectId || undefined,
    academicTermId: academicTermId || undefined,
    teacherAssignmentId,
  });

  const {
    data: entrySheet,
    isLoading,
    isError,
    refetch,
  } = useGradeEntrySheet(assessmentId || undefined);

  const { bulkMutation } = useGradeMutations();

  const subjects = useMemo(() => {
    const map = new Map<string, string>();
    for (const assignment of assignmentsData?.data ?? []) {
      map.set(assignment.subjectId, assignment.subjectName);
    }
    return [...map.entries()];
  }, [assignmentsData?.data]);

  useEffect(() => {
    if (!entrySheet) return;
    setDraftRows(
      entrySheet.rows.map((row) => ({
        enrollmentId: row.enrollmentId,
        score: row.score != null ? String(row.score) : "",
        observations: row.observations ?? "",
      })),
    );
  }, [entrySheet]);

  if (!canViewGradeEntry(currentUser?.role)) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    );
  }

  const canEdit = canManageGrades(currentUser?.role);
  const maxAssessmentScore = entrySheet?.assessment.maxScore;

  const handleSave = async () => {
    if (!assessmentId) return;
    setFeedback(null);

    const grades = draftRows
      .filter((row) => row.score.trim() !== "")
      .map((row) => ({
        enrollmentId: row.enrollmentId,
        score: Number(row.score),
        observations: row.observations || undefined,
      }));

    if (grades.length === 0) {
      setFeedback("Ingresa al menos una nota antes de guardar.");
      return;
    }

    const result = await bulkMutation.mutateAsync({ assessmentId, grades });
    setFeedback(
      `Guardado: ${result.createdCount} creadas, ${result.updatedCount} actualizadas` +
        (result.failedCount > 0 ? `, ${result.failedCount} con error.` : "."),
    );
    void refetch();
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Registro de notas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecciona período, curso, materia, trimestre y evaluación para ingresar calificaciones.
        </p>
      </header>

      <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <FilterField label="Curso / paralelo">
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Selecciona curso</option>
            {(coursesData?.data ?? []).map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} {course.section}
              </option>
            ))}
          </Select>
        </FilterField>

        <FilterField label="Materia">
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Selecciona materia</option>
            {subjects.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </FilterField>

        <FilterField label="Trimestre">
          <Select
            value={academicTermId}
            onChange={(e) => setAcademicTermId(e.target.value)}
          >
            <option value="">Selecciona trimestre</option>
            {(terms ?? []).map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </Select>
        </FilterField>

        <FilterField label="Evaluación">
          <Select
            value={assessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
          >
            <option value="">Selecciona evaluación</option>
            {(assessmentsData?.data ?? []).map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.title}
              </option>
            ))}
          </Select>
        </FilterField>
      </div>

      {!assessmentId ? (
        <p className="text-sm text-muted-foreground">
          Selecciona una evaluación para ver la lista de estudiantes.
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando hoja de notas…</p>
      ) : isError || !entrySheet ? (
        <p className="text-sm text-destructive">
          No se pudo cargar la hoja de registro de notas.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p className="font-medium">{entrySheet.assessment.title}</p>
            <p className="text-muted-foreground">
              Escala institucional: {entrySheet.gradingSchemeMinScore} –{" "}
              {entrySheet.gradingSchemeMaxScore} · Máximo evaluación:{" "}
              {entrySheet.assessment.maxScore}
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Estudiante</th>
                  <th className="px-4 py-3 font-medium">Nota</th>
                  <th className="px-4 py-3 font-medium">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {entrySheet.rows.map((row, index) => (
                  <tr key={row.enrollmentId} className="border-t border-border">
                    <td className="px-4 py-3">
                      {row.studentLastName}, {row.studentFirstName}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        max={maxAssessmentScore}
                        disabled={!canEdit}
                        value={draftRows[index]?.score ?? ""}
                        onChange={(event) => {
                          const next = [...draftRows];
                          next[index] = {
                            ...next[index],
                            score: event.target.value,
                          };
                          setDraftRows(next);
                        }}
                        aria-label={`Nota de ${row.studentFirstName} ${row.studentLastName}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        disabled={!canEdit}
                        value={draftRows[index]?.observations ?? ""}
                        onChange={(event) => {
                          const next = [...draftRows];
                          next[index] = {
                            ...next[index],
                            observations: event.target.value,
                          };
                          setDraftRows(next);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {canEdit ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button onClick={() => void handleSave()} disabled={bulkMutation.isPending}>
                {bulkMutation.isPending ? "Guardando…" : "Guardar notas"}
              </Button>
              {feedback ? (
                <p className="text-sm text-muted-foreground">{feedback}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
