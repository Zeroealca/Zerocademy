"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatAcademicPeriodOptionLabel } from "@/features/academic-periods/lib/format-academic-period-label";
import { useEffectiveAcademicPeriodId } from "@/features/academic-periods/hooks/use-academic-period-context";
import { useInstitutionAcademicPeriods } from "@/features/academic-periods/hooks/use-institution-academic-periods";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { CsvFormatSpec } from "@/features/students/components/csv-format-spec";
import { CSV_EXAMPLE_ROWS } from "@/features/students/constants";
import { useStudentMutations } from "@/features/students/hooks/use-student-mutations";
import {
  bulkImportSchema,
  type BulkImportFormInput,
} from "@/features/students/schemas/student.schema";
import type { BulkImportResult } from "@/features/students/types";
import { localizeApiMessage } from "@/lib/localize-api-message";
import { isSelectValueMissing } from "@/lib/select-utils";
import { canManageStudents, canViewStudents } from "@/lib/permissions";
import { useAuthStore } from "@/stores/use-auth-store";

export function StudentBulkImportPage() {
  const currentUser = useAuthStore((state) => state.user);
  const effectivePeriodId = useEffectiveAcademicPeriodId();
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const { bulkImportMutation } = useStudentMutations();

  const form = useForm<BulkImportFormInput>({
    resolver: zodResolver(bulkImportSchema),
    defaultValues: {
      csvContent: CSV_EXAMPLE_ROWS,
      courseId: "",
      academicPeriodId: effectivePeriodId ?? "",
    },
  });

  const academicPeriodId = form.watch("academicPeriodId");
  const { data: periodsData, isScopeReady, hasRegime } =
    useInstitutionAcademicPeriods();
  const { data: coursesData } = useCourses({
    page: 1,
    limit: 100,
    academicPeriodId: academicPeriodId || undefined,
    isActive: true,
  });

  if (!canViewStudents(currentUser?.role)) {
    return <AccessDenied href="/dashboard" label="Volver al panel" />;
  }

  if (!canManageStudents(currentUser?.role)) {
    return (
      <AccessDenied
        href="/students"
        label="Volver al listado"
        message="Solo los administradores pueden importar estudiantes."
      />
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const importResult = await bulkImportMutation.mutateAsync(values);
    setResult(importResult);
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/students">← Volver al listado</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Importación masiva de estudiantes</CardTitle>
          <CardDescription>
            Los datos de cada estudiante deben coincidir con el formulario de
            creación. Revisa el orden de columnas antes de pegar el archivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CsvFormatSpec />

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="academicPeriodId">Período académico</Label>
              <Controller
                name="academicPeriodId"
                control={form.control}
                render={({ field }) => {
                  const periods = periodsData?.data ?? [];
                  return (
                    <Select
                      id="academicPeriodId"
                      value={field.value}
                      onChange={(event) => {
                        field.onChange(event);
                        form.setValue("courseId", "");
                      }}
                    >
                      <option value="">
                        {!hasRegime
                          ? "Configura el régimen de la institución"
                          : "Seleccionar período"}
                      </option>
                      {isSelectValueMissing(
                        field.value,
                        periods.map((period) => period.id),
                      ) ? (
                        <option value={field.value}>
                          Cargando período seleccionado…
                        </option>
                      ) : null}
                      {periods.map((period) => (
                        <option key={period.id} value={period.id}>
                          {formatAcademicPeriodOptionLabel(period)}
                        </option>
                      ))}
                    </Select>
                  );
                }}
              />
              {form.formState.errors.academicPeriodId ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.academicPeriodId.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseId">Curso / paralelo</Label>
              <Controller
                name="courseId"
                control={form.control}
                render={({ field }) => {
                  const courses = coursesData?.data ?? [];
                  return (
                    <Select
                      id="courseId"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={!academicPeriodId}
                    >
                      <option value="">
                        {academicPeriodId
                          ? "Seleccionar curso"
                          : "Primero elige un período"}
                      </option>
                      {isSelectValueMissing(
                        field.value,
                        courses.map((course) => course.id),
                      ) ? (
                        <option value={field.value}>
                          Cargando curso seleccionado…
                        </option>
                      ) : null}
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name} ({course.section})
                        </option>
                      ))}
                    </Select>
                  );
                }}
              />
              {form.formState.errors.courseId ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.courseId.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="csvContent">Filas de datos</Label>
              <p className="text-xs text-muted-foreground">
                Pega solo filas de estudiantes (una por línea). No incluyas la
                línea de encabezado aquí si ya la tienes como referencia arriba.
              </p>
              <Textarea
                id="csvContent"
                rows={8}
                className="font-mono text-xs"
                placeholder="Pega una fila por estudiante, separando los campos con comas y terminando cada fila con punto y coma"
                {...form.register("csvContent")}
              />
            </div>

            <Button
              type="submit"
              disabled={bulkImportMutation.isPending || !isScopeReady}
            >
              {bulkImportMutation.isPending ? "Importando…" : "Vista previa e importar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result ? <ImportResultSummary result={result} /> : null}
    </div>
  );
}

function ImportResultSummary({ result }: { result: BulkImportResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resultado de la importación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-3">
          <p>
            <span className="font-medium text-foreground">Importados:</span>{" "}
            {result.importedCount}
          </p>
          <p>
            <span className="font-medium text-foreground">Omitidos:</span>{" "}
            {result.skippedCount}
          </p>
          <p>
            <span className="font-medium text-foreground">Fallidos:</span>{" "}
            {result.failedCount}
          </p>
        </div>

        {result.errors.length > 0 ? (
          <div>
            <p className="mb-2 font-medium text-destructive">
              Errores de validación
            </p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              {result.errors.map((error) => (
                <li key={`${error.row}-${error.message}`}>
                  Fila {error.row}
                  {error.email ? ` (${error.email})` : ""}:{" "}
                  {localizeApiMessage(error.message)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {result.duplicateWarnings.length > 0 ? (
          <div>
            <p className="mb-2 font-medium">Advertencias</p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              {result.duplicateWarnings.map((warning) => (
                <li key={`${warning.row}-${warning.nationalId}`}>
                  Fila {warning.row}: {localizeApiMessage(warning.message)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AccessDenied({
  href,
  label,
  message,
}: {
  href: string;
  label: string;
  message?: string;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
      <Button asChild variant="outline">
        <Link href={href}>{label}</Link>
      </Button>
    </div>
  );
}
