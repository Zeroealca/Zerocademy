"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  academicUnitSchema,
  type AcademicUnitFormValues,
} from "@/features/planning/schemas/academic-unit.schema";
import type { AcademicUnit, AcademicUnitInput } from "@/features/planning/types";
import { ApiError } from "@/lib/api-error";

interface AcademicUnitFormProps {
  academicPlanEndDate: string | null;
  academicPlanStartDate: string | null;
  onCancel: () => void;
  onSubmit: (values: AcademicUnitInput) => Promise<void>;
  submitLabel: string;
  unit?: AcademicUnit;
}

export function AcademicUnitForm({
  academicPlanEndDate,
  academicPlanStartDate,
  onCancel,
  onSubmit,
  submitLabel,
  unit,
}: AcademicUnitFormProps) {
  const form = useForm<AcademicUnitFormValues>({
    resolver: zodResolver(academicUnitSchema),
    defaultValues: toValues(unit),
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(clean(values));
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "No se pudo guardar la unidad.";
      form.setError("root", { message });

      if (error instanceof ApiError) {
        error.details?.forEach((detail) => {
          const field = detail.field as keyof AcademicUnitFormValues;
          if (field in values) {
            form.setError(field, { message: String(detail.message) });
          }
        });
      }
    }
  });

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
      <Field error={form.formState.errors.title?.message} id="academic-unit-title" label="Título">
        <Input {...form.register("title")} autoFocus id="academic-unit-title" />
      </Field>
      <Field error={form.formState.errors.startDate?.message} id="academic-unit-start-date" label="Fecha de inicio">
        <Input
          id="academic-unit-start-date"
          max={academicPlanEndDate ?? undefined}
          min={academicPlanStartDate ?? undefined}
          type="date"
          {...form.register("startDate")}
        />
      </Field>
      <Field error={form.formState.errors.endDate?.message} id="academic-unit-end-date" label="Fecha de fin">
        <Input
          id="academic-unit-end-date"
          max={academicPlanEndDate ?? undefined}
          min={academicPlanStartDate ?? undefined}
          type="date"
          {...form.register("endDate")}
        />
      </Field>
      <Area form={form} id="academic-unit-description" label="Descripción" name="description" />
      <Area form={form} id="academic-unit-objectives" label="Objetivos de aprendizaje" name="objectives" />
      <Area form={form} id="academic-unit-contents" label="Contenidos" name="contents" />
      <Area form={form} id="academic-unit-activities" label="Actividades" name="activities" />
      <Area form={form} id="academic-unit-resources" label="Recursos" name="resources" />
      <Area form={form} id="academic-unit-evaluation-notes" label="Notas de evaluación" name="evaluationNotes" />
      {form.formState.errors.root ? (
        <p className="text-sm text-destructive sm:col-span-2" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? "Guardando…" : submitLabel}
        </Button>
        <Button onClick={onCancel} type="button" variant="outline">
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function Field({
  children,
  error,
  id,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  id: string;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function Area({
  form,
  id,
  label,
  name,
}: {
  form: ReturnType<typeof useForm<AcademicUnitFormValues>>;
  id: string;
  label: string;
  name: Exclude<keyof AcademicUnitFormValues, "title" | "startDate" | "endDate">;
}) {
  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={4} {...form.register(name)} />
      {form.formState.errors[name]?.message ? (
        <p className="text-sm text-destructive">{form.formState.errors[name].message}</p>
      ) : null}
    </div>
  );
}

function toValues(unit?: AcademicUnit): AcademicUnitFormValues {
  return {
    title: unit?.title ?? "",
    description: unit?.description ?? "",
    objectives: unit?.objectives ?? "",
    contents: unit?.contents ?? "",
    activities: unit?.activities ?? "",
    resources: unit?.resources ?? "",
    evaluationNotes: unit?.evaluationNotes ?? "",
    startDate: unit?.startDate ?? "",
    endDate: unit?.endDate ?? "",
  };
}

function clean(values: AcademicUnitFormValues): AcademicUnitInput {
  const optional = (value: string | undefined) => value || undefined;

  return {
    title: values.title.trim(),
    description: optional(values.description),
    objectives: optional(values.objectives),
    contents: optional(values.contents),
    activities: optional(values.activities),
    resources: optional(values.resources),
    evaluationNotes: optional(values.evaluationNotes),
    startDate: optional(values.startDate),
    endDate: optional(values.endDate),
  };
}
