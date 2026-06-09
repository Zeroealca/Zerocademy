"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { useAcademicTerms } from "@/features/academic-periods/hooks/use-academic-terms";
import { useInstitutionAcademicPeriods } from "@/features/academic-periods/hooks/use-institution-academic-periods";
import { useGrades } from "@/features/grades/hooks/use-grades";
import type { GradesFilters } from "@/features/grades/types";
import { canViewOwnGrades } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

const DEFAULT_FILTERS: GradesFilters = { page: 1, limit: 50 };

export function StudentGradesPage() {
  const currentUser = useAuthStore((state) => state.user);
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const [filters, setFilters] = useState<GradesFilters>(DEFAULT_FILTERS);
  const { data: periodsData } = useInstitutionAcademicPeriods();
  const { data: terms } = useAcademicTerms(filters.academicPeriodId ?? "");
  const { data, isLoading, isError, refetch } = useGrades(filters);

  useEffect(() => {
    if (effectivePeriodId && filters.academicPeriodId !== effectivePeriodId) {
      setFilters((prev) => ({
        ...prev,
        academicPeriodId: effectivePeriodId,
        page: 1,
      }));
    }
  }, [effectivePeriodId, filters.academicPeriodId]);

  if (!canViewOwnGrades(currentUser?.role)) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    );
  }

  const subjects = [
    ...new Map(
      (data?.data ?? []).map((grade) => [
        grade.assessment.subjectId,
        grade.assessment.subjectName,
      ]),
    ).entries(),
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Mis notas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulta tus calificaciones por período, trimestre y materia.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Período académico</Label>
          <Select
            value={filters.academicPeriodId ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                academicPeriodId: event.target.value || undefined,
                academicTermId: undefined,
                page: 1,
              }))
            }
          >
            <option value="">Todos</option>
            {(periodsData?.data ?? []).map((period) => (
              <option key={period.id} value={period.id}>
                {period.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Trimestre</Label>
          <Select
            value={filters.academicTermId ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                academicTermId: event.target.value || undefined,
                page: 1,
              }))
            }
          >
            <option value="">Todos</option>
            {(terms ?? []).map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Materia</Label>
          <Select
            value={filters.subjectId ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                subjectId: event.target.value || undefined,
                page: 1,
              }))
            }
          >
            <option value="">Todas</option>
            {subjects.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando notas…</p>
      ) : isError ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">No se pudieron cargar las notas.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      ) : (data?.data.length ?? 0) === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No hay notas publicadas con los filtros seleccionados.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Evaluación</th>
                <th className="px-4 py-3 font-medium">Materia</th>
                <th className="px-4 py-3 font-medium">Trimestre</th>
                <th className="px-4 py-3 font-medium">Nota</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((grade) => (
                <tr key={grade.id} className="border-t border-border">
                  <td className="px-4 py-3">{grade.assessment.title}</td>
                  <td className="px-4 py-3">{grade.assessment.subjectName}</td>
                  <td className="px-4 py-3">
                    {grade.assessment.academicTermName}
                  </td>
                  <td className="px-4 py-3 font-medium">{grade.score}</td>
                  <td className="px-4 py-3">
                    {grade.assessment.assessmentDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
