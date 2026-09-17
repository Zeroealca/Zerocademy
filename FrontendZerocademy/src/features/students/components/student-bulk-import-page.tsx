"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { bulkImportStudents } from "@/features/students/api/students.api";
import { ApiError } from "@/lib/api-error";
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
import { Badge } from "@/components/ui/badge";
import { GENDER_LABELS } from "@/features/students/constants";
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
  const [preview, setPreview] = useState<{ values: BulkImportFormInput; result: BulkImportResult } | null>(null);
  const [previewPending, setPreviewPending] = useState(false);
  const { bulkImportMutation } = useStudentMutations();

  const form = useForm<BulkImportFormInput>({
    resolver: zodResolver(bulkImportSchema),
    defaultValues: {
      csvContent: CSV_EXAMPLE_ROWS,
      courseId: "",
      academicPeriodId: effectivePeriodId ?? "",
    },
  });

  const currentValues = useWatch({ control: form.control });
  const academicPeriodId = currentValues.academicPeriodId;
  const previewCurrent = preview !== null &&
    currentValues.csvContent === preview.values.csvContent &&
    currentValues.courseId === preview.values.courseId &&
    currentValues.academicPeriodId === preview.values.academicPeriodId;
  const { data: periodsData, isLoading: periodsLoading, isScopeReady, hasRegime } =
    useInstitutionAcademicPeriods({ page: 1, limit: 100, status: "ACTIVE" });
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
    if (!periodsData?.data.some((period) => period.id === values.academicPeriodId)) {
      form.setError("academicPeriodId", { message: "Selecciona un periodo lectivo activo." });
      return;
    }
    form.clearErrors("root");
    setPreview(null);
    setResult(null);
    setPreviewPending(true);
    try {
      const previewResult = await bulkImportStudents({ ...values, dryRun: true });
      if (!Array.isArray(previewResult.rows)) {
        form.setError("root", { message: "El backend no devolvió las filas de vista previa. Reinicia el backend actualizado y vuelve a intentarlo." });
        return;
      }
      setPreview({ values, result: previewResult });
    } catch (error) {
      form.setError("root", { message: error instanceof ApiError ? error.message : "No se pudo generar la vista previa." });
    } finally {
      setPreviewPending(false);
    }
  });

  const confirmImport = async () => {
    if (!preview || !previewCurrent || bulkImportMutation.isPending) return;
    form.clearErrors("root");
    try {
      const importResult = await bulkImportMutation.mutateAsync(preview.values);
      setResult(importResult);
      setPreview(null);
    } catch (error) {
      form.setError("root", { message: error instanceof ApiError ? error.message : "No se pudo importar el archivo." });
    }
  };

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

          <form onSubmit={onSubmit} className="space-y-4" onChange={() => setResult(null)}>
            <fieldset disabled={previewPending || bulkImportMutation.isPending} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="academicPeriodId">Período académico *</Label>
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
                      {periodsLoading && isSelectValueMissing(
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
              <Label htmlFor="courseId">Curso / paralelo *</Label>
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
              <Label htmlFor="csvContent">Filas de datos *</Label>
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

            {form.formState.errors.csvContent ? <p className="text-sm text-destructive">{form.formState.errors.csvContent.message}</p> : null}
            {form.formState.errors.root ? <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p> : null}

            <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={previewPending || bulkImportMutation.isPending || !isScopeReady}
            >
              {previewPending ? "Validando..." : "Vista previa"}
            </Button>
            <Button type="button" onClick={() => void confirmImport()}
              disabled={!previewCurrent || !preview?.result.importedCount || previewPending || bulkImportMutation.isPending || !isScopeReady}>
              {bulkImportMutation.isPending ? "Importando..." : "Confirmar importación"}
            </Button>
            </div>
            </fieldset>
          </form>
          {previewCurrent && preview ? <ImportResultSummary result={preview.result} isPreview /> : null}
        </CardContent>
      </Card>

      {result ? <ImportResultSummary result={result} /> : null}
    </div>
  );
}

function ImportResultSummary({ result, isPreview = false }: { result: BulkImportResult; isPreview?: boolean }) {
  return (
    <section aria-label={isPreview ? "Vista previa" : "Resultado de la importación"}>
      <CardHeader>
        <CardTitle className="text-lg">{isPreview ? "Vista previa" : "Resultado de la importación"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-3">
          <p>
            <span className="font-medium text-foreground">{isPreview ? "Listos para importar:" : "Importados:"}</span>{" "}
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

        {result.rows?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  {["Fila", "Estudiante", "Correo", "Cédula", "Nacimiento", "Género", "Teléfono", "Dirección", "Contacto de emergencia", "Resultado", "Detalle"].map((label) => (
                    <th key={label} className="whitespace-nowrap px-3 py-2 font-medium">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.row} className="border-b border-border">
                    <td className="px-3 py-2">{row.row}</td>
                    <td className="whitespace-nowrap px-3 py-2">{`${row.firstName} ${row.lastName}`.trim() || "—"}</td>
                    <td className="px-3 py-2">{row.email || "—"}</td>
                    <td className="px-3 py-2">{row.nationalId || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2">{row.birthDate || "—"}</td>
                    <td className="px-3 py-2">{row.gender ? GENDER_LABELS[row.gender as keyof typeof GENDER_LABELS] ?? row.gender : "—"}</td>
                    <td className="px-3 py-2">{row.phone || "—"}</td>
                    <td className="px-3 py-2">{row.address || "—"}</td>
                    <td className="px-3 py-2">{row.emergencyContact || "—"}</td>
                    <td className="px-3 py-2">
                      <Badge className={row.status === "failed" ? "border-destructive text-destructive" : undefined} variant={row.status === "failed" ? "outline" : row.status === "skipped" ? "muted" : "success"}>
                        {row.status === "failed" ? "Fallido" : row.status === "skipped" ? "Omitido" : isPreview ? "Listo para importar" : "Importado"}
                      </Badge>
                    </td>
                    <td className="min-w-48 px-3 py-2">{row.message ? localizeApiMessage(row.message) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

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
    </section>
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
